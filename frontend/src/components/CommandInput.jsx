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
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(79,70,229,0.3)',
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '24px'
    }}>
      {/* Title */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>
          🧠 Natural Language Command
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
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
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(79,70,229,0.4)',
            borderRadius: '10px',
            padding: '14px 18px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          onClick={handleExecute}
          disabled={loading || !command.trim()}
          style={{
            background: loading ? '#374151' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            border: 'none',
            borderRadius: '10px',
            padding: '14px 28px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          {loading ? '⏳ Planning...' : '🚀 Execute'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          color: '#ef4444',
          fontSize: '13px',
          marginBottom: '12px'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Example commands */}
      <div>
        <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>
          Try these examples:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {EXAMPLE_COMMANDS.map((cmd, i) => (
            <button
              key={i}
              onClick={() => setCommand(cmd)}
              style={{
                background: 'rgba(79,70,229,0.1)',
                border: '1px solid rgba(79,70,229,0.3)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#818cf8',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {cmd.length > 50 ? cmd.substring(0, 50) + '...' : cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}