import httpx
import os
from loguru import logger
from dotenv import load_dotenv

load_dotenv()

class BaseConnector:
    """
    Parent class for all MCP connectors.
    Every connector (Jira, GitHub, Slack, Sheets) inherits from this.
    """

    def __init__(self, service_name: str, base_url: str, headers: dict = None, auth: tuple = None):
        self.service_name = service_name
        self.base_url = base_url
        
        client_kwargs = {"timeout": 30.0}
        if headers:
            client_kwargs["headers"] = headers
        if auth:
            client_kwargs["auth"] = auth
            
        self.client = httpx.AsyncClient(**client_kwargs)
        logger.info(f"[{service_name}] Connector initialized → {base_url}")

    async def get(self, endpoint: str, params: dict = None, headers: dict = None):
        """Make a GET request to the service"""
        url = f"{self.base_url}{endpoint}"
        try:
            logger.info(f"[{self.service_name}] GET {url}")
            response = await self.client.get(url, params=params, headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"[{self.service_name}] GET failed: {e}")
            return {"error": str(e), "service": self.service_name}

    async def post(self, endpoint: str, data: dict = None, headers: dict = None):
        """Make a POST request to the service"""
        url = f"{self.base_url}{endpoint}"
        try:
            logger.info(f"[{self.service_name}] POST {url} → {data}")
            response = await self.client.post(url, json=data, headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"[{self.service_name}] POST failed: {e}")
            return {"error": str(e), "service": self.service_name}

    async def put(self, endpoint: str, data: dict = None, headers: dict = None):
        """Make a PUT request to the service"""
        url = f"{self.base_url}{endpoint}"
        try:
            logger.info(f"[{self.service_name}] PUT {url} → {data}")
            response = await self.client.put(url, json=data, headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"[{self.service_name}] PUT failed: {e}")
            return {"error": str(e), "service": self.service_name}

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
        logger.info(f"[{self.service_name}] Connector closed")