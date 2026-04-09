import json
import os
import uuid
import re
from groq import Groq
from loguru import logger
from dotenv import load_dotenv
from context.models import WorkflowPlan

load_dotenv()

class PlannerAgent:
    """
    Uses Groq (free) with Llama 3.3 70b to convert natural language
    commands into structured DAG workflow plans.
    """

    def __init__(self):
        self.client = Groq(
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.model = "llama-3.3-70b-versatile"
        logger.info("[Planner] AI Planning Agent initialized with Groq")

    async def create_plan(self, user_command: str) -> WorkflowPlan:
        """
        Takes a natural language command.
        Returns a structured workflow plan with steps and dependencies.
        """
        workflow_id = str(uuid.uuid4())[:8]
        logger.info(f"[Planner] Creating plan for: {user_command}")

        system_prompt = """You are an AI workflow planner for an Agentic MCP Gateway.
Your job is to convert natural language commands into structured workflow plans.

You have access to these tools:
JIRA TOOLS:
- jira_get_ticket(ticket_id)
- jira_create_ticket(title, description, priority)
- jira_update_status(ticket_id, status, assignee)
- jira_list_tickets()

GITHUB TOOLS:
- github_create_branch(branch_name)
- github_create_pr(title, body, head_branch)
- github_list_branches()

SLACK TOOLS:
- slack_send_incident_alert(ticket_id, title, branch_url, priority)
- slack_send_message(channel, message)

SHEETS TOOLS:
- sheets_log_incident(ticket_id, branch, status, notified)
- sheets_get_all_incidents()

RULES:
1. Each step must have: id, tool, parameters, depends_on, needs_approval, description
2. Steps with no dependencies run first
3. Steps that can run simultaneously must have same depends_on
4. needs_approval=true only for sending external alerts
5. Return ONLY valid JSON — no explanation, no markdown, no backticks

OUTPUT FORMAT:
{
  "steps": [
    {
      "id": "step_1",
      "tool": "jira_get_ticket",
      "description": "Fetch the bug ticket details",
      "parameters": {"ticket_id": "BUG-421"},
      "depends_on": [],
      "needs_approval": false
    },
    {
      "id": "step_2",
      "tool": "github_create_branch",
      "description": "Create fix branch from ticket",
      "parameters": {"branch_name": "feature/BUG-421-fix"},
      "depends_on": ["step_1"],
      "needs_approval": false
    },
    {
      "id": "step_3a",
      "tool": "slack_send_incident_alert",
      "description": "Notify oncall team",
      "parameters": {
        "ticket_id": "BUG-421",
        "title": "Payment gateway timeout",
        "branch_url": "feature/BUG-421-fix",
        "priority": "Critical"
      },
      "depends_on": ["step_2"],
      "needs_approval": true
    },
    {
      "id": "step_3b",
      "tool": "sheets_log_incident",
      "description": "Log incident to spreadsheet",
      "parameters": {
        "ticket_id": "BUG-421",
        "branch": "feature/BUG-421-fix",
        "status": "In Progress",
        "notified": "oncall-team"
      },
      "depends_on": ["step_2"],
      "needs_approval": false
    }
  ]
}"""

        user_prompt = f"Create a workflow plan for this command: {user_command}"

        logger.info("[Planner] Calling Groq API...")

        # Groq uses synchronous client — run in thread to avoid blocking
        import asyncio
        loop = asyncio.get_event_loop()
        message = await loop.run_in_executor(
            None,
            lambda: self.client.chat.completions.create(
                model=self.model,
                max_tokens=2000,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1  # Low temperature = more consistent JSON output
            )
        )

        response_text = message.choices[0].message.content
        logger.info(f"[Planner] Groq response received")

        try:
            # Try direct JSON parse first
            plan_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Extract JSON block if model added extra text
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    plan_data = json.loads(json_match.group())
                except:
                    logger.warning("[Planner] JSON parse failed — using default plan")
                    plan_data = self._default_bug_plan()
            else:
                logger.warning("[Planner] No JSON found — using default plan")
                plan_data = self._default_bug_plan()

        workflow_plan = WorkflowPlan(
            workflow_id=workflow_id,
            user_command=user_command,
            steps=plan_data.get("steps", [])
        )

        logger.info(f"[Planner] Plan created: {len(workflow_plan.steps)} steps")
        return workflow_plan

    def _default_bug_plan(self) -> dict:
        """Fallback plan if Groq API fails"""
        return {
            "steps": [
                {
                    "id": "step_1",
                    "tool": "jira_get_ticket",
                    "description": "Fetch bug ticket details",
                    "parameters": {"ticket_id": "BUG-421"},
                    "depends_on": [],
                    "needs_approval": False
                },
                {
                    "id": "step_2",
                    "tool": "github_create_branch",
                    "description": "Create fix branch",
                    "parameters": {"branch_name": "feature/BUG-421-fix"},
                    "depends_on": ["step_1"],
                    "needs_approval": False
                },
                {
                    "id": "step_3a",
                    "tool": "slack_send_incident_alert",
                    "description": "Alert oncall team",
                    "parameters": {
                        "ticket_id": "BUG-421",
                        "title": "Critical Bug",
                        "branch_url": "feature/BUG-421-fix",
                        "priority": "Critical"
                    },
                    "depends_on": ["step_2"],
                    "needs_approval": False
                },
                {
                    "id": "step_3b",
                    "tool": "sheets_log_incident",
                    "description": "Log to spreadsheet",
                    "parameters": {
                        "ticket_id": "BUG-421",
                        "branch": "feature/BUG-421-fix",
                        "status": "In Progress",
                        "notified": "oncall-team"
                    },
                    "depends_on": ["step_2"],
                    "needs_approval": False
                }
            ]
        }
