import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from loguru import logger

from api.workflow_manager import (
    start_workflow,
    get_workflow,
    get_all_workflows,
    approve_workflow_step,
    get_pending_approvals
)
from security.auth import verify_api_key, get_password_hash, verify_password, generate_api_key
from security.audit import log_audit, get_audit_log
from security.db import add_user, get_user_by_username
from connectors.jira.connector import JiraConnector
from connectors.github.connector import GitHubConnector
from connectors.slack.connector import SlackConnector
from connectors.sheets.connector import SheetsConnector

# ── Create FastAPI app ───────────────────────────────────────
app = FastAPI(
    title="Agentic MCP Gateway",
    description="""
    AI-powered orchestration layer that connects to multiple third-party 
    services via MCP servers. Takes natural language commands and executes 
    complex multi-step workflows autonomously.
    
    ## How to use
    1. Get an API key: use `hackathon-demo-key-2025`
    2. Add header: `X-API-Key: hackathon-demo-key-2025`
    3. POST to `/api/v1/workflow/execute` with your command
    4. Watch the magic happen!
    """,
    version="1.0.0"
)

# ── CORS — allows React frontend to talk to this API ─────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request/Response Models ──────────────────────────────────
class WorkflowRequest(BaseModel):
    command: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "command": "Critical bug BUG-421 filed in Jira — handle end to end"
            }
        }

class UserAuth(BaseModel):
    username: str
    password: str

class ApprovalRequest(BaseModel):
    approved: bool

# ════════════════════════════════════════════════════════════
# CORE WORKFLOW ENDPOINTS
# ════════════════════════════════════════════════════════════

@app.post("/api/v1/workflow/execute", tags=["Workflow"])
async def execute_workflow(
    request: WorkflowRequest,
    user: str = Depends(verify_api_key)
):
    """
    🚀 MAIN ENDPOINT — Takes a natural language command and executes it.
    
    The AI agent will:
    1. Analyze your command
    2. Build an execution plan (DAG)
    3. Run all steps automatically
    4. Return workflow ID to track progress
    """
    log_audit(user, "execute_workflow", "workflow", {"command": request.command})
    
    try:
        context = await start_workflow(request.command, user)
        return {
            "success": True,
            "workflow_id": context.workflow_id,
            "message": f"Workflow started successfully",
            "track_url": f"/api/v1/workflow/{context.workflow_id}/status",
            "command": request.command
        }
    except Exception as e:
        log_audit(user, "execute_workflow", "workflow", {"error": str(e)}, "failed")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/workflow/{workflow_id}/status", tags=["Workflow"])
async def get_workflow_status(
    workflow_id: str,
    user: str = Depends(verify_api_key)
):
    """
    📊 Get the real-time status of a running workflow.
    Poll this endpoint every 2 seconds from the frontend.
    """
    context = get_workflow(workflow_id)
    if not context:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    log_audit(user, "get_status", f"workflow/{workflow_id}")
    
    return {
        "workflow_id": context.workflow_id,
        "status": context.status,
        "user_command": context.user_command,
        "started_at": context.started_at,
        "ticket_id": context.ticket_id,
        "ticket_title": context.ticket_title,
        "branch_name": context.branch_name,
        "branch_url": context.branch_url,
        "slack_notified": context.slack_notified,
        "sheet_logged": context.sheet_logged,
        "steps": {
            step_id: {
                "tool": result.tool_name,
                "status": result.status,
                "executed_at": result.executed_at,
                "error": result.error
            }
            for step_id, result in context.step_results.items()
        }
    }

@app.get("/api/v1/workflows", tags=["Workflow"])
async def list_workflows(user: str = Depends(verify_api_key)):
    """📋 List all workflows and their current status"""
    log_audit(user, "list_workflows", "workflow")
    return {"workflows": get_all_workflows()}

# ════════════════════════════════════════════════════════════
# HUMAN-IN-THE-LOOP APPROVAL ENDPOINTS
# ════════════════════════════════════════════════════════════

@app.get("/api/v1/approvals/pending", tags=["Approvals"])
async def get_pending(user: str = Depends(verify_api_key)):
    """
    🔐 Get all steps currently waiting for human approval.
    Frontend polls this to show approval buttons.
    """
    return {"pending_approvals": get_pending_approvals()}

@app.post("/api/v1/workflow/{workflow_id}/approve/{step_id}", tags=["Approvals"])
async def approve_step(
    workflow_id: str,
    step_id: str,
    request: ApprovalRequest,
    user: str = Depends(verify_api_key)
):
    """
    ✅ Approve or reject a pending step.
    Called when user clicks Approve/Reject in the UI.
    """
    success = approve_workflow_step(workflow_id, step_id, request.approved)
    if not success:
        raise HTTPException(status_code=404, detail="Workflow or step not found")
    
    action = "approved" if request.approved else "rejected"
    log_audit(user, f"step_{action}", f"workflow/{workflow_id}/step/{step_id}")
    
    return {
        "success": True,
        "message": f"Step {step_id} {action} successfully"
    }

# ════════════════════════════════════════════════════════════
# USER AUTHENTICATION ENDPOINTS
# ════════════════════════════════════════════════════════════

@app.post("/api/v1/auth/register", tags=["Auth"])
async def register_user(user: UserAuth):
    """
    📝 Register a new user and generate a unique API key.
    """
    logger.info(f"[Auth] Registering new user: {user.username}")
    
    # Hash password & generate unique key
    hashed_pwd = get_password_hash(user.password)
    new_api_key = generate_api_key()
    
    # Save to database
    success = add_user(user.username, hashed_pwd, new_api_key)
    if not success:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    return {
        "success": True,
        "username": user.username,
        "api_key": new_api_key,
        "message": "User registered successfully! Save your API Key."
    }

@app.post("/api/v1/auth/login", tags=["Auth"])
async def login_user(user: UserAuth):
    """
    🔑 Login with username and password to retrieve your API key.
    """
    logger.info(f"[Auth] Login attempt for: {user.username}")
    
    db_user = get_user_by_username(user.username)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return {
        "success": True,
        "username": db_user["username"],
        "api_key": db_user["api_key"]
    }

@app.get("/api/v1/jira/tickets", tags=["Services"])
async def list_jira_tickets(user: str = Depends(verify_api_key)):
    """📋 List all Jira tickets"""
    jira = JiraConnector()
    result = await jira.list_tickets()
    log_audit(user, "list_tickets", "jira")
    return result

@app.get("/api/v1/jira/ticket/{ticket_id}", tags=["Services"])
async def get_jira_ticket(ticket_id: str, user: str = Depends(verify_api_key)):
    """🎫 Get a specific Jira ticket"""
    jira = JiraConnector()
    result = await jira.get_ticket(ticket_id)
    log_audit(user, "get_ticket", f"jira/{ticket_id}")
    return result

@app.get("/api/v1/github/branches", tags=["Services"])
async def list_github_branches(user: str = Depends(verify_api_key)):
    """🌿 List all GitHub branches"""
    github = GitHubConnector()
    result = await github.list_branches()
    log_audit(user, "list_branches", "github")
    return result

@app.get("/api/v1/slack/messages/{channel}", tags=["Services"])
async def get_slack_messages(channel: str, user: str = Depends(verify_api_key)):
    """💬 Get messages from a Slack channel"""
    slack = SlackConnector()
    result = await slack.get_channel_messages(channel)
    log_audit(user, "get_messages", f"slack/{channel}")
    return result

@app.get("/api/v1/sheets/incidents", tags=["Services"])
async def get_all_incidents(user: str = Depends(verify_api_key)):
    """📊 Get all incidents from Google Sheets"""
    sheets = SheetsConnector()
    result = await sheets.get_all_incidents()
    log_audit(user, "get_incidents", "sheets")
    return result

# ════════════════════════════════════════════════════════════
# SYSTEM ENDPOINTS
# ════════════════════════════════════════════════════════════

@app.get("/api/v1/tools", tags=["System"])
async def get_all_tools(user: str = Depends(verify_api_key)):
    """
    🔧 Get all available MCP tools across all connectors.
    This is the MCP tool discovery endpoint.
    """
    log_audit(user, "tool_discovery", "system")
    
    jira = JiraConnector()
    github = GitHubConnector()
    slack = SlackConnector()
    sheets = SheetsConnector()
    
    return {
        "total_tools": 16,
        "connectors": {
            "jira": jira.get_tools_schema(),
            "github": github.get_tools_schema(),
            "slack": slack.get_tools_schema(),
            "sheets": sheets.get_tools_schema()
        }
    }

@app.get("/api/v1/audit-log", tags=["System"])
async def get_audit(user: str = Depends(verify_api_key)):
    """🔍 Get the full audit log of all API calls"""
    if user != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return {"audit_log": get_audit_log()}

@app.get("/health", tags=["System"])
async def health_check():
    """❤️ Health check — no auth required"""
    return {
        "status": "healthy",
        "service": "Agentic MCP Gateway",
        "version": "1.0.0"
    }

@app.get("/", tags=["System"])
async def root():
    """Welcome endpoint"""
    return {
        "message": "Welcome to Agentic MCP Gateway 🚀",
        "docs": "/docs",
        "health": "/health",
        "demo_key": "hackathon-demo-key-2025"
    }