import { useState } from 'react'
import Header from './Header'
import CommandInput from './CommandInput'
import WorkflowStatus from './WorkflowStatus'
import ServicesPanel from './ServicesPanel'

export default function Dashboard() {
  const [workflows, setWorkflows] = useState([])

  const handleWorkflowStarted = (workflowId, command) => {
    setWorkflows(prev => [{ workflowId, command }, ...prev])
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Header />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN */}
        <div>
          {/* Hero text */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #fff, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              Agentic MCP Gateway
            </h1>
            <p style={{ color: '#64748b', fontSize: '15px' }}>
              Type a command in plain English → AI plans → executes across
              Jira, GitHub, Slack & Sheets automatically
            </p>
          </div>

          {/* Command Input */}
          <CommandInput onWorkflowStarted={handleWorkflowStarted} />

          {/* Workflow Results */}
          {workflows.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(79,70,229,0.3)',
              borderRadius: '16px',
              padding: '48px',
              textAlign: 'center',
              color: '#374151'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#4b5563' }}>
                No workflows yet
              </div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>
                Type a command above and hit Execute to see the magic
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '12px',
                fontWeight: 500
              }}>
                WORKFLOW EXECUTIONS ({workflows.length})
              </h3>
              {workflows.map((wf) => (
                <WorkflowStatus
                  key={wf.workflowId}
                  workflowId={wf.workflowId}
                  command={wf.command}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <ServicesPanel />

          {/* Architecture info */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '16px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#475569',
              fontWeight: 600,
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Tech Stack
            </div>
            {[
              { label: 'AI Planner', value: 'Groq Llama 3.3 70b' },
              { label: 'DAG Engine', value: 'NetworkX + AsyncIO' },
              { label: 'Backend', value: 'FastAPI + Python' },
              { label: 'Protocol', value: 'MCP (4 connectors)' },
              { label: 'Frontend', value: 'React + Vite' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none'
              }}>
                <span style={{ fontSize: '12px', color: '#475569' }}>{item.label}</span>
                <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 500 }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}