import os
from connectors.base import BaseConnector
from loguru import logger

class GitHubConnector(BaseConnector):
    """
    MCP Connector for GitHub.
    Wraps GitHub REST API into clean tools the AI agent can call.
    """

    def __init__(self):
        base_url = os.getenv("GITHUB_BASE_URL", "http://localhost:8002")
        super().__init__("GitHub", base_url)
        self.owner = "mcp-org"
        self.repo = "main-repo"

    # ── TOOL 1 ──────────────────────────────────────────────
    async def create_branch(self, branch_name: str) -> dict:
        """
        Create a new GitHub branch.
        branch_name is usually built from the Jira ticket ID.
        Example: feature/BUG-421-payment-timeout
        """
        logger.info(f"[GitHub] Creating branch: {branch_name}")
        result = await self.post(
            f"/repos/{self.owner}/{self.repo}/git/refs",
            {"ref": f"refs/heads/{branch_name}"}
        )
        return result

    # ── TOOL 2 ──────────────────────────────────────────────
    async def list_branches(self) -> dict:
        """List all branches in the repository"""
        logger.info("[GitHub] Listing branches")
        result = await self.get(f"/repos/{self.owner}/{self.repo}/branches")
        return result

    # ── TOOL 3 ──────────────────────────────────────────────
    async def create_pull_request(self, title: str, body: str, head_branch: str) -> dict:
        """
        Create a pull request from head_branch into main.
        """
        logger.info(f"[GitHub] Creating PR: {title}")
        result = await self.post(
            f"/repos/{self.owner}/{self.repo}/pulls",
            {
                "title": title,
                "body": body,
                "head": head_branch,
                "base": "main"
            }
        )
        return result

    # ── TOOL 4 ──────────────────────────────────────────────
    async def get_branch(self, branch_name: str) -> dict:
        """Get details of a specific branch"""
        logger.info(f"[GitHub] Getting branch: {branch_name}")
        result = await self.get(
            f"/repos/{self.owner}/{self.repo}/branches/{branch_name}"
        )
        return result

    def get_tools_schema(self) -> list:
        return [
            {
                "name": "github_create_branch",
                "description": "Create a new GitHub branch for a bug fix or feature",
                "parameters": {
                    "branch_name": {"type": "string", "description": "Branch name e.g. feature/BUG-421"}
                }
            },
            {
                "name": "github_list_branches",
                "description": "List all branches in the repository",
                "parameters": {}
            },
            {
                "name": "github_create_pr",
                "description": "Create a pull request",
                "parameters": {
                    "title": {"type": "string", "description": "PR title"},
                    "body": {"type": "string", "description": "PR description"},
                    "head_branch": {"type": "string", "description": "Source branch name"}
                }
            },
            {
                "name": "github_get_branch",
                "description": "Get details of a specific branch",
                "parameters": {
                    "branch_name": {"type": "string", "description": "Branch name"}
                }
            }
        ]