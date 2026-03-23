import asyncio
import os
from dotenv import load_dotenv
from supabase import create_async_client

async def check_db():
    load_dotenv()
    url = os.getenv("S_URL")
    key = os.getenv("S_SERV") or os.getenv("S_ANON")
    
    print(f"Connecting to: {url}")
    supabase = await create_async_client(url, key)
    
    # Check for 'users' table
    try:
        res = await supabase.from_("users").select("id").limit(1).execute()
        print(f"Table 'users' check: SUCCESS (found {len(res.data)} rows)")
    except Exception as e:
        print(f"Table 'users' check: FAILED - {e}")

    # Check for other tables
    tables = ["assessments", "conversations", "daily_logs", "agent_tasks"]
    for table in tables:
        try:
            await supabase.from_(table).select("id").limit(1).execute()
            print(f"Table '{table}' check: SUCCESS")
        except Exception as e:
            print(f"Table '{table}' check: FAILED - {e}")

asyncio.run(check_db())
