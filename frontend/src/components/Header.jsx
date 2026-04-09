import { useState, useEffect } from 'react'
import { healthCheck } from '../services/api'

export default function Header() {
  const [healthy, setHealthy] = useState(false)

  useEffect(() => {
    healthCheck()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false))
  }, [])

  return (
    <header style={{
      background: 'rgba(15, 15, 30, 0.95)',
      borderBottom: '1px solid rgba(79, 70, 229, 0.3)',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px'
        }}>⚡</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>
            Agentic MCP Gateway
          </div>
          <div style={{ fontSize: '12px', color: '#6366f1' }}>
            AI-Powered Workflow Orchestration
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '8px', height: '8px',
          borderRadius: '50%',
          background: healthy ? '#10b981' : '#ef4444',
          boxShadow: healthy ? '0 0 8px #10b981' : '0 0 8px #ef4444'
        }} />
        <span style={{ fontSize: '13px', color: healthy ? '#10b981' : '#ef4444' }}>
          {healthy ? 'All Systems Operational' : 'Backend Offline'}
        </span>
      </div>

      {/* MCP Badge */}
      <div style={{
        background: 'rgba(79, 70, 229, 0.2)',
        border: '1px solid rgba(79, 70, 229, 0.4)',
        borderRadius: '20px',
        padding: '6px 16px',
        fontSize: '12px',
        color: '#818cf8'
      }}>
        4 MCP Connectors Active
      </div>
    </header>
  )
}