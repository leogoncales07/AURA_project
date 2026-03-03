import asyncio
import os
from auth import auth
from config import settings

async def ensure_demo_user():
    print("Checking/Creating demo user...")
    
    email = "demo@aura.com"
    password = "demo123456"
    name = "Utilizador Demo"
    
    # Try to login first (to see if it exists)
    result = await auth.login(email, password)
    
    if "error" in result:
        print(f"Demo user not found or error login in: {result.get('error')}")
        print("Attempting to signup demo user...")
        signup_result = await auth.signup(email, password, name)
        
        if "error" in signup_result:
            print(f"Error creating demo user: {signup_result.get('error')}")
        else:
            print("Demo user created successfully!")
    else:
        print("Demo user already exists and is working correctly.")

if __name__ == "__main__":
    asyncio.run(ensure_demo_user())
