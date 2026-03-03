"""
Supabase Client Module
=======================
Provides Supabase clients for the backend (Async version).
- Default client: uses ANON_KEY (respects RLS)
- User client: uses the user's JWT (acts on their behalf)
"""

from config import settings
from postgrest import AsyncPostgrestClient

def _create_async_client(key):
    """Create an Async PostgREST client."""
    rest_url = f"{settings.supabase_url}/rest/v1"
    headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    return AsyncPostgrestClient(rest_url, headers=headers)

# Default client — uses the ANON key (Row Level Security enforced)
# We recreate it per request or use a singleton if we don't change headers.
# For simplicity in async, we provide a helper to get the client.

def get_db(token: str = None):
    """
    Returns an ASYNC PostgREST client.
    If token is provided, uses it as Authorizaton.
    Otherwise, uses the ANON_KEY.
    """
    key = token if token else settings.supabase_anon_key
    return _create_async_client(key)

print(f"[Supabase] Async database layer initialized.")
