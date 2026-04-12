import os
import uuid
from loguru import logger
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader
from passlib.context import CryptContext
from security.db import get_user_by_api_key

# Password hashing configuration
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# This tells FastAPI to look for X-API-Key in request headers
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Legacy / Static Keys (can be moved to DB eventually)
STATIC_KEYS = {
    "hackathon-demo-key-2025": "demo-user",
    "admin-key-9999": "admin"
}

def verify_password(plain_password, hashed_password):
    """Verify a plain password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Generate a hash from a plain password."""
    return pwd_context.hash(password)

def generate_api_key():
    """Generate a unique API key for a new user."""
    return f"mcp_{uuid.uuid4().hex[:16]}"

def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Validates the API key from request header.
    Checks both static keys and the SQLite database.
    """
    if not api_key:
        raise HTTPException(
            status_code=403,
            detail="No API key provided. Add X-API-Key header."
        )
    
    # 1. Check static fallback keys
    user_static = STATIC_KEYS.get(api_key)
    if user_static:
        return user_static
    
    # 2. Check the database
    user_db = get_user_by_api_key(api_key)
    if user_db:
        return user_db["username"]
    
    # 3. Fail if neither worked
    raise HTTPException(
        status_code=403,
        detail="Invalid API key."
    )