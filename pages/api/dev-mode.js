// pages/api/dev-mode.js - Toggle development mode
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'GET') {
    const devMode = process.env.DEV_MODE === 'true';
    return res.status(200).json({ 
      devMode,
      message: devMode ? "Development mode ON - emails will NOT be forwarded" : "Production mode - emails will be forwarded"
    });
  }
  
  res.status(405).json({ error: "Method not allowed" });
}