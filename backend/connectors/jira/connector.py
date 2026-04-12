import os
from dotenv import load_dotenv
load_dotenv()
from connectors.base import BaseConnector
from loguru import logger

class JiraConnector(BaseConnector):
    """
    MCP Connector for Jira.
    Wraps Jira REST API into clean tools the AI agent can call.
    """

    def __init__(self):
        base_url = os.getenv("JIRA_BASE_URL", "https://your-domain.atlassian.net")
        email = os.getenv("JIRA_EMAIL")
        api_token = os.getenv("JIRA_API_TOKEN")
        
        auth = (email, api_token) if email and api_token else None
        
        super().__init__("Jira", base_url, auth=auth)

    # ── TOOL 1 ──────────────────────────────────────────────
    async def get_ticket(self, ticket_id: str) -> dict:
        """
        Fetch details of a specific Jira ticket.
        Returns: ticket id, title, priority, status, description
        """
        logger.info(f"[Jira] Fetching ticket: {ticket_id}")
        result = await self.get(f"/rest/api/2/issue/{ticket_id}")
        return result

    # ── TOOL 2 ──────────────────────────────────────────────
    async def create_ticket(self, title: str, description: str, priority: str = "Medium") -> dict:
        """
        Create a new Jira ticket.
        Returns: new ticket with generated ID
        """
        logger.info(f"[Jira] Creating ticket: {title}")
        result = await self.post("/rest/api/2/issue", {
            "title": title,
            "description": description,
            "priority": priority,
            "reporter": "mcp-agent@system.com"
        })
        return result

    # ── TOOL 3 ──────────────────────────────────────────────
    async def update_ticket_status(self, ticket_id: str, status: str, assignee: str = "mcp-agent") -> dict:
        """
        Update the status of a Jira ticket.
        Example: move from Open → In Progress
        """
        logger.info(f"[Jira] Updating {ticket_id} status → {status}")
        result = await self.put(f"/rest/api/2/issue/{ticket_id}/status", {
            "status": status,
            "assignee": assignee
        })
        return result

    # ── TOOL 4 ──────────────────────────────────────────────
    async def list_tickets(self) -> dict:
        """
        List all open Jira tickets.
        """
        logger.info("[Jira] Listing all tickets")
        result = await self.get("/rest/api/3/issue/search", params={"jql": "project IS NOT EMPTY ORDER BY created DESC", "maxResults": 50})
        return result

    def get_tools_schema(self) -> list:
        """
        Returns MCP tool schema — tells the AI what tools this connector has
        and what parameters each tool needs.
        This is what makes it MCP-compliant.
        """
        return [
            {
                "name": "jira_get_ticket",
                "description": "Fetch details of a Jira ticket by ID",
                "parameters": {
                    "ticket_id": {"type": "string", "description": "Jira ticket ID e.g. BUG-421"}
                }
            },
            {
                "name": "jira_create_ticket",
                "description": "Create a new Jira ticket",
                "parameters": {
                    "title": {"type": "string", "description": "Ticket title"},
                    "description": {"type": "string", "description": "Ticket description"},
                    "priority": {"type": "string", "description": "Priority: Low/Medium/High/Critical"}
                }
            },
            {
                "name": "jira_update_status",
                "description": "Update the status of a Jira ticket",
                "parameters": {
                    "ticket_id": {"type": "string", "description": "Jira ticket ID"},
                    "status": {"type": "string", "description": "New status"},
                    "assignee": {"type": "string", "description": "Who to assign to"}
                }
            },
            {
                "name": "jira_list_tickets",
                "description": "List all open Jira tickets",
                "parameters": {}
            }
        ]