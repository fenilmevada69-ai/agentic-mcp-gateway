import { useState } from 'react'
import { executeWorkflow } from '../services/api'

const EXAMPLE_COMMANDS = [
  "Critical bug BUG-421 filed in Jira — handle end to end",
  "BUG-422 login page crash — create branch and notify team",
  "List all open Jira tickets and log them to sheets",
]

export default function CommandInput({ onWorkflowStarted }) {
  const [command, setCommand] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleExecute = async () => {
    if (!command.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await executeWorkflow(command)
      onWorkflowStarted(res.data.workflow_id, command)
      setCommand('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start workflow')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
      {/* Title */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
          🧠 Natural Language Command
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-sec)', marginTop: '4px' }}>
          Type any workflow in plain English — the AI will plan and execute it automatically
        </p>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
          placeholder="e.g. Critical bug BUG-421 filed — handle end to end..."
          style={{
            flex: 1,
            background: '#F9FAFB',
            border: '1px solid #D1D5DB',
            borderRadius: '10px',
            padding: '14px 18px',
            color: 'var(--text-main)',
            fontSize: '14px',
            outline: 'none',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
          onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
        />
        <button
          onClick={handleExecute}
          disabled={loading || !command.trim()}
          style={{
            background: loading ? '#9CA3AF' : 'var(--primary)',
            border: 'none',
            borderRadius: '10px',
            padding: '14px 28px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
          }}
          onMouseOver={(e) => { 
            if (!loading && command.trim()) e.target.style.background = 'var(--primary-hover)'
          }}
          onMouseOut={(e) => {
            if (!loading && command.trim()) e.target.style.background = 'var(--primary)'
          }}
        >
          {loading ? '⏳ Planning...' : '🚀 Execute'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '8px',
          padding: '12px 16px',
          color: 'var(--error)',
          fontSize: '13px',
          marginBottom: '16px',
          fontWeight: 500
        }}>
          ❌ {error}
        </div>
      )}

      {/* Example commands */}
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginBottom: '8px', fontWeight: 500 }}>
          Try these examples:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {EXAMPLE_COMMANDS.map((cmd, i) => (
            <button
              key={i}
              onClick={() => setCommand(cmd)}
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '6px',
                padding: '8px 14px',
                color: 'var(--primary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#DBEAFE'}
              onMouseOut={(e) => e.target.style.background = '#EFF6FF'}
            >
              {cmd.length > 50 ? cmd.substring(0, 50) + '...' : cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}