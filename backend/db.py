"""
Supabase Client Module
=======================
Provides Supabase clients for the backend (Async version).
"""

try:
    from supabase import create_async_client, AsyncClient
    from supabase.client import ClientOptions
    HAS_SUPABASE = True
except ImportError:
    from postgrest import AsyncPostgrestClient
    HAS_SUPABASE = False

from config import settings

async def _create_async_client(token: str = None):
    """Create an Async Supabase client or PostgREST client."""
    key = token if token else settings.supabase_anon_key
    
    if HAS_SUPABASE:
        return await create_async_client(
            settings.supabase_url,
            key,
            options=ClientOptions(postgrest_client_timeout=10, storage_client_timeout=10)
        )
    
    # Fallback to PostgREST
    rest_url = f"{settings.supabase_url}/rest/v1"
    headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    from postgrest import AsyncPostgrestClient
    return AsyncPostgrestClient(rest_url, headers=headers)

async def get_db(token: str = None):
    """Returns an ASYNC Supabase/PostgREST client (awaited)."""
    return await _create_async_client(token)

async def get_service_db():
    """Returns a client with the SERVICE ROLE key (awaited)."""
    return await _create_async_client(settings.supabase_service_role_key)

# Startup log
print(f"[Supabase] Database layer initialized (Async).")
