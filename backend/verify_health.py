import asyncio
import requests
from db import get_service_db
from auth import auth
from config import settings

async def comprehensive_health_check():
    print("=== Supabase Connection Health Check ===")
    
    # 1. Check Auth (GoTrue) via requests
    print("\n[Auth] Testing GoTrue API (via requests)...")
    try:
        url = f"{settings.supabase_url}/auth/v1/health"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            print(" ✅ Auth API is responsive.")
        else:
            print(f" ⚠️ Auth API returned status {res.status_code}")
    except Exception as e:
        print(f" ❌ Auth API check failed: {e}")

    # 2. Check Database (PostgREST) via Async Client
    print("\n[Database] Testing PostgREST API (read)...")
    try:
        db = await get_service_db()
        # Ping the 'users' table
        res = await db.from_("users").select("id", count="exact").limit(1).execute()
        print(f" ✅ Database read successful. Found {res.count} users in 'users' table.")
    except Exception as e:
        print(f" ❌ Database read failed: {e}")

    # 3. Check Write Access (Insert/Delete test)
    print("\n[Database] Testing Write Access...")
    try:
        # We'll use 'daily_logs' or similar if it exists, or just try to insert a fake assessment if the table exists
        # Let's try to search for the assessment table
        test_id = "00000000-0000-0000-0000-000000000000"
        print(f" - Attempting dummy insert into 'daily_logs' (if table exists)...")
        # Try a safe insert that we can clean up
        try:
            # We use service role so we bypass RLS for this check
            insert_res = await db.from_("daily_logs").insert({
                "user_id": test_id,
                "mood_score": 5,
                "notes": "HEALTH_CHECK_TEMP_DATA"
            }).execute()
            print(" ✅ Write successful.")
            
            # Cleanup
            await db.from_("daily_logs").delete().eq("notes", "HEALTH_CHECK_TEMP_DATA").execute()
            print(" ✅ Cleanup successful.")
        except Exception as write_err:
            if "relation" in str(write_err).lower() and "does not exist" in str(write_err).lower():
                 print(f" ℹ️ Table 'daily_logs' doesn't exist yet, skipping write test. (This is normal for new apps)")
            else:
                 print(f" ❌ Write failed: {write_err}")

    except Exception as e:
        print(f" ❌ General Database check failed: {e}")

    print("\n=== End of Health Check ===")

if __name__ == "__main__":
    asyncio.run(comprehensive_health_check())
