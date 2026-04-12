import { useState, useEffect } from 'react'
import { getWorkflowStatus, approveStep } from '../services/api'

const STATUS_COLORS = {
  success: 'var(--success)',
  failed: 'var(--error)',
  pending: '#D97706',
  running: 'var(--primary)',
  completed: 'var(--success)',
  waiting_approval: '#D97706',
  rejected: 'var(--error)'
}

const STATUS_BGS = {
  success: '#ECFDF5',
  failed: '#FEF2F2',
  pending: '#FFFBEB',
  running: '#EFF6FF',
  completed: '#ECFDF5',
  waiting_approval: '#FFFBEB',
  rejected: '#FEF2F2'
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
    <div className="card" style={{ padding: '28px', textAlign: 'center', color: 'var(--primary)', fontWeight: 500 }}>
      ⚡ AI is analyzing your command and building execution plan...
    </div>
  )

  if (!workflow) return null

  const steps = Object.entries(workflow.steps || {})

  return (
    <div className="card" style={{
      borderLeft: `4px solid ${STATUS_COLORS[workflow.status] || 'var(--primary)'}`,
      padding: '24px',
      marginBottom: '16px'
    }}>
      {/* Workflow Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>
              {STATUS_ICONS[workflow.status] || '⚡'}
            </span>
            <span style={{
              fontWeight: 700,
              fontSize: '16px',
              color: STATUS_COLORS[workflow.status] || 'var(--text-main)',
              textTransform: 'capitalize'
            }}>
              Workflow {workflow.status?.replace('_', ' ')}
            </span>
          </div>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-sec)',
            marginTop: '6px',
            fontStyle: 'italic',
            fontWeight: 500
          }}>
            "{command}"
          </div>
        </div>
        <div style={{
          fontSize: '12px',
          color: 'var(--text-sec)',
          textAlign: 'right',
          background: '#F9FAFB',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontFamily: 'monospace', marginBottom: '4px' }}>ID: {workflowId.substring(0, 8)}...</div>
          <div style={{ fontWeight: 600 }}>{steps.filter(([,s]) => s.status === 'success').length} / {steps.length} steps done</div>
        </div>
      </div>

      {/* Key Results */}
      {workflow.status === 'completed' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {[
            { label: 'Ticket', value: workflow.ticket_id || '—', icon: '🎫' },
            { label: 'Branch', value: workflow.branch_name || '—', icon: '🌿' },
            { label: 'Slack', value: workflow.slack_notified ? 'Sent ✓' : 'Pending', icon: '💬' },
            { label: 'Logged', value: workflow.sheet_logged ? 'Done ✓' : 'Pending', icon: '📊' },
          ].map((item, i) => (
            <div key={i} style={{
              background: '#F9FAFB',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '16px 12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-sec)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DAG Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map(([stepId, step], index) => (
          <div key={stepId}>
            <div style={{
              background: '#fff',
              border: `1px solid ${STATUS_COLORS[step.status] || 'var(--border)'}`,
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Step number */}
                <div style={{
                  width: '32px', height: '32px',
                  background: STATUS_BGS[step.status] || '#F3F4F6',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700,
                  color: STATUS_COLORS[step.status] || 'var(--text-sec)'
                }}>
                  {index + 1}
                </div>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    fontFamily: 'monospace'
                  }}>
                    {step.tool}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginTop: '4px' }}>
                    {stepId.substring(0, 8)}... • {step.executed_at ? new Date(step.executed_at).toLocaleTimeString() : 'pending'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Approval buttons */}
                {step.status === 'waiting_approval' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleApproval(stepId, true)}
                      style={{
                        background: '#ECFDF5',
                        border: '1px solid var(--success)',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        color: 'var(--success)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#D1FAE5'}
                      onMouseOut={(e) => e.target.style.background = '#ECFDF5'}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleApproval(stepId, false)}
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid var(--error)',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        color: 'var(--error)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#FEE2E2'}
                      onMouseOut={(e) => e.target.style.background = '#FEF2F2'}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}

                {/* Status badge */}
                <div style={{
                  background: STATUS_BGS[step.status] || '#F3F4F6',
                  border: `1px solid ${STATUS_COLORS[step.status] || 'var(--border)'}`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: STATUS_COLORS[step.status] || 'var(--text-sec)',
                  textTransform: 'capitalize'
                }}>
                  {STATUS_ICONS[step.status]} {step.status?.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Arrow between steps */}
            {index < steps.length - 1 && (
              <div style={{
                textAlign: 'center',
                color: '#D1D5DB',
                fontSize: '18px',
                lineHeight: '16px',
                margin: '4px 0'
              }}>↓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}