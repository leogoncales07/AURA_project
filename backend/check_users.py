import asyncio
from db import get_service_db

async def x():
    try:
        db = await get_service_db()
        res = await db.from_('users').select('*').execute()
        print(f"FOUND {len(res.data)} USERS")
        for u in res.data:
            print(f"- {u.get('id')}: {u.get('name')}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == '__main__':
    asyncio.run(x())
