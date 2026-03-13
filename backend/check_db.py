import asyncio
from db import get_db, get_service_db
from config import settings

async def check_db():
    print(f"Supabase URL: {settings.supabase_url}")
    print(f"Anon Key (prefix): {settings.supabase_anon_key[:20]}...")
    print(f"Service Key (prefix): {settings.supabase_service_role_key[:20]}...")
    
    # Check public.users table
    db = get_service_db()
    try:
        print("\nChecking public.users table...")
        result = await db.from_("users").select("*").limit(5).execute()
        print(f"Found {len(result.data)} users in public.users.")
        for user in result.data:
            print(f" - ID: {user['id']}, Name: {user.get('name')}")
    except Exception as e:
        print(f"Error checking users table: {e}")

    # Check assessments table
    try:
        print("\nChecking public.assessments table...")
        result = await db.from_("assessments").select("*").limit(5).execute()
        print(f"Found {len(result.data)} assessments.")
    except Exception as e:
        print(f"Error checking assessments table: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
