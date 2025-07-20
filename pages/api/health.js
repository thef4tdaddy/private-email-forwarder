// pages/api/health.js - Simple health check endpoint
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  if (req.method !== "GET") {
    return res.status(405).json({ 
      success: false,
      error: "Method not allowed",
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Basic environment check - only check variables that are actually required
    const envCheck = {
      hasNotionToken: !!process.env.NOTION_TOKEN,
      hasNotionActivityDb: !!process.env.NOTION_ACTIVITY_DB,
      hasNotionPreferencesDb: !!process.env.NOTION_PREFERENCES_DB,
      hasNotionRepliesDb: !!process.env.NOTION_REPLIES_DB,
      hasNotionStatsDb: !!process.env.NOTION_STATS_DB,
      hasNotionManualForwardDb: !!process.env.NOTION_MANUAL_FORWARD_DB,
    };

    // Optional environment variables (won't fail health check)
    const optionalEnvCheck = {
      hasWifeEmail: !!process.env.WIFE_EMAIL,
      hasGmailCredentials: !!(process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD),
      hasIcloudCredentials: !!(process.env.ICLOUD_EMAIL && process.env.ICLOUD_PASSWORD),
      hasKvUrl: !!process.env.KV_URL,
    };

    // Test module loading
    let moduleLoadingErrors = [];
    
    try {
      // Test if we can import the problematic modules
      const { GmailClient } = await import('../../lib/email-clients');
      console.log("Successfully imported GmailClient");
    } catch (error) {
      moduleLoadingErrors.push(`email-clients: ${error.message}`);
    }

    const allRequiredPresent = Object.values(envCheck).every(Boolean);
    
    res.status(200).json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: {
        required: envCheck,
        optional: optionalEnvCheck
      },
      moduleLoadingErrors,
      allRequiredEnvVarsPresent: allRequiredPresent,
      hasModuleLoadingErrors: moduleLoadingErrors.length > 0,
      summary: {
        requiredVars: `${Object.values(envCheck).filter(Boolean).length}/${Object.keys(envCheck).length}`,
        optionalVars: `${Object.values(optionalEnvCheck).filter(Boolean).length}/${Object.keys(optionalEnvCheck).length}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Health check failed",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}