import os
import json
import uuid
from datetime import datetime
from loguru import logger
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

# This tells FastAPI to look for X-API-Key in request headers
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Valid API keys (in production these come from a database)
VALID_API_KEYS = {
    "hackathon-demo-key-2025": "demo-user",
    "admin-key-9999": "admin",
    os.getenv("SECRET_KEY", "hackathon_secret_2025"): "system"
}

def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Validates the API key from request header.
    Returns the username associated with the key.
    Raises 403 if key is invalid.
    """
    if not api_key:
        raise HTTPException(
            status_code=403,
            detail="No API key provided. Add X-API-Key header."
        )
    
    user = VALID_API_KEYS.get(api_key)
    if not user:
        raise HTTPException(
            status_code=403,
            detail="Invalid API key."
        )
    
    return user