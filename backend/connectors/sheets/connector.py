import os
from connectors.base import BaseConnector
from loguru import logger

class SheetsConnector(BaseConnector):
    """
    MCP Connector for Google Sheets.
    Logs all incident data into a spreadsheet automatically.
    """

    def __init__(self):
        base_url = os.getenv("SHEETS_BASE_URL", "http://localhost:8004")
        super().__init__("Sheets", base_url)
        self.default_sheet = "incident-log"

    # ── TOOL 1 ──────────────────────────────────────────────
    async def log_incident(self, ticket_id: str, branch: str, status: str, notified: str) -> dict:
        """
        Log an incident row to the incident spreadsheet.
        Called automatically at the end of every bug workflow.
        """
        logger.info(f"[Sheets] Logging incident: {ticket_id}")
        result = await self.post(
            f"/v4/spreadsheets/{self.default_sheet}/values/append",
            {"values": [ticket_id, branch, status, notified]}
        )
        return result

    # ── TOOL 2 ──────────────────────────────────────────────
    async def get_all_incidents(self) -> dict:
        """Get all rows from the incident log spreadsheet"""
        logger.info("[Sheets] Fetching all incidents")
        result = await self.get(f"/v4/spreadsheets/{self.default_sheet}/values")
        return result

    # ── TOOL 3 ──────────────────────────────────────────────
    async def get_spreadsheet(self, sheet_id: str = None) -> dict:
        """Get spreadsheet metadata"""
        sheet_id = sheet_id or self.default_sheet
        logger.info(f"[Sheets] Getting spreadsheet: {sheet_id}")
        result = await self.get(f"/v4/spreadsheets/{sheet_id}")
        return result

    # ── TOOL 4 ──────────────────────────────────────────────
    async def append_custom_row(self, sheet_id: str, values: list) -> dict:
        """Append a custom row to any spreadsheet"""
        logger.info(f"[Sheets] Appending row to {sheet_id}: {values}")
        result = await self.post(
            f"/v4/spreadsheets/{sheet_id}/values/append",
            {"values": values}
        )
        return result

    def get_tools_schema(self) -> list:
        return [
            {
                "name": "sheets_log_incident",
                "description": "Log an incident to the incident tracking spreadsheet",
                "parameters": {
                    "ticket_id": {"type": "string", "description": "Jira ticket ID"},
                    "branch": {"type": "string", "description": "GitHub branch name"},
                    "status": {"type": "string", "description": "Current status"},
                    "notified": {"type": "string", "description": "Who was notified"}
                }
            },
            {
                "name": "sheets_get_all_incidents",
                "description": "Get all incidents from the incident log",
                "parameters": {}
            },
            {
                "name": "sheets_get_spreadsheet",
                "description": "Get spreadsheet metadata",
                "parameters": {
                    "sheet_id": {"type": "string", "description": "Spreadsheet ID"}
                }
            },
            {
                "name": "sheets_append_row",
                "description": "Append a custom row to a spreadsheet",
                "parameters": {
                    "sheet_id": {"type": "string", "description": "Spreadsheet ID"},
                    "values": {"type": "array", "description": "List of values to append"}
                }
            }
        ]