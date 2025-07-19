// pages/api/check-emails.js
import {
  GmailClient,
  ICloudClient,
  EmailSender,
} from "../../lib/email-clients.js";
import { ReceiptDetector } from "../../lib/receipt-detector.js";
import { PreferenceManager } from "../../lib/preferences.js";
import { NotionDashboard } from "../../lib/notion-client.js";
import { CONFIG } from "../../lib/config.js";

// Configure Vercel function timeout
export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const startTime = Date.now();
  console.log("🚀 Starting email check at", new Date().toISOString());

  try {
    // Initialize clients
    const gmailClient = new GmailClient();
    const icloudClient = new ICloudClient();
    const emailSender = new EmailSender();
    const notion = new NotionDashboard();

    console.log("📧 Fetching emails from both accounts...");

    // Get recent emails from both accounts with individual error handling
    const emailPromises = await Promise.allSettled([
      gmailClient.getRecentEmails().catch((err) => {
        console.error("❌ Gmail fetch error:", err.message);
        return [];
      }),
      icloudClient.getRecentEmails().catch((err) => {
        console.error("❌ iCloud fetch error:", err.message);
        return [];
      }),
    ]);

    // Extract successful results
    const gmailEmails =
      emailPromises[0].status === "fulfilled" ? emailPromises[0].value : [];
    const icloudEmails =
      emailPromises[1].status === "fulfilled" ? emailPromises[1].value : [];

    console.log(
      `📊 Email counts - Gmail: ${gmailEmails.length}, iCloud: ${icloudEmails.length}`
    );

    const allEmails = [...gmailEmails, ...icloudEmails];

    if (allEmails.length === 0) {
      console.log("📭 No emails found");
      await notion.updateStats({
        processed: 0,
        forwarded: 0,
        skipped: 0,
        gmailConnected: emailPromises[0].status === "fulfilled",
        icloudConnected: emailPromises[1].status === "fulfilled",
      });

      return res.status(200).json({
        success: true,
        processed: 0,
        forwarded: 0,
        skipped: 0,
        message: "No emails found",
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      });
    }

    // Get preferences from both KV store and Notion (Notion can override)
    console.log("⚙️ Loading preferences...");
    const [kvPreferences, notionPreferences] = await Promise.allSettled([
      PreferenceManager.getBlocklist().catch((err) => {
        console.error("⚠️ KV preferences error:", err.message);
        return { senders: [], categories: [], whitelist: [] };
      }),
      notion.getPreferencesFromNotion().catch((err) => {
        console.error("⚠️ Notion preferences error:", err.message);
        return { senders: [], categories: [], whitelist: [] };
      }),
    ]);

    // Merge preferences (Notion takes priority for manual overrides)
    const kvPrefs =
      kvPreferences.status === "fulfilled"
        ? kvPreferences.value
        : { senders: [], categories: [], whitelist: [] };
    const notionPrefs =
      notionPreferences.status === "fulfilled"
        ? notionPreferences.value
        : { senders: [], categories: [], whitelist: [] };

    const preferences = {
      senders: [...new Set([...kvPrefs.senders, ...notionPrefs.senders])],
      categories: [
        ...new Set([...kvPrefs.categories, ...notionPrefs.categories]),
      ],
      whitelist: [...new Set([...kvPrefs.whitelist, ...notionPrefs.whitelist])],
    };

    console.log(
      `📋 Loaded preferences - Blocked senders: ${preferences.senders.length}, Categories: ${preferences.categories.length}, Whitelist: ${preferences.whitelist.length}`
    );

    const processedEmails = await PreferenceManager.getProcessedEmails().catch(
      (err) => {
        console.error("⚠️ Processed emails error:", err.message);
        return [];
      }
    );

    let forwardedCount = 0;
    let skippedCount = 0;
    let processedCount = 0;

    console.log("🔍 Processing emails...");

    for (const email of allEmails) {
      try {
        // Skip if already processed
        if (processedEmails.includes(email.id)) {
          console.log(`⏭️ Skipping already processed: ${email.subject}`);
          continue;
        }

        processedCount++;

        // Check if it's a receipt
        if (!ReceiptDetector.isReceipt(email)) {
          console.log(`📄 Not a receipt: ${email.subject}`);
          await notion
            .logActivity(email, "processed", "Not a receipt")
            .catch((err) => console.error("⚠️ Notion log error:", err.message));
          await PreferenceManager.markAsProcessed(email.id).catch((err) =>
            console.error("⚠️ Mark processed error:", err.message)
          );
          continue;
        }

        console.log(`🧾 Receipt detected: ${email.subject}`);

        // Check if blocked (using merged preferences)
        if (
          await PreferenceManager.isBlockedWithPreferences(email, preferences)
        ) {
          console.log(`🚫 Blocking email: ${email.subject}`);
          await notion
            .logActivity(email, "blocked", "Matches block rule")
            .catch((err) => console.error("⚠️ Notion log error:", err.message));
          skippedCount++;
          await PreferenceManager.markAsProcessed(email.id).catch((err) =>
            console.error("⚠️ Mark processed error:", err.message)
          );
          continue;
        }

        // Forward the email
        const forwardSubject = CONFIG.FORWARD_TEMPLATE.subject.replace(
          "{originalSubject}",
          email.subject
        );
        const amount = notion.extractAmount(email.body || email.subject);
        const category = notion.categorizeEmail(email);

        console.log(
          `📤 Forwarding email: ${
            email.subject
          } (Category: ${category}, Amount: ${
            amount ? "$" + amount.toFixed(2) : "N/A"
          })`
        );

        const forwardBody = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 600;">📧 Receipt Forwarded</h2>
              <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Automatically detected and forwarded</p>
            </div>
            
            <div style="padding: 24px; border: 1px solid #e1e5e9; border-top: none;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; font-size: 14px;">
                <div>
                  <strong style="color: #37352f;">From:</strong><br>
                  <span style="color: #6b7280;">${email.from}</span>
                </div>
                <div>
                  <strong style="color: #37352f;">Date:</strong><br>
                  <span style="color: #6b7280;">${email.date.toLocaleDateString()}</span>
                </div>
                <div>
                  <strong style="color: #37352f;">Category:</strong><br>
                  <span style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; color: #374151; font-size: 12px;">${category}</span>
                </div>
                <div>
                  <strong style="color: #37352f;">Amount:</strong><br>
                  <span style="color: ${
                    amount ? "#059669" : "#6b7280"
                  }; font-weight: ${amount ? "600" : "normal"};">${
          amount ? "$" + amount.toFixed(2) : "Not detected"
        }</span>
                </div>
              </div>
              
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
                <h4 style="margin: 0 0 8px 0; color: #37352f; font-size: 14px;">Original Subject:</h4>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">${
                  email.subject
                }</p>
              </div>
              
              <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; max-height: 200px; overflow-y: auto; font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; font-size: 13px; line-height: 1.5;">
                ${(email.body || "").substring(0, 1000)}${
          (email.body || "").length > 1000 ? "..." : ""
        }
              </div>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 12px 12px;">
              <h4 style="margin: 0 0 12px 0; color: #37352f; font-size: 14px;">🎛️ Quick Commands</h4>
              <div style="font-size: 13px; color: #6b7280; line-height: 1.6;">
                Reply with any of these commands:<br>
                • <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px;">STOP ${
                  email.from.split("@")[0]
                }</code> - Block this sender<br>
                • <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px;">STOP ${category.toLowerCase()}</code> - Block this category<br>
                • <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px;">MORE ${
                  email.from.split("@")[0]
                }</code> - Always forward from this sender<br>
                • <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px;">SETTINGS</code> - View your preferences
              </div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
                📊 View detailed dashboard in Notion
              </div>
            </div>
          </div>
        `;

        // Check if we have time left (leave 5 seconds buffer)
        const timeElapsed = Date.now() - startTime;
        if (timeElapsed > 25000) {
          // 25 seconds
          console.log("⏰ Approaching timeout, saving progress and exiting...");
          break;
        }

        const success = await emailSender
          .sendEmail(process.env.WIFE_EMAIL, forwardSubject, forwardBody)
          .catch((err) => {
            console.error("📧 Send email error:", err.message);
            return false;
          });

        if (success) {
          forwardedCount++;
          await notion
            .logActivity(
              email,
              "forwarded",
              `Category: ${category}${
                amount ? `, Amount: $${amount.toFixed(2)}` : ""
              }`
            )
            .catch((err) => console.error("⚠️ Notion log error:", err.message));
          console.log(`✅ Successfully forwarded: ${email.subject}`);
        } else {
          await notion
            .logActivity(email, "failed", "Send failed")
            .catch((err) => console.error("⚠️ Notion log error:", err.message));
          console.error(`❌ Failed to forward: ${email.subject}`);
        }

        await PreferenceManager.markAsProcessed(email.id).catch((err) =>
          console.error("⚠️ Mark processed error:", err.message)
        );
      } catch (emailError) {
        console.error(
          `❌ Error processing email ${email.subject}:`,
          emailError.message
        );
        continue;
      }
    }

    console.log("📊 Updating stats in Notion...");

    // Update stats in Notion
    await notion
      .updateStats({
        processed: processedCount,
        forwarded: forwardedCount,
        skipped: skippedCount,
        gmailConnected: emailPromises[0].status === "fulfilled",
        icloudConnected: emailPromises[1].status === "fulfilled",
      })
      .catch((err) => {
        console.error("⚠️ Stats update error:", err.message);
      });

    console.log("🔄 Syncing preferences to Notion...");

    // Sync current preferences to Notion
    await notion.updatePreferences(preferences).catch((err) => {
      console.error("⚠️ Preferences sync error:", err.message);
    });

    const duration = Date.now() - startTime;
    console.log(
      `✅ Email check completed in ${duration}ms - Processed: ${processedCount}, Forwarded: ${forwardedCount}, Skipped: ${skippedCount}`
    );

    res.status(200).json({
      success: true,
      processed: processedCount,
      forwarded: forwardedCount,
      skipped: skippedCount,
      totalEmails: allEmails.length,
      gmailConnected: emailPromises[0].status === "fulfilled",
      icloudConnected: emailPromises[1].status === "fulfilled",
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("💥 Email check fatal error:", error);

    // Try to log error to Notion if possible
    try {
      const notion = new NotionDashboard();
      await notion.logActivity(
        { subject: "System Error", from: "system", source: "system" },
        "error",
        `${error.message} (Duration: ${duration}ms)`
      );
    } catch (notionError) {
      console.error("❌ Could not log error to Notion:", notionError.message);
    }

    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
}
