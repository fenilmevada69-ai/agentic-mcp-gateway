import sqlite3
import os
from loguru import logger

# Path to the SQLite database file
DB_PATH = os.path.join(os.path.dirname(__file__), "gateway.db")

def get_db_connection():
    """Create a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database and create tables if they don't exist."""
    logger.info(f"[DB] Initializing database at {DB_PATH}")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            api_key TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("[DB] Database initialized successfully")

def add_user(username, hashed_password, api_key):
    """Add a new user to the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, hashed_password, api_key) VALUES (?, ?, ?)",
            (username, hashed_password, api_key)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        logger.warning(f"[DB] Failed to add user {username}: name already exists")
        return False
    finally:
        conn.close()

def get_user_by_username(username):
    """Retrieve a user by username."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return user

def get_user_by_api_key(api_key):
    """Retrieve a user by API key."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE api_key = ?", (api_key,))
    user = cursor.fetchone()
    conn.close()
    return user

# Initialize the database when this module is loaded
if not os.path.exists(DB_PATH):
    init_db()
