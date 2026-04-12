import { useState, useEffect } from 'react'
import { healthCheck } from '../services/api'

export default function Header({ onLogout }) {
  const [healthy, setHealthy] = useState(false)

  useEffect(() => {
    healthCheck()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false))
  }, [])

  return (
    <header style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px',
          background: 'var(--primary)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
          color: '#fff',
          boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
        }}>⚡</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-main)' }}>
            Agentic MCP Gateway
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-sec)' }}>
            AI-Powered Workflow Orchestration
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '8px', height: '8px',
          borderRadius: '50%',
          background: healthy ? 'var(--success)' : 'var(--error)',
          boxShadow: healthy ? '0 0 6px var(--success)' : '0 0 6px var(--error)'
        }} />
        <span style={{ fontSize: '13px', fontWeight: 500, color: healthy ? 'var(--success)' : 'var(--error)' }}>
          {healthy ? 'All Systems Operational' : 'Backend Offline'}
        </span>
      </div>

      {/* User Profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '20px',
          padding: '6px 16px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--primary)'
        }}>
          {localStorage.getItem('username') || 'Authorized User'}
        </div>
        <button 
          onClick={() => {
            if (onLogout) {
              onLogout()
            } else {
              localStorage.removeItem('apiKey')
              localStorage.removeItem('username')
              window.location.reload()
            }
          }}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-sec)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#FEF2F2';
            e.target.style.color = 'var(--error)';
            e.target.style.borderColor = '#FECACA';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = 'var(--text-sec)';
            e.target.style.borderColor = 'var(--border)';
          }}
        >
          Logout
        </button>
      </div>
    </header>
  )
}