import { useState, useEffect } from 'react'
import { getWorkflowStatus, approveStep } from '../services/api'

const STATUS_COLORS = {
  success: '#10b981',
  failed: '#ef4444',
  pending: '#f59e0b',
  running: '#6366f1',
  completed: '#10b981',
  waiting_approval: '#f59e0b',
  rejected: '#ef4444'
}

const STATUS_ICONS = {
  success: '✅',
  failed: '❌',
  pending: '⏳',
  running: '⚡',
  completed: '🎉',
  waiting_approval: '🔐',
  rejected: '🚫'
}

export default function WorkflowStatus({ workflowId, command }) {
  const [workflow, setWorkflow] = useState(null)
  const [loading, setLoading] = useState(true)

  // Poll every 2 seconds while workflow is running
  useEffect(() => {
    if (!workflowId) return

    const poll = async () => {
      try {
        const res = await getWorkflowStatus(workflowId)
        setWorkflow(res.data)
        setLoading(false)
      } catch (err) {
        setLoading(false)
      }
    }

    poll()
    const interval = setInterval(() => {
      if (workflow?.status !== 'completed' && workflow?.status !== 'failed') {
        poll()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [workflowId, workflow?.status])

  const handleApproval = async (stepId, approved) => {
    try {
      await approveStep(workflowId, stepId, approved)
    } catch (err) {
      console.error('Approval failed:', err)
    }
  }

  if (loading) return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(79,70,229,0.3)',
      borderRadius: '16px',
      padding: '28px',
      textAlign: 'center',
      color: '#6366f1'
    }}>
      ⚡ AI is analyzing your command and building execution plan...
    </div>
  )

  if (!workflow) return null

  const steps = Object.entries(workflow.steps || {})

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${STATUS_COLORS[workflow.status] || '#4f46e5'}40`,
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '16px'
    }}>
      {/* Workflow Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>
              {STATUS_ICONS[workflow.status] || '⚡'}
            </span>
            <span style={{
              fontWeight: 600,
              fontSize: '15px',
              color: STATUS_COLORS[workflow.status] || '#fff'
            }}>
              Workflow {workflow.status?.toUpperCase()}
            </span>
          </div>
          <div style={{
            fontSize: '13px',
            color: '#64748b',
            marginTop: '4px',
            fontStyle: 'italic'
          }}>
            "{command}"
          </div>
        </div>
        <div style={{
          fontSize: '11px',
          color: '#475569',
          textAlign: 'right'
        }}>
          <div>ID: {workflowId}</div>
          <div>{steps.filter(([,s]) => s.status === 'success').length}/{steps.length} steps done</div>
        </div>
      </div>

      {/* Key Results */}
      {workflow.status === 'completed' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {[
            { label: 'Ticket', value: workflow.ticket_id || '—', icon: '🎫' },
            { label: 'Branch', value: workflow.branch_name || '—', icon: '🌿' },
            { label: 'Slack', value: workflow.slack_notified ? 'Sent ✓' : 'Pending', icon: '💬' },
            { label: 'Logged', value: workflow.sheet_logged ? 'Done ✓' : 'Pending', icon: '📊' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(79,70,229,0.1)',
              border: '1px solid rgba(79,70,229,0.2)',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{item.icon}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{item.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#a5b4fc' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DAG Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {steps.map(([stepId, step], index) => (
          <div key={stepId}>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${STATUS_COLORS[step.status] || '#374151'}40`,
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Step number */}
                <div style={{
                  width: '28px', height: '28px',
                  background: `${STATUS_COLORS[step.status] || '#374151'}20`,
                  border: `1px solid ${STATUS_COLORS[step.status] || '#374151'}`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                  color: STATUS_COLORS[step.status] || '#64748b'
                }}>
                  {index + 1}
                </div>
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    fontFamily: 'monospace'
                  }}>
                    {step.tool}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    {stepId} • {step.executed_at ? new Date(step.executed_at).toLocaleTimeString() : 'pending'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Approval buttons */}
                {step.status === 'waiting_approval' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleApproval(stepId, true)}
                      style={{
                        background: 'rgba(16,185,129,0.2)',
                        border: '1px solid #10b981',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        color: '#10b981',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleApproval(stepId, false)}
                      style={{
                        background: 'rgba(239,68,68,0.2)',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        color: '#ef4444',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}

                {/* Status badge */}
                <div style={{
                  background: `${STATUS_COLORS[step.status] || '#374151'}20`,
                  border: `1px solid ${STATUS_COLORS[step.status] || '#374151'}`,
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: STATUS_COLORS[step.status] || '#64748b'
                }}>
                  {STATUS_ICONS[step.status]} {step.status}
                </div>
              </div>
            </div>

            {/* Arrow between steps */}
            {index < steps.length - 1 && (
              <div style={{
                textAlign: 'center',
                color: '#374151',
                fontSize: '16px',
                lineHeight: '16px',
                margin: '2px 0'
              }}>↓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}