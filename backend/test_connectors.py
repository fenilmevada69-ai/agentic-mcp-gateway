import asyncio
from connectors.jira.connector import JiraConnector
from connectors.github.connector import GitHubConnector
from connectors.slack.connector import SlackConnector
from connectors.sheets.connector import SheetsConnector

async def test_all():
    print("\n===== TESTING ALL MCP CONNECTORS =====\n")

    # Test Jira
    jira = JiraConnector()
    result = await jira.list_tickets()
    print(f"✅ Jira - List tickets: {len(result)} tickets found")
    result = await jira.get_ticket("BUG-421")
    print(f"✅ Jira - Get ticket BUG-421: {result['title']}")

    # Test GitHub
    github = GitHubConnector()
    result = await github.create_branch("feature/BUG-421-payment-fix")
    print(f"✅ GitHub - Created branch: {result['name']}")

    # Test Slack
    slack = SlackConnector()
    result = await slack.send_message("general", "MCP Agent connector test ✅")
    print(f"✅ Slack - Message sent: {result['ok']}")

    # Test Sheets
    sheets = SheetsConnector()
    result = await sheets.log_incident("BUG-421", "feature/BUG-421", "In Progress", "oncall-team")
    print(f"✅ Sheets - Row logged: {result['updatedRows']} row added")

    print("\n===== ALL CONNECTORS WORKING ✅ =====\n")

if __name__ == "__main__":
    asyncio.run(test_all())