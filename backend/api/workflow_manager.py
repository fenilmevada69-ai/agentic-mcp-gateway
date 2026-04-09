import uuid
import asyncio
from typing import Dict, Optional
from loguru import logger
from context.models import WorkflowContext, WorkflowPlan
from orchestrator.dag import DAGEngine
from orchestrator.executor import WorkflowExecutor
from agents.planner import PlannerAgent

# Global storage of all workflows
active_workflows: Dict[str, WorkflowContext] = {}
workflow_executors: Dict[str, WorkflowExecutor] = {}

async def start_workflow(user_command: str, user: str) -> WorkflowContext:
    """
    Creates a new workflow from natural language command.
    Steps:
    1. Call Claude API to create a plan
    2. Build DAG from the plan
    3. Start execution in background
    4. Return workflow context immediately (non-blocking)
    """
    # Step 1 — AI creates the plan
    planner = PlannerAgent()
    plan = await planner.create_plan(user_command)
    
    # Step 2 — Create context
    context = WorkflowContext(
        workflow_id=plan.workflow_id,
        user_command=user_command
    )
    
    # Store workflow
    active_workflows[plan.workflow_id] = context
    
    # Step 3 — Create executor
    executor = WorkflowExecutor()
    workflow_executors[plan.workflow_id] = executor
    
    # Step 4 — Run in background (don't block the API response)
    dag = DAGEngine()
    asyncio.create_task(
        executor.execute_workflow(dag, plan, context)
    )
    
    logger.info(f"[Manager] Workflow {plan.workflow_id} started by {user}")
    return context

def get_workflow(workflow_id: str) -> Optional[WorkflowContext]:
    """Get current state of a workflow"""
    return active_workflows.get(workflow_id)

def get_all_workflows() -> list:
    """Get all workflows with their current status"""
    return [
        {
            "workflow_id": ctx.workflow_id,
            "user_command": ctx.user_command,
            "status": ctx.status,
            "started_at": ctx.started_at,
            "steps_completed": len([
                s for s in ctx.step_results.values()
                if s.status == "success"
            ]),
            "total_steps": len(ctx.step_results),
        }
        for ctx in active_workflows.values()
    ]

def approve_workflow_step(workflow_id: str, step_id: str, approved: bool) -> bool:
    """
    Called when user clicks Approve/Reject in the UI.
    Unpauses the workflow executor for that step.
    """
    executor = workflow_executors.get(workflow_id)
    if not executor:
        return False
    executor.approve_step(step_id, approved)
    return True

def get_pending_approvals() -> list:
    """Get all steps currently waiting for human approval"""
    pending = []
    for workflow_id, executor in workflow_executors.items():
        for step_id in executor.pending_approvals:
            if not executor.pending_approvals[step_id].is_set():
                context = active_workflows.get(workflow_id)
                pending.append({
                    "workflow_id": workflow_id,
                    "step_id": step_id,
                    "user_command": context.user_command if context else ""
                })
    return pending