export default async function handler(req, res) {
  try {
    console.log("Environment check...");

    const hasGmail =
      !!process.env.GMAIL_EMAIL && !!process.env.GMAIL_APP_PASSWORD;
    const hasIcloud =
      !!process.env.ICLOUD_EMAIL && !!process.env.ICLOUD_PASSWORD;
    const hasNotion = !!process.env.NOTION_TOKEN;

    res.status(200).json({
      success: true,
      hasGmail,
      hasIcloud,
      hasNotion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
