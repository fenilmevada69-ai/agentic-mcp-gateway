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
    { id: 'jira', label: '🎫 Jira', count: Array.isArray(jiraTickets) ? jiraTickets.length : 0 },
    { id: 'github', label: '🌿 GitHub', count: Array.isArray(branches) ? branches.length : 0 },
    { id: 'slack', label: '💬 Slack', count: Array.isArray(messages) ? messages.length : 0 },
    { id: 'sheets', label: '📊 Sheets', count: Array.isArray(incidents) ? Math.max(0, incidents.length - 1) : 0 },
  ]

  return (
    <div className="card" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-main)' }}>
        📡 Live Service State
      </h3>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--primary)' : '#F3F4F6',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              color: activeTab === tab.id ? '#fff' : 'var(--text-sec)',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 600 : 500,
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
            <span style={{
              marginLeft: '6px',
              background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : '#E5E7EB',
              color: activeTab === tab.id ? '#fff' : 'var(--text-sec)',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>

        {/* Jira Tickets */}
        {activeTab === 'jira' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!Array.isArray(jiraTickets) || jiraTickets.length === 0
              ? <div style={{ color: 'var(--text-sec)', fontSize: '13px', padding: '12px', textAlign: 'center', background: '#F9FAFB', borderRadius: '8px' }}>No tickets yet (or backend offline)</div>
              : jiraTickets.map((ticket, i) => (
                <div key={i} style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, fontSize: '13px' }}>
                      {ticket.id}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: ticket.priority === 'Critical' ? 'var(--error)' : '#D97706',
                      background: ticket.priority === 'Critical' ? '#FEF2F2' : '#FFFBEB',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600
                    }}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 500, marginBottom: '6px' }}>
                    {ticket.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-sec)' }}>
                    Status: <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{ticket.status}</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* GitHub Branches */}
        {activeTab === 'github' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!Array.isArray(branches) || branches.length === 0
              ? <div style={{ color: 'var(--text-sec)', fontSize: '13px', padding: '12px', textAlign: 'center', background: '#F9FAFB', borderRadius: '8px' }}>No branches created yet</div>
              : branches.map((branch, i) => (
                <div key={i} style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                      🌿 {branch.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-sec)' }}>
                      {branch.created_at ? new Date(branch.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px', color: 'var(--primary)',
                    background: '#EFF6FF', padding: '4px 8px', borderRadius: '6px',
                    fontFamily: 'monospace', fontWeight: 600
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!Array.isArray(messages) || messages.length === 0
              ? <div style={{ color: 'var(--text-sec)', fontSize: '13px', padding: '12px', textAlign: 'center', background: '#F9FAFB', borderRadius: '8px' }}>No messages yet</div>
              : messages.map((msg, i) => (
                <div key={i} style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>
                      #{msg.channel}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-sec)' }}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '14px', color: 'var(--text-sec)',
                    lineHeight: '1.5',
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
            {!Array.isArray(incidents) || incidents.length <= 1
              ? <div style={{ color: 'var(--text-sec)', fontSize: '13px', padding: '12px', textAlign: 'center', background: '#F9FAFB', borderRadius: '8px' }}>No incidents logged yet</div>
              : incidents.slice(1).map((row, i) => (
                <div key={i} style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '10px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  {row.map((cell, j) => (
                    <div key={j}>
                      <div style={{ fontSize: '11px', color: 'var(--text-sec)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>
                        {incidents[0]?.[j] || `Col ${j+1}`}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
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