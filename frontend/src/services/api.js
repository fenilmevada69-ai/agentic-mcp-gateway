import axios from 'axios'

// Base configuration — points to your FastAPI backend
const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'X-API-Key': 'hackathon-demo-key-2025',
    'Content-Type': 'application/json'
  }
})

// ── Workflow APIs ────────────────────────────────────────────
export const executeWorkflow = (command) =>
  API.post('/api/v1/workflow/execute', { command })

export const getWorkflowStatus = (workflowId) =>
  API.get(`/api/v1/workflow/${workflowId}/status`)

export const listWorkflows = () =>
  API.get('/api/v1/workflows')

// ── Approval APIs ────────────────────────────────────────────
export const getPendingApprovals = () =>
  API.get('/api/v1/approvals/pending')

export const approveStep = (workflowId, stepId, approved) =>
  API.post(`/api/v1/workflow/${workflowId}/approve/${stepId}`, { approved })

// ── Service APIs ─────────────────────────────────────────────
export const getJiraTickets = () =>
  API.get('/api/v1/jira/tickets')

export const getGithubBranches = () =>
  API.get('/api/v1/github/branches')

export const getSlackMessages = (channel) =>
  API.get(`/api/v1/slack/messages/${channel}`)

export const getSheetIncidents = () =>
  API.get('/api/v1/sheets/incidents')

export const getAllTools = () =>
  API.get('/api/v1/tools')

export const healthCheck = () =>
  API.get('/health')