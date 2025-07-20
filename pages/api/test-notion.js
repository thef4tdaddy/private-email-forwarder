// pages/api/test-notion.js - Test Notion database connections
import { NotionDashboard } from "../../lib/notion-client.js";

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const notion = new NotionDashboard();
    const results = {};

    // Test each database connection
    const databases = [
      { name: 'activity', id: process.env.NOTION_ACTIVITY_DB },
      { name: 'preferences', id: process.env.NOTION_PREFERENCES_DB },
      { name: 'replies', id: process.env.NOTION_REPLIES_DB },
      { name: 'stats', id: process.env.NOTION_STATS_DB },
      { name: 'manualForward', id: process.env.NOTION_MANUAL_FORWARD_DB }
    ];

    for (const db of databases) {
      results[db.name] = {
        configured: !!db.id,
        id: db.id || 'NOT_SET'
      };

      if (db.id) {
        try {
          // Test if we can query the database
          const testQuery = await notion.notion.databases.query({
            database_id: db.id,
            page_size: 1
          });
          
          results[db.name].accessible = true;
          results[db.name].recordCount = testQuery.results.length;
        } catch (error) {
          results[db.name].accessible = false;
          results[db.name].error = error.message;
        }
      } else {
        results[db.name].accessible = false;
        results[db.name].error = 'Environment variable not set';
      }
    }

    // Test writing to activity database (safest test)
    if (process.env.NOTION_ACTIVITY_DB) {
      try {
        await notion.logActivity(
          { subject: 'Test Connection', from: 'system@test.com', source: 'system' },
          'test',
          'Testing Notion database connections'
        );
        results.activityWriteTest = { success: true };
      } catch (error) {
        results.activityWriteTest = { success: false, error: error.message };
      }
    }

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      databases: results,
      summary: {
        totalDatabases: databases.length,
        configured: databases.filter(db => db.id).length,
        accessible: Object.values(results).filter(r => r.accessible === true).length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}