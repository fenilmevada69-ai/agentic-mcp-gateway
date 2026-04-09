import asyncio
import sys
import os

# Tell Python where to find the modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from orchestrator.dag import DAGEngine
from orchestrator.executor import WorkflowExecutor
from context.models import WorkflowContext, WorkflowPlan

async def test_orchestrator():
    print("\n===== TESTING DAG ORCHESTRATOR =====\n")

    plan = WorkflowPlan(
        workflow_id="test-001",
        user_command="Critical bug BUG-421 filed — handle end to end",
        steps=[
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
                    "title": "Payment gateway timeout",
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
    )

    context = WorkflowContext(
        workflow_id=plan.workflow_id,
        user_command=plan.user_command
    )

    dag = DAGEngine()
    executor = WorkflowExecutor()

    dag.build_graph(plan.steps)
    print(dag.visualize_ascii(plan.steps))

    result_context = await executor.execute_workflow(dag, plan, context)

    print("\n===== WORKFLOW RESULTS =====")
    print(f"Status: {result_context.status}")
    print(f"Ticket: {result_context.ticket_id}")
    print(f"Branch: {result_context.branch_name}")
    print(f"Slack notified: {result_context.slack_notified}")
    print(f"Sheet logged: {result_context.sheet_logged}")
    print(f"\nStep Results:")
    for step_id, result in result_context.step_results.items():
        icon = "✅" if result.status == "success" else "❌"
        print(f"  {icon} {step_id} ({result.tool_name}): {result.status}")

    print("\n===== ORCHESTRATOR TEST COMPLETE ✅ =====\n")

if __name__ == "__main__":
    asyncio.run(test_orchestrator())