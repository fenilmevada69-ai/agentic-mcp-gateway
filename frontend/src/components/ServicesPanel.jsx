import { useState, useEffect } from 'react'
import {
  getJiraTickets,
  getGithubBranches,
  getSlackMessages,
  getSheetIncidents
} from '../services/api'

export default function ServicesPanel() {
  const [jiraTickets, setJiraTickets] = useState([])
  const [branches, setBranches] = useState([])
  const [messages, setMessages] = useState([])
  const [incidents, setIncidents] = useState([])
  const [activeTab, setActiveTab] = useState('jira')

  useEffect(() => {
    getJiraTickets().then(r => setJiraTickets(r.data)).catch(() => {})
    getGithubBranches().then(r => setBranches(r.data)).catch(() => {})
    getSlackMessages('oncall').then(r => setMessages(r.data?.messages || [])).catch(() => {})
    getSheetIncidents().then(r => setIncidents(r.data?.values || [])).catch(() => {})

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      getJiraTickets().then(r => setJiraTickets(r.data)).catch(() => {})
      getGithubBranches().then(r => setBranches(r.data)).catch(() => {})
      getSlackMessages('oncall').then(r => setMessages(r.data?.messages || [])).catch(() => {})
      getSheetIncidents().then(r => setIncidents(r.data?.values || [])).catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const TABS = [
    { id: 'jira', label: '🎫 Jira', count: jiraTickets.length },
    { id: 'github', label: '🌿 GitHub', count: branches.length },
    { id: 'slack', label: '💬 Slack', count: messages.length },
    { id: 'sheets', label: '📊 Sheets', count: Math.max(0, incidents.length - 1) },
  ]

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '24px',
    }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#fff' }}>
        📡 Live Service State
      </h3>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id
                ? 'rgba(79,70,229,0.3)'
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${activeTab === tab.id ? '#4f46e5' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              padding: '8px 14px',
              color: activeTab === tab.id ? '#818cf8' : '#64748b',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 600 : 400
            }}
          >
            {tab.label}
            <span style={{
              marginLeft: '6px',
              background: 'rgba(79,70,229,0.3)',
              borderRadius: '10px',
              padding: '1px 6px',
              fontSize: '11px'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>

        {/* Jira Tickets */}
        {activeTab === 'jira' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {jiraTickets.length === 0
              ? <div style={{ color: '#475569', fontSize: '13px' }}>No tickets yet</div>
              : jiraTickets.map((ticket, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'monospace', color: '#818cf8', fontSize: '12px' }}>
                      {ticket.id}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: ticket.priority === 'Critical' ? '#ef4444' : '#f59e0b',
                      fontWeight: 600
                    }}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '4px' }}>
                    {ticket.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                    Status: {ticket.status}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* GitHub Branches */}
        {activeTab === 'github' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {branches.length === 0
              ? <div style={{ color: '#475569', fontSize: '13px' }}>No branches created yet</div>
              : branches.map((branch, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', color: '#34d399', fontSize: '13px' }}>
                      🌿 {branch.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                      {branch.created_at ? new Date(branch.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px', color: '#475569',
                    fontFamily: 'monospace'
                  }}>
                    {branch.sha?.substring(0, 7)}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Slack Messages */}
        {activeTab === 'slack' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.length === 0
              ? <div style={{ color: '#475569', fontSize: '13px' }}>No messages yet</div>
              : messages.map((msg, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600 }}>
                      #{msg.channel}
                    </span>
                    <span style={{ fontSize: '11px', color: '#475569' }}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '13px', color: '#e2e8f0',
                    marginTop: '6px', lineHeight: '1.5',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Sheets Incidents */}
        {activeTab === 'sheets' && (
          <div>
            {incidents.length <= 1
              ? <div style={{ color: '#475569', fontSize: '13px' }}>No incidents logged yet</div>
              : incidents.slice(1).map((row, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px'
                }}>
                  {row.map((cell, j) => (
                    <div key={j}>
                      <div style={{ fontSize: '10px', color: '#475569' }}>
                        {incidents[0]?.[j] || `Col ${j+1}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>
                        {cell}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}