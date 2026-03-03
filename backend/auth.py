"""
Authentication & User Management
==================================
Supabase Auth helpers for signup, login, and JWT token validation.
Uses Supabase's built-in GoTrue authentication.
"""

import httpx
from typing import Optional
from config import settings


class SupabaseAuth:
    """
    Wrapper around Supabase Auth (GoTrue) REST API.
    Handles signup, login, token refresh, and user info retrieval.
    """

    def __init__(self):
        self.auth_url = f"{settings.supabase_url}/auth/v1"
        self.headers = {
            "apikey": settings.supabase_anon_key,
            "Content-Type": "application/json",
        }

    async def signup(self, email: str, password: str, name: str = "") -> dict:
        """
        Register a new user via Supabase Auth.
        Returns the user object and access/refresh tokens.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.auth_url}/signup",
                headers=self.headers,
                json={
                    "email": email,
                    "password": password,
                    "data": {"name": name},
                },
            )
            if response.status_code >= 400:
                return {"error": response.json().get("msg", response.text), "status": response.status_code}
            return response.json()

    async def login(self, email: str, password: str) -> dict:
        """
        Login with email and password.
        Returns access_token, refresh_token, and user info.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.auth_url}/token?grant_type=password",
                headers=self.headers,
                json={"email": email, "password": password},
            )
            if response.status_code >= 400:
                return {"error": response.json().get("error_description", response.text), "status": response.status_code}
            return response.json()

    async def get_user(self, access_token: str) -> dict:
        """
        Get the authenticated user's profile from their JWT.
        """
        headers = {**self.headers, "Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.auth_url}/user", headers=headers)
            if response.status_code >= 400:
                return {"error": "Invalid or expired token", "status": response.status_code}
            return response.json()

    async def refresh_token(self, refresh_token: str) -> dict:
        """
        Refresh an expired access token.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.auth_url}/token?grant_type=refresh_token",
                headers=self.headers,
                json={"refresh_token": refresh_token},
            )
            if response.status_code >= 400:
                return {"error": "Invalid refresh token", "status": response.status_code}
            return response.json()

    async def logout(self, access_token: str) -> dict:
        """
        Invalidate the user's session.
        """
        headers = {**self.headers, "Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.auth_url}/logout", headers=headers)
            if response.status_code >= 400:
                return {"error": "Logout failed", "status": response.status_code}
            return {"message": "Logged out successfully"}


# Singleton
auth = SupabaseAuth()
