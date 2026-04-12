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
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
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
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: '8px',
              letterSpacing: '-0.02em'
            }}>
              Agentic <span style={{ color: 'var(--primary)' }}>MCP Gateway</span>
            </h1>
            <p style={{ color: 'var(--text-sec)', fontSize: '15px' }}>
              Type a command in plain English → AI plans → executes across
              Jira, GitHub, Slack & Sheets automatically
            </p>
          </div>

          {/* Command Input */}
          <CommandInput onWorkflowStarted={handleWorkflowStarted} />

          {/* Workflow Results */}
          {workflows.length === 0 ? (
            <div className="card" style={{
              padding: '48px',
              textAlign: 'center',
              color: 'var(--text-sec)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                No workflows yet
              </div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>
                Type a command above and hit Execute to see the magic
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{
                fontSize: '13px',
                color: 'var(--text-sec)',
                marginBottom: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
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
          <div className="card" style={{
            padding: '20px',
            marginTop: '16px'
          }}>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-sec)',
              fontWeight: 600,
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Tech Stack
            </div>
            {[
              { label: 'AI Planner', value: 'Groq Llama 3.3' },
              { label: 'DAG Engine', value: 'NetworkX + asyncio' },
              { label: 'Backend', value: 'FastAPI + Python' },
              { label: 'Protocol', value: 'MCP (4 integrations)' },
              { label: 'Frontend', value: 'React + Vite' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: i < 4 ? '1px solid var(--border)' : 'none'
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-sec)' }}>{item.label}</span>
                <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
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