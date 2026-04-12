import os
from dotenv import load_dotenv
load_dotenv()
from connectors.base import BaseConnector
from loguru import logger

class SheetsConnector(BaseConnector):
    """
    MCP Connector for Google Sheets.
    Logs all incident data into a spreadsheet automatically.
    """

    def __init__(self):
        base_url = os.getenv("SHEETS_BASE_URL", "https://sheets.googleapis.com")
        super().__init__("Sheets", base_url)
        self.default_sheet = os.getenv("SHEETS_DOCUMENT_ID", "incident-log")

    async def _get_auth_headers(self) -> dict:
        """Fetches dynamic OAuth token if credentials are provided."""
        headers = {}
        try:
            import google.auth
            import google.auth.transport.requests
            # Requires GOOGLE_APPLICATION_CREDENTIALS environment variable
            creds, _ = google.auth.default(scopes=['https://www.googleapis.com/auth/spreadsheets'])
            request = google.auth.transport.requests.Request()
            creds.refresh(request)
            if creds.token:
                headers["Authorization"] = f"Bearer {creds.token}"
        except ImportError:
            logger.warning("[Sheets] google-auth not installed, continuing without auth")
        except Exception as e:
            logger.debug(f"[Sheets] Could not load google credentials: {e}")
        return headers

    # ── TOOL 1 ──────────────────────────────────────────────
    async def log_incident(self, ticket_id: str, branch: str, status: str, notified: str) -> dict:
        """
        Log an incident row to the incident spreadsheet.
        Called automatically at the end of every bug workflow.
        """
        logger.info(f"[Sheets] Logging incident: {ticket_id}")
        
        # We append a simple value range
        data = {
            "values": [[ticket_id, branch, status, notified]]
        }
        headers = await self._get_auth_headers()
        
        # Override headers for this request by accessing the client directly 
        # or passing headers (BaseConnector wouldn't normally pass headers per-request, 
        # but we can update BaseConnector get/post to accept **kwargs). 
        # To avoid BaseConnector changes, we can manually do it:
        url = f"{self.base_url}/v4/spreadsheets/{self.default_sheet}/values/A1:append?valueInputOption=USER_ENTERED"
        try:
            response = await self.client.post(url, json=data, headers=headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"[Sheets] POST failed: {e}")
            return {"error": str(e), "service": self.service_name}

    # ── TOOL 2 ──────────────────────────────────────────────
    async def get_all_incidents(self) -> dict:
        """Get all rows from the incident log spreadsheet"""
        logger.info("[Sheets] Fetching all incidents")
        headers = await self._get_auth_headers()
        result = await self.get(f"/v4/spreadsheets/{self.default_sheet}/values/A:D", headers=headers)
        return result

    # ── TOOL 3 ──────────────────────────────────────────────
    async def get_spreadsheet(self, sheet_id: str = None) -> dict:
        """Get spreadsheet metadata"""
        sheet_id = sheet_id or self.default_sheet
        logger.info(f"[Sheets] Getting spreadsheet: {sheet_id}")
        headers = await self._get_auth_headers()
        result = await self.get(f"/v4/spreadsheets/{sheet_id}", headers=headers)
        return result

    # ── TOOL 4 ──────────────────────────────────────────────
    async def append_custom_row(self, sheet_id: str, values: list) -> dict:
        """Append a custom row to any spreadsheet"""
        logger.info(f"[Sheets] Appending row to {sheet_id}: {values}")
        headers = await self._get_auth_headers()
        result = await self.post(
            f"/v4/spreadsheets/{sheet_id}/values/A:X:append?valueInputOption=USER_ENTERED",
            {"values": [values]},
            headers=headers
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