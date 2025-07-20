// pages/index.js - Comprehensive Receipt Forwarder Dashboard
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [apiData, setApiData] = useState({});
  const [notionData, setNotionData] = useState({});
  const [healthData, setHealthData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [notionTest, healthCheck] = await Promise.all([
        fetch('/api/test-notion').then(r => r.json()),
        fetch('/api/health').then(r => r.json())
      ]);
      
      setNotionData(notionTest);
      setHealthData(healthCheck);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const apis = [
    {
      name: 'check-emails',
      description: 'Main email processing - checks Gmail/iCloud for receipts',
      status: 'core',
      category: 'Core'
    },
    {
      name: 'process-replies', 
      description: 'Processes wife\'s reply commands (STOP, MORE, etc.)',
      status: 'core',
      category: 'Core'
    },
    {
      name: 'manual-forward',
      description: 'Manual forwarding rules and processing',
      status: 'core', 
      category: 'Core'
    },
    {
      name: 'health',
      description: 'System health check and environment validation',
      status: 'utility',
      category: 'Monitoring'
    },
    {
      name: 'test-notion',
      description: 'Tests all Notion database connections',
      status: 'utility',
      category: 'Monitoring'
    },
    {
      name: 'dev-mode',
      description: 'Check/toggle development mode status',
      status: 'utility',
      category: 'Development'
    },
    {
      name: 'manual-check',
      description: 'Manual email analysis and receipt detection',
      status: 'redundant',
      category: 'Legacy'
    },
    {
      name: 'process-all',
      description: 'Orchestrates all processing in order - single cron job endpoint',
      status: 'core',
      category: 'Core'
    },
    {
      name: 'quick-test',
      description: 'Quick testing endpoint',
      status: 'redundant',
      category: 'Development'
    },
    {
      name: 'test',
      description: 'Ultra simple test endpoint',
      status: 'redundant',
      category: 'Development'
    }
  ];

  const callApi = async (apiName) => {
    try {
      const response = await fetch(`/api/${apiName}`);
      const result = await response.json();
      setApiData(prev => ({ ...prev, [apiName]: result }));
    } catch (error) {
      setApiData(prev => ({ ...prev, [apiName]: { error: error.message } }));
    }
  };

  const deleteApi = async (apiName) => {
    if (confirm(`Are you sure you want to delete /api/${apiName}?`)) {
      // This would require backend implementation
      alert(`Delete functionality would remove pages/api/${apiName}.js`);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'core': return '#10b981';
      case 'utility': return '#3b82f6'; 
      case 'redundant': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatJson = (obj) => JSON.stringify(obj, null, 2);

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '32px',
          borderRadius: '16px',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
            📧 Receipt Forwarder Dashboard
          </h1>
          <p style={{ margin: 0, fontSize: '18px', opacity: 0.9 }}>
            System Status, Notion Integration & API Management
          </p>
        </div>

        {/* System Status Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px',
          marginBottom: '32px'
        }}>
          
          {/* System Health */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
              🏥 System Health
              <button 
                onClick={loadDashboardData}
                style={{ 
                  marginLeft: 'auto', 
                  background: '#3b82f6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Refresh
              </button>
            </h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Required Variables:</span>
                  <span style={{ color: healthData.allRequiredEnvVarsPresent ? '#10b981' : '#ef4444' }}>
                    {healthData.summary?.requiredVars || (healthData.allRequiredEnvVarsPresent ? '✅ All Set' : '❌ Missing')}
                  </span>
                </div>
                {healthData.summary?.optionalVars && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Optional Variables:</span>
                    <span style={{ color: '#6b7280' }}>
                      {healthData.summary.optionalVars}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Module Loading:</span>
                  <span style={{ color: !healthData.hasModuleLoadingErrors ? '#10b981' : '#f59e0b' }}>
                    {!healthData.hasModuleLoadingErrors ? '✅ Working' : '⚠️ Issues'}
                  </span>
                </div>
                {healthData.moduleLoadingErrors && healthData.moduleLoadingErrors.length > 0 && (
                  <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '6px', fontSize: '12px', marginTop: '8px' }}>
                    <strong>Module Issues:</strong><br/>
                    {healthData.moduleLoadingErrors.join(', ')}
                  </div>
                )}
                {!healthData.allRequiredEnvVarsPresent && healthData.environment?.required && (
                  <div style={{ background: '#fee2e2', padding: '8px', borderRadius: '6px', fontSize: '12px', marginTop: '8px' }}>
                    <strong>Missing Required Variables:</strong><br/>
                    {Object.entries(healthData.environment.required)
                      .filter(([key, value]) => !value)
                      .map(([key]) => key.replace('has', '').replace(/([A-Z])/g, '_$1').toUpperCase())
                      .join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notion Status */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>📊 Notion Databases</h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div style={{ fontSize: '14px' }}>
                {notionData.databases && Object.entries(notionData.databases).filter(([key]) => key !== 'activityWriteTest').map(([name, info]) => (
                  <div key={name} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '6px',
                    padding: '4px 0'
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>{name}:</span>
                    <span style={{ color: info.accessible ? '#10b981' : '#ef4444' }}>
                      {info.accessible ? `✅ ${info.recordCount || 0} records` : '❌ Error'}
                    </span>
                  </div>
                ))}
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  background: '#f0f9ff', 
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <a 
                    href="https://notion.so" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#0ea5e9', 
                      textDecoration: 'none', 
                      fontWeight: '500'
                    }}
                  >
                    🚀 Open Notion Workspace
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>⚡ Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => callApi('check-emails')}
                style={{
                  padding: '12px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🔄 Run Email Check
              </button>
              <button
                onClick={() => callApi('process-replies')}
                style={{
                  padding: '12px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                💬 Process Replies
              </button>
              <button
                onClick={() => callApi('process-all')}
                style={{
                  padding: '12px 16px',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🚀 Run Full Process
              </button>
              <button
                onClick={() => callApi('dev-mode')}
                style={{
                  padding: '12px 16px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🔧 Check Dev Mode
              </button>
            </div>
          </div>
        </div>

        {/* Notion Database Details */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>📋 Notion Database Functions</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>📊 Activity Database</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>
                Logs all email processing activity including forwards, blocks, and system events.
              </p>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#475569' }}>
                <li>Email forwarding events</li>
                <li>Block/skip reasons</li>
                <li>System errors and debugging</li>
                <li>Processing timestamps</li>
              </ul>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#059669' }}>⚙️ Preferences Database</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>
                Stores user preferences from reply commands (STOP/MORE commands).
              </p>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#475569' }}>
                <li>Blocked senders</li>
                <li>Blocked categories</li>
                <li>Always-forward whitelist</li>
                <li>Preference history</li>
              </ul>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#7c3aed' }}>💬 Replies Database</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>
                Tracks all reply commands from your wife and the actions taken.
              </p>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#475569' }}>
                <li>Reply commands (STOP, MORE, etc.)</li>
                <li>Actions taken</li>
                <li>Original email context</li>
                <li>Command processing results</li>
              </ul>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>📈 Stats Database</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>
                Daily statistics and system performance metrics.
              </p>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#475569' }}>
                <li>Emails processed daily</li>
                <li>Forward/block counts</li>
                <li>Gmail/iCloud status</li>
                <li>System health metrics</li>
              </ul>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#ea580c' }}>🎯 Manual Forward Database</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>
                Manual forwarding rules and their execution history.
              </p>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#475569' }}>
                <li>Custom forwarding rules</li>
                <li>Rule execution logs</li>
                <li>Pattern matching results</li>
                <li>Manual override history</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Management */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>🔌 API Endpoints</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
            {['Core', 'Monitoring', 'Development', 'Legacy'].map(category => (
              <div key={category}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  color: category === 'Legacy' ? '#ef4444' : '#374151',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '8px'
                }}>
                  {category} APIs
                </h4>
                {apis.filter(api => api.category === category).map(api => (
                  <div key={api.name} style={{
                    background: '#f8fafc',
                    border: `1px solid ${getStatusColor(api.status)}20`,
                    borderLeft: `4px solid ${getStatusColor(api.status)}`,
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ color: '#1f2937' }}>/api/{api.name}</strong>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => callApi(api.name)}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Test
                        </button>
                        {api.status === 'redundant' && (
                          <button
                            onClick={() => deleteApi(api.name)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>
                      {api.description}
                    </p>
                    <span style={{ 
                      fontSize: '11px', 
                      color: getStatusColor(api.status),
                      fontWeight: '500',
                      textTransform: 'uppercase'
                    }}>
                      {api.status}
                    </span>
                    
                    {apiData[api.name] && (
                      <details style={{ marginTop: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#6b7280' }}>
                          View Response
                        </summary>
                        <pre style={{ 
                          background: '#1f2937', 
                          color: '#f9fafb', 
                          padding: '8px', 
                          borderRadius: '4px', 
                          fontSize: '11px',
                          marginTop: '4px',
                          overflow: 'auto',
                          maxHeight: '200px'
                        }}>
                          {formatJson(apiData[api.name])}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          padding: '24px', 
          color: '#6b7280', 
          fontSize: '14px' 
        }}>
          <p>🤖 Smart Receipt Forwarder - AI-powered email processing with Notion integration</p>
          <p>Built with Next.js, Notion API, Gmail/iCloud integration, and intelligent receipt detection</p>
        </div>

      </div>
    </div>
  );
}