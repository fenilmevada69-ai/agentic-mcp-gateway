import asyncio
import re
from loguru import logger
from typing import Dict, Any, List, Callable, Optional
from context.models import WorkflowContext, StepResult
from connectors.jira.connector import JiraConnector
from connectors.github.connector import GitHubConnector
from connectors.slack.connector import SlackConnector
from connectors.sheets.connector import SheetsConnector

class WorkflowExecutor:
    """
    Executes the DAG workflow step by step.
    
    What it does:
    - Runs each wave of steps (parallel steps use asyncio.gather)
    - Resolves {{step_id.field}} placeholders with real data
    - Retries failed steps up to 3 times
    - Pauses for human approval on sensitive steps
    - Updates WorkflowContext after every step
    """

    def __init__(self, approval_callback: Optional[Callable] = None):
        # Initialize all 4 connectors
        self.jira = JiraConnector()
        self.github = GitHubConnector()
        self.slack = SlackConnector()
        self.sheets = SheetsConnector()

        # Maps tool names to actual connector methods
        self.tool_map = {
            "jira_get_ticket": self.jira.get_ticket,
            "jira_create_ticket": self.jira.create_ticket,
            "jira_update_status": self.jira.update_ticket_status,
            "jira_list_tickets": self.jira.list_tickets,
            "github_create_branch": self.github.create_branch,
            "github_create_pr": self.github.create_pull_request,
            "github_list_branches": self.github.list_branches,
            "github_get_branch": self.github.get_branch,
            "slack_send_incident_alert": self.slack.send_incident_alert,
            "slack_send_message": self.slack.send_message,
            "slack_list_channels": self.slack.list_channels,
            "sheets_log_incident": self.sheets.log_incident,
            "sheets_get_all_incidents": self.sheets.get_all_incidents,
            "sheets_append_row": self.sheets.append_custom_row,
        }

        # Approval callback — frontend calls this to approve/reject
        self.approval_callback = approval_callback
        self.pending_approvals: Dict[str, asyncio.Event] = {}
        self.approval_decisions: Dict[str, bool] = {}

        logger.info("[Executor] Workflow Executor initialized")

    def resolve_parameters(self, parameters: Dict, context: WorkflowContext) -> Dict:
        """
        Replace {{step_id.field}} placeholders with real values from context.
        
        Example:
        parameters = {"ticket_id": "{{step_1.id}}"}
        After resolving → {"ticket_id": "BUG-421"}
        """
        resolved = {}
        for key, value in parameters.items():
            if isinstance(value, str) and "{{" in value:
                # Find all placeholders like {{step_1.id}}
                placeholders = re.findall(r'\{\{(\w+)\.(\w+)\}\}', value)
                resolved_value = value
                for step_id, field in placeholders:
                    step_output = context.get_step_output(step_id)
                    field_value = step_output.get(field, f"unknown_{field}")
                    resolved_value = resolved_value.replace(
                        f"{{{{{step_id}.{field}}}}}",
                        str(field_value)
                    )
                resolved[key] = resolved_value
            else:
                resolved[key] = value
        return resolved

    async def execute_step(self, step_id: str, step_data: Dict, context: WorkflowContext, max_retries: int = 3) -> StepResult:
        """
        Execute a single step with retry logic.
        Returns a StepResult with status, output, or error.
        """
        tool_name = step_data["tool"]
        parameters = self.resolve_parameters(step_data.get("parameters", {}), context)
        needs_approval = step_data.get("needs_approval", False)

        # ── Human Approval Gate ──────────────────────────────
        if needs_approval:
            logger.info(f"[Executor] ⏸ Step {step_id} needs approval: {tool_name}")
            approved = await self.request_approval(step_id, tool_name, parameters)
            if not approved:
                return StepResult(
                    step_id=step_id,
                    tool_name=tool_name,
                    status="rejected",
                    output={},
                    error="Rejected by user"
                )

        # ── Execute with Retries ─────────────────────────────
        for attempt in range(max_retries):
            try:
                logger.info(f"[Executor] Running {step_id}: {tool_name} (attempt {attempt + 1})")

                tool_func = self.tool_map.get(tool_name)
                if not tool_func:
                    raise ValueError(f"Unknown tool: {tool_name}")

                # Call the connector tool with resolved parameters
                output = await tool_func(**parameters)

                # Update context with key data from this step
                self._update_context(step_id, tool_name, output, context)

                result = StepResult(
                    step_id=step_id,
                    tool_name=tool_name,
                    status="success",
                    output=output
                )
                context.add_step_result(result)
                logger.info(f"[Executor] ✅ {step_id} completed successfully")
                return result

            except Exception as e:
                logger.warning(f"[Executor] ⚠️ {step_id} attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    # Exponential backoff: wait 1s, 2s, 4s between retries
                    await asyncio.sleep(2 ** attempt)
                else:
                    result = StepResult(
                        step_id=step_id,
                        tool_name=tool_name,
                        status="failed",
                        output={},
                        error=str(e)
                    )
                    context.add_step_result(result)
                    logger.error(f"[Executor] ❌ {step_id} failed after {max_retries} attempts")
                    return result

    def _update_context(self, step_id: str, tool_name: str, output: Dict, context: WorkflowContext):
        """
        After each step, update the shared context with important data.
        This is what makes data flow between steps.
        """
        if "jira" in tool_name and "get" in tool_name:
            context.ticket_id = output.get("id", context.ticket_id)
            context.ticket_title = output.get("title", context.ticket_title)
            context.ticket_priority = output.get("priority", context.ticket_priority)

        elif "github_create_branch" in tool_name:
            context.branch_name = output.get("name", context.branch_name)
            context.branch_url = output.get("url", context.branch_url)

        elif "slack" in tool_name:
            context.slack_notified = output.get("ok", False)

        elif "sheets_log" in tool_name:
            context.sheet_logged = output.get("updatedRows", 0) > 0

    async def request_approval(self, step_id: str, tool_name: str, parameters: Dict) -> bool:
        """
        Pause execution and wait for human approval.
        Frontend sends approve/reject via API.
        Timeout after 5 minutes — auto-reject.
        """
        event = asyncio.Event()
        self.pending_approvals[step_id] = event
        logger.info(f"[Executor] Waiting for approval on {step_id}...")

        try:
            # Wait max 5 minutes for approval
            await asyncio.wait_for(event.wait(), timeout=300)
            return self.approval_decisions.get(step_id, False)
        except asyncio.TimeoutError:
            logger.warning(f"[Executor] Approval timeout for {step_id} — auto-rejecting")
            return False

    def approve_step(self, step_id: str, approved: bool):
        """Called by the API when user clicks Approve/Reject in the UI"""
        self.approval_decisions[step_id] = approved
        event = self.pending_approvals.get(step_id)
        if event:
            event.set()
            logger.info(f"[Executor] Step {step_id} {'approved ✅' if approved else 'rejected ❌'}")

    async def execute_workflow(self, dag_engine, workflow_plan, context: WorkflowContext) -> WorkflowContext:
        """
        Main execution method.
        Runs all waves in order, parallel steps within each wave.
        """
        logger.info(f"[Executor] 🚀 Starting workflow: {context.workflow_id}")

        # Build the graph
        dag_engine.build_graph(workflow_plan.steps)

        # Print the ASCII visualization for logs
        viz = dag_engine.visualize_ascii(workflow_plan.steps)
        logger.info(viz)

        # Get execution waves
        waves = dag_engine.get_execution_order()

        # Execute wave by wave
        for wave_index, wave in enumerate(waves):
            logger.info(f"[Executor] ⚡ Executing Wave {wave_index + 1}: {wave}")

            # Build list of coroutines for this wave
            tasks = []
            for step_id in wave:
                step_data = dag_engine.get_step_data(step_id)
                tasks.append(
                    self.execute_step(step_id, step_data, context)
                )

            # Run all steps in this wave simultaneously
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Check if any critical step failed
            for result in results:
                if isinstance(result, StepResult) and result.status == "failed":
                    logger.error(f"[Executor] Critical step failed: {result.step_id}")

        # Mark workflow complete
        context.status = "completed"
        logger.info(f"[Executor] 🎉 Workflow {context.workflow_id} completed!")
        logger.info(f"[Executor] Summary: {context.summarize()}")

        return context