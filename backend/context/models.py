from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime

# ── What a single workflow step looks like ──────────────────
class StepResult(BaseModel):
    """
    Output of every single step in the DAG.
    Every connector tool returns this.
    """
    step_id: str
    tool_name: str
    status: str                          # "success" | "failed" | "pending" | "waiting_approval"
    output: Dict[str, Any] = {}          # actual data returned by the tool
    error: Optional[str] = None          # error message if failed
    executed_at: str = datetime.now().isoformat()

# ── The shared data bus passed between all steps ─────────────
class WorkflowContext(BaseModel):
    """
    This travels through every step of the workflow.
    Each step reads from it and writes its output into it.
    Think of it as the baton in a relay race.
    """
    workflow_id: str
    user_command: str                    # original natural language command
    started_at: str = datetime.now().isoformat()

    # Key data extracted during workflow
    ticket_id: Optional[str] = None     # set after Jira step
    ticket_title: Optional[str] = None
    ticket_priority: Optional[str] = None
    branch_name: Optional[str] = None   # set after GitHub step
    branch_url: Optional[str] = None
    slack_notified: bool = False         # set after Slack step
    sheet_logged: bool = False           # set after Sheets step

    # Full history of all step results
    step_results: Dict[str, StepResult] = {}

    # Current workflow status
    status: str = "running"             # "running" | "completed" | "failed" | "waiting_approval"

    def add_step_result(self, result: StepResult):
        """Add a completed step result to context"""
        self.step_results[result.step_id] = result

    def get_step_output(self, step_id: str) -> Dict:
        """Get output of a previous step — used by dependent steps"""
        result = self.step_results.get(step_id)
        return result.output if result else {}

    def summarize(self) -> str:
        """
        Returns a short summary of what happened.
        Used when context is too large for Claude API window.
        """
        completed = [s for s in self.step_results.values() if s.status == "success"]
        failed = [s for s in self.step_results.values() if s.status == "failed"]
        return (
            f"Workflow {self.workflow_id}: {len(completed)} steps completed, "
            f"{len(failed)} failed. "
            f"Ticket: {self.ticket_id}, Branch: {self.branch_name}, "
            f"Slack notified: {self.slack_notified}, Sheet logged: {self.sheet_logged}"
        )

# ── What the AI planning agent returns ──────────────────────
class WorkflowPlan(BaseModel):
    """
    The DAG plan created by Claude AI.
    Contains all steps and their dependencies.
    """
    workflow_id: str
    user_command: str
    steps: List[Dict[str, Any]]          # list of step definitions
    created_at: str = datetime.now().isoformat()