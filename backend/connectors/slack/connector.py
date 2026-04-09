import os
from connectors.base import BaseConnector
from loguru import logger

class SlackConnector(BaseConnector):
    """
    MCP Connector for Slack.
    Wraps Slack API into clean tools the AI agent can call.
    """

    def __init__(self):
        base_url = os.getenv("SLACK_BASE_URL", "http://localhost:8003")
        super().__init__("Slack", base_url)

    # ── TOOL 1 ──────────────────────────────────────────────
    async def send_message(self, channel: str, message: str) -> dict:
        """
        Send a message to a Slack channel.
        Used to notify on-call engineers about incidents.
        """
        logger.info(f"[Slack] Sending message to #{channel}")
        result = await self.post("/api/chat.postMessage", {
            "channel": channel,
            "text": message,
            "username": "MCP Agent"
        })
        return result

    # ── TOOL 2 ──────────────────────────────────────────────
    async def send_incident_alert(self, ticket_id: str, title: str, branch_url: str, priority: str) -> dict:
        """
        Send a pre-formatted incident alert to #oncall channel.
        This is the main tool used during bug workflow.
        """
        message = (
            f"🚨 *INCIDENT ALERT* 🚨\n"
            f"*Ticket:* {ticket_id}\n"
            f"*Issue:* {title}\n"
            f"*Priority:* {priority}\n"
            f"*Branch:* {branch_url}\n"
            f"*Action Required:* Please review and assign immediately.\n"
            f"_Automated alert by MCP Agent_"
        )
        logger.info(f"[Slack] Sending incident alert for {ticket_id}")
        result = await self.post("/api/chat.postMessage", {
            "channel": "oncall",
            "text": message,
            "username": "MCP Incident Bot"
        })
        return result

    # ── TOOL 3 ──────────────────────────────────────────────
    async def get_channel_messages(self, channel: str) -> dict:
        """Get recent messages from a channel"""
        logger.info(f"[Slack] Getting messages from #{channel}")
        result = await self.get("/api/conversations.history", params={"channel": channel})
        return result

    # ── TOOL 4 ──────────────────────────────────────────────
    async def list_channels(self) -> dict:
        """List all available Slack channels"""
        logger.info("[Slack] Listing channels")
        result = await self.get("/api/conversations.list")
        return result

    def get_tools_schema(self) -> list:
        return [
            {
                "name": "slack_send_message",
                "description": "Send a message to a Slack channel",
                "parameters": {
                    "channel": {"type": "string", "description": "Channel name e.g. oncall, general"},
                    "message": {"type": "string", "description": "Message text to send"}
                }
            },
            {
                "name": "slack_send_incident_alert",
                "description": "Send a formatted incident alert to the oncall channel",
                "parameters": {
                    "ticket_id": {"type": "string", "description": "Jira ticket ID"},
                    "title": {"type": "string", "description": "Issue title"},
                    "branch_url": {"type": "string", "description": "GitHub branch URL"},
                    "priority": {"type": "string", "description": "Ticket priority"}
                }
            },
            {
                "name": "slack_get_messages",
                "description": "Get recent messages from a channel",
                "parameters": {
                    "channel": {"type": "string", "description": "Channel name"}
                }
            },
            {
                "name": "slack_list_channels",
                "description": "List all Slack channels",
                "parameters": {}
            }
        ]