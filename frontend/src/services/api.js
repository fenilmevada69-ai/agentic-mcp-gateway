import axios from 'axios'

// Base configuration — points to your FastAPI backend
const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('apiKey')
  if (token) {
    config.headers['X-API-Key'] = token
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// ── Auth APIs ────────────────────────────────────────────────
export const registerUser = (username, password) =>
  API.post('/api/v1/auth/register', { username, password })

export const loginUser = (username, password) =>
  API.post('/api/v1/auth/login', { username, password })

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