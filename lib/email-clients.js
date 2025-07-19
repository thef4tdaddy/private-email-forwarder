// lib/email-clients.js
import Imap from "imap";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";

// Helper function to add timeout to promises
function withTimeout(promise, timeoutMs = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

export class GmailClient {
  constructor() {
    this.config = {
      user: process.env.GMAIL_EMAIL,
      password: process.env.GMAIL_APP_PASSWORD,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 5000,
      keepalive: false,
    };
  }

  async getRecentEmails(since = new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    return withTimeout(this._getEmails(since), 25000);
  }

  async _getEmails(since) {
    return new Promise((resolve, reject) => {
      console.log("Connecting to Gmail IMAP...");
      const imap = new Imap(this.config);
      const emails = [];
      let connected = false;

      const cleanup = () => {
        if (connected) {
          try {
            imap.end();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("Gmail IMAP connection timed out"));
      }, 20000);

      imap.once("ready", () => {
        connected = true;
        console.log("Gmail IMAP connected");

        imap.openBox("INBOX", true, (err) => {
          if (err) {
            cleanup();
            clearTimeout(timeoutId);
            return reject(err);
          }

          const searchCriteria = [["SINCE", since]];
          imap.search(searchCriteria, (err, results) => {
            if (err) {
              cleanup();
              clearTimeout(timeoutId);
              return reject(err);
            }

            if (!results || !results.length) {
              console.log("No recent emails found in Gmail");
              cleanup();
              clearTimeout(timeoutId);
              return resolve([]);
            }

            console.log(`Found ${results.length} recent emails in Gmail`);

            const limitedResults = results.slice(-20);
            const fetch = imap.fetch(limitedResults, { bodies: "" });

            fetch.on("message", (msg) => {
              let buffer = "";
              msg.on("body", (stream) => {
                stream.on(
                  "data",
                  (chunk) => (buffer += chunk.toString("utf8"))
                );
                stream.once("end", async () => {
                  try {
                    const parsed = await simpleParser(buffer);
                    emails.push({
                      id:
                        parsed.messageId ||
                        `gmail-${Date.now()}-${Math.random()}`,
                      subject: parsed.subject || "No Subject",
                      from: parsed.from?.text || "Unknown Sender",
                      to: parsed.to?.text || "",
                      date: parsed.date || new Date(),
                      body: parsed.text || parsed.html || "",
                      source: "gmail",
                    });
                  } catch (e) {
                    console.error("Gmail parse error:", e);
                  }
                });
              });
            });

            fetch.once("end", () => {
              cleanup();
              clearTimeout(timeoutId);
              console.log(`Successfully parsed ${emails.length} Gmail emails`);
              resolve(emails);
            });

            fetch.once("error", (err) => {
              cleanup();
              clearTimeout(timeoutId);
              reject(err);
            });
          });
        });
      });

      imap.once("error", (err) => {
        console.error("Gmail IMAP error:", err);
        cleanup();
        clearTimeout(timeoutId);
        reject(err);
      });

      imap.connect();
    });
  }
}

export class ICloudClient {
  constructor() {
    this.config = {
      user: process.env.ICLOUD_EMAIL,
      password: process.env.ICLOUD_PASSWORD,
      host: "imap.mail.me.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 5000,
      keepalive: false,
    };
  }

  async getRecentEmails(since = new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    return withTimeout(this._getEmails(since), 25000);
  }

  async _getEmails(since) {
    return new Promise((resolve, reject) => {
      console.log("Connecting to iCloud IMAP...");
      const imap = new Imap(this.config);
      const emails = [];
      let connected = false;

      const cleanup = () => {
        if (connected) {
          try {
            imap.end();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("iCloud IMAP connection timed out"));
      }, 20000);

      imap.once("ready", () => {
        connected = true;
        console.log("iCloud IMAP connected");

        imap.openBox("INBOX", true, (err) => {
          if (err) {
            cleanup();
            clearTimeout(timeoutId);
            return reject(err);
          }

          const searchCriteria = [["SINCE", since]];
          imap.search(searchCriteria, (err, results) => {
            if (err) {
              cleanup();
              clearTimeout(timeoutId);
              return reject(err);
            }

            if (!results || !results.length) {
              console.log("No recent emails found in iCloud");
              cleanup();
              clearTimeout(timeoutId);
              return resolve([]);
            }

            console.log(`Found ${results.length} recent emails in iCloud`);

            const limitedResults = results.slice(-20);
            const fetch = imap.fetch(limitedResults, { bodies: "" });

            fetch.on("message", (msg) => {
              let buffer = "";
              msg.on("body", (stream) => {
                stream.on(
                  "data",
                  (chunk) => (buffer += chunk.toString("utf8"))
                );
                stream.once("end", async () => {
                  try {
                    const parsed = await simpleParser(buffer);
                    emails.push({
                      id:
                        parsed.messageId ||
                        `icloud-${Date.now()}-${Math.random()}`,
                      subject: parsed.subject || "No Subject",
                      from: parsed.from?.text || "Unknown Sender",
                      to: parsed.to?.text || "",
                      date: parsed.date || new Date(),
                      body: parsed.text || parsed.html || "",
                      source: "icloud",
                    });
                  } catch (e) {
                    console.error("iCloud parse error:", e);
                  }
                });
              });
            });

            fetch.once("end", () => {
              cleanup();
              clearTimeout(timeoutId);
              console.log(`Successfully parsed ${emails.length} iCloud emails`);
              resolve(emails);
            });

            fetch.once("error", (err) => {
              cleanup();
              clearTimeout(timeoutId);
              reject(err);
            });
          });
        });
      });

      imap.once("error", (err) => {
        console.error("iCloud IMAP error:", err);
        cleanup();
        clearTimeout(timeoutId);
        reject(err);
      });

      imap.connect();
    });
  }
}

export class EmailSender {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }

  async sendEmail(to, subject, body) {
    try {
      console.log(`Sending email to ${to}...`);

      await withTimeout(
        this.transporter.sendMail({
          from: process.env.SENDER_EMAIL,
          to,
          subject,
          html: body,
        }),
        15000
      );

      console.log("Email sent successfully");
      return true;
    } catch (error) {
      console.error("Send error:", error);
      return false;
    }
  }
}
