<p align="center">
  <h1 align="center">🚀 Agentic MCP Gateway</h1>
  <p align="center">
    <strong>AI-powered orchestration layer that connects to multiple third-party services via MCP servers and executes complex workflows from natural language.</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
    <img src="https://img.shields.io/badge/Groq-LLaMA_3.3-FF6600?style=for-the-badge" alt="Groq">
    <img src="https://img.shields.io/badge/Redis-7_Alpine-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
  </p>
</p>

---

## 📖 Overview

**Agentic MCP Gateway** is a full-stack, AI-powered orchestration platform that takes natural language commands and automatically plans, schedules, and executes complex multi-step workflows across integrated services — **Jira**, **GitHub**, **Slack**, and **Google Sheets**.

Under the hood, it uses an **AI Planner Agent** (powered by Groq's LLaMA 3.3 70B) to decompose commands into a **DAG (Directed Acyclic Graph)** of tasks, then a **Workflow Executor** runs each wave of steps — with parallel execution, automatic retries, and human-in-the-loop approval gates.

### ✨ Key Features

| Feature | Description |
|---|---|
| 🧠 **AI-Powered Planning** | Natural language → structured DAG workflow via Groq LLaMA 3.3 70B |
| 🔀 **DAG Orchestration** | Topological sort with parallel wave execution using NetworkX |
| ⚡ **Parallel Execution** | Independent steps run simultaneously via `asyncio.gather` |
| 🔄 **Auto-Retry** | Failed steps automatically retry up to 3× with exponential backoff |
| 🔐 **Human-in-the-Loop** | Sensitive actions (e.g., Slack alerts) pause for human approval |
| 🔗 **4 MCP Connectors** | Jira · GitHub · Slack · Google Sheets |
| 📊 **Real-time Dashboard** | React frontend with live workflow tracking and status updates |
| 🔑 **API Key Auth** | Secure endpoints with API key validation and audit logging |
| 🐳 **One-Command Deploy** | Entire stack runs with a single `docker-compose up` |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                 │
│                     http://localhost:5173                        │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │  Dashboard   │  │  Command Input   │  │  Workflow Status  │   │
│  │  Component   │  │    Component     │  │    Component      │   │
│  └─────────────┘  └──────────────────┘  └───────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────────┐
│                   BACKEND (FastAPI + Python)                     │
│                     http://localhost:8000                        │
│                                                                  │
│  ┌──────────┐   ┌────────────┐   ┌────────────────────────────┐ │
│  │ Security │   │  AI Planner │   │    Workflow Orchestrator   │ │
│  │ (Auth +  │   │  (Groq /   │   │  ┌────────┐  ┌──────────┐ │ │
│  │  Audit)  │   │  LLaMA 3.3)│   │  │  DAG   │  │ Executor │ │ │
│  └──────────┘   └─────┬──────┘   │  │ Engine │  │ (Retry + │ │ │
│                        │          │  │        │  │ Approval)│ │ │
│                   NL → DAG Plan   │  └────────┘  └──────────┘ │ │
│                                   └────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────── MCP Connectors ────────────────────────┐ │
│  │  Jira Connector  │  GitHub Connector  │  Slack  │  Sheets  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────┬──────────┬──────────┬──────────┬───────────────────┘
             │          │          │          │
┌────────────▼──┐ ┌─────▼──────┐ ┌▼────────┐ ┌▼────────┐  ┌───────┐
│  Mock Jira    │ │ Mock GitHub│ │Mock Slack│ │Mock     │  │ Redis │
│  :8001        │ │  :8002     │ │ :8003    │ │Sheets   │  │ :6379 │
│  (Flask)      │ │  (Flask)   │ │ (Flask)  │ │:8004    │  │       │
└───────────────┘ └────────────┘ └─────────┘ └─────────┘  └───────┘
```

---

## 📁 Project Structure

```
agentic-mcp-gateway/
├── backend/                        # FastAPI backend
│   ├── main.py                     # App entry — all REST endpoints
│   ├── agents/
│   │   └── planner.py              # AI Planner (Groq + LLaMA 3.3 70B)
│   ├── orchestrator/
│   │   ├── dag.py                  # DAG builder (NetworkX)
│   │   └── executor.py             # Workflow executor (parallel + retry)
│   ├── connectors/
│   │   ├── base.py                 # Base HTTP connector class
│   │   ├── jira/connector.py       # Jira MCP connector
│   │   ├── github/connector.py     # GitHub MCP connector
│   │   ├── slack/connector.py      # Slack MCP connector
│   │   └── sheets/connector.py     # Google Sheets MCP connector
│   ├── context/
│   │   └── models.py               # WorkflowContext, StepResult, WorkflowPlan
│   ├── security/
│   │   ├── auth.py                 # API key authentication
│   │   └── audit.py                # Audit logging
│   ├── api/
│   │   └── workflow_manager.py     # Workflow lifecycle management
│   ├── requirements.txt            # Python dependencies
│   └── Dockerfile
│
├── frontend/                       # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                 # App entry point
│   │   ├── components/
│   │   │   ├── Dashboard.jsx       # Main dashboard layout
│   │   │   ├── CommandInput.jsx    # Natural language command input
│   │   │   ├── WorkflowStatus.jsx  # Real-time workflow tracker
│   │   │   ├── ServicesPanel.jsx   # Connected services overview
│   │   │   └── Header.jsx         # App header
│   │   └── services/              # API service layer (Axios)
│   ├── package.json
│   └── Dockerfile
│
├── mock-services/                  # Simulated third-party APIs
│   ├── jira/       (port 8001)     # Mock Jira API (Flask)
│   ├── github/     (port 8002)     # Mock GitHub API (Flask)
│   ├── slack/      (port 8003)     # Mock Slack API (Flask)
│   └── sheets/     (port 8004)     # Mock Google Sheets API (Flask)
│
├── docker-compose.yml              # Full stack orchestration
├── .env                            # Environment variables
└── .gitignore
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended — One Command)

```bash
# Clone the repository
git clone https://github.com/fenilmevada69-ai/agentic-mcp-gateway.git
cd agentic-mcp-gateway

# Start the entire stack
docker-compose up --build
```

**That's it!** Open your browser:

| Service | URL |
|---|---|
| 🖥️ **Dashboard** | [http://localhost:5173](http://localhost:5173) |
| 📡 **API Docs** (Swagger) | [http://localhost:8000/docs](http://localhost:8000/docs) |
| ❤️ **Health Check** | [http://localhost:8000/health](http://localhost:8000/health) |

### Option 2: Manual Setup (Development)

#### 1. Start Mock Services (4 terminals)

```bash
# Terminal 1 — Mock Jira
cd mock-services/jira && pip install flask && python app.py

# Terminal 2 — Mock GitHub
cd mock-services/github && pip install flask && python app.py

# Terminal 3 — Mock Slack
cd mock-services/slack && pip install flask && python app.py

# Terminal 4 — Mock Sheets
cd mock-services/sheets && pip install flask && python app.py
```

#### 2. Start Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Authentication

All API endpoints (except `/health`) require an API key in the request header:

```
X-API-Key: hackathon-demo-key-2025
```

| API Key | Role |
|---|---|
| `hackathon-demo-key-2025` | Demo User |
| `admin-key-9999` | Admin (full audit access) |

---

## 📡 API Endpoints

### Core Workflow

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/workflow/execute` | Execute a workflow from natural language |
| `GET` | `/api/v1/workflow/{id}/status` | Get real-time workflow status |
| `GET` | `/api/v1/workflows` | List all workflows |

### Human-in-the-Loop Approvals

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/approvals/pending` | Get all pending approvals |
| `POST` | `/api/v1/workflow/{id}/approve/{step}` | Approve or reject a step |

### Direct Service Access

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/jira/tickets` | List all Jira tickets |
| `GET` | `/api/v1/jira/ticket/{id}` | Get specific ticket |
| `GET` | `/api/v1/github/branches` | List GitHub branches |
| `GET` | `/api/v1/slack/messages/{channel}` | Get Slack messages |
| `GET` | `/api/v1/sheets/incidents` | Get all logged incidents |

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/tools` | MCP tool discovery (16 tools) |
| `GET` | `/api/v1/audit-log` | Audit log (admin only) |
| `GET` | `/health` | Health check (no auth) |

---

## 💡 Usage Example

### Execute a Workflow via cURL

```bash
curl -X POST http://localhost:8000/api/v1/workflow/execute \
  -H "X-API-Key: hackathon-demo-key-2025" \
  -H "Content-Type: application/json" \
  -d '{"command": "Critical bug BUG-421 filed in Jira — handle end to end"}'
```

### What Happens Behind the Scenes

```
📝 Your Command
   "Critical bug BUG-421 filed in Jira — handle end to end"
            │
            ▼
   🧠 AI Planner (Groq LLaMA 3.3 70B)
      Generates a DAG execution plan
            │
            ▼
   📊 DAG Engine builds the graph:

   Wave 1:  → step_1: jira_get_ticket (fetch bug details)
                    ↓
   Wave 2:  → step_2: github_create_branch (create fix branch)
                    ↓
   Wave 3:  → step_3a: slack_send_incident_alert 🔐 [NEEDS APPROVAL]
            → step_3b: sheets_log_incident          (PARALLEL ⚡)
```

### PowerShell Example

```powershell
Invoke-WebRequest `
  -Uri "http://localhost:8000/api/v1/workflow/execute" `
  -Method POST `
  -Headers @{
    "X-API-Key" = "hackathon-demo-key-2025"
    "Content-Type" = "application/json"
  } `
  -Body '{"command": "Critical bug BUG-421 filed in Jira — handle end to end"}' |
  Select-Object -ExpandProperty Content
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | High-performance async REST API |
| **Groq + LLaMA 3.3 70B** | AI-powered workflow planning |
| **NetworkX** | DAG construction and topological sorting |
| **Redis** | Caching and session management |
| **Pydantic** | Data validation and serialization |
| **httpx** | Async HTTP client for MCP connectors |
| **Loguru** | Structured logging |
| **Uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool and dev server |
| **Axios** | HTTP client for API calls |
| **React Router** | Client-side routing |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker Compose** | Multi-container orchestration |
| **Redis 7 Alpine** | In-memory data store |
| **Flask** | Mock service APIs |

---

## 🐳 Docker Commands

```bash
# Start everything
docker-compose up

# Start in background
docker-compose up -d

# Rebuild after code changes
docker-compose up --build

# Stop everything
docker-compose down

# View logs for a specific service
docker logs mcp-backend
docker logs mcp-frontend

# Restart a specific service
docker-compose restart backend

# Check running containers
docker ps
```

---

## 🔧 Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_secret_key_here
```

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | API key for Groq cloud (LLaMA inference) |
| `SECRET_KEY` | Secret key for system-level API authentication |

---

## 🧩 MCP Connectors (16 Tools)

### Jira (4 tools)
- `jira_get_ticket` — Fetch ticket details
- `jira_create_ticket` — Create a new ticket
- `jira_update_status` — Update ticket status and assignee
- `jira_list_tickets` — List all tickets

### GitHub (4 tools)
- `github_create_branch` — Create a new branch
- `github_create_pr` — Create a pull request
- `github_list_branches` — List all branches
- `github_get_branch` — Get branch details

### Slack (3 tools)
- `slack_send_incident_alert` — Send incident alert with details
- `slack_send_message` — Send a message to a channel
- `slack_list_channels` — List available channels

### Google Sheets (3 tools)
- `sheets_log_incident` — Log an incident to the tracker
- `sheets_get_all_incidents` — Get all logged incidents
- `sheets_append_row` — Append a custom row

---

## 🧪 Testing

```bash
# Run connector tests
cd backend
python test_connectors.py

# Run orchestrator tests
python test_orchestrator.py
```

---

## 📝 License

This project was built for **hackathon demonstration purposes**.

---

<p align="center">
  Built with ❤️ using FastAPI, React, Groq AI, and Docker
</p>