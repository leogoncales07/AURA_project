"""
Authentication & User Management
==================================
Supabase Auth helpers for signup, login, and JWT token validation.
Uses Supabase's built-in GoTrue authentication.
"""

import asyncio
from typing import Optional
from config import settings


import requests

class SupabaseAuth:
    """
    Wrapper around Supabase Auth (GoTrue) using requests.
    Bypasses httpx hangs on specific Windows environments.
    """

    def __init__(self):
        self.auth_url = f"{settings.supabase_url}/auth/v1"
        self.headers = {
            "apikey": settings.supabase_anon_key,
            "Content-Type": "application/json",
        }

    async def signup(self, email: str, password: str, name: str = "") -> dict:
        """Register a new user via Supabase Auth (Sync via Thread)."""
        def _call():
            try:
                response = requests.post(
                    f"{self.auth_url}/signup",
                    headers=self.headers,
                    json={"email": email, "password": password, "data": {"name": name}},
                    timeout=10
                )
                if response.status_code >= 400:
                    try:
                        return {"error": response.json().get("msg", response.text), "status": response.status_code}
                    except:
                        return {"error": "Signup failed", "status": response.status_code}
                return response.json()
            except requests.exceptions.Timeout:
                return {"error": "Supabase authentication timeout. Try again.", "status": 504}
            except requests.exceptions.RequestException as e:
                return {"error": f"Supabase auth request failed: {str(e)}", "status": 503}
        return await asyncio.to_thread(_call)

    async def login(self, email: str, password: str) -> dict:
        """Login with email and password (Sync via Thread)."""
        def _call():
            try:
                response = requests.post(
                    f"{self.auth_url}/token?grant_type=password",
                    headers=self.headers,
                    json={"email": email, "password": password},
                    timeout=10
                )
                if response.status_code >= 400:
                    try:
                        err_data = response.json()
                        err_msg = err_data.get("error_description") or err_data.get("msg") or response.text
                        return {"error": err_msg, "status": response.status_code}
                    except:
                        return {"error": "Login failed", "status": response.status_code}
                return response.json()
            except requests.exceptions.Timeout:
                return {"error": "Authentication server timeout. Please try again.", "status": 504}
            except requests.exceptions.RequestException as e:
                return {"error": f"Authentication server request failed: {str(e)}", "status": 503}
        return await asyncio.to_thread(_call)

    async def get_user(self, access_token: str) -> dict:
        """Get the authenticated user's profile from their JWT (Sync via Thread)."""
        def _call():
            try:
                headers = {**self.headers, "Authorization": f"Bearer {access_token}"}
                response = requests.get(f"{self.auth_url}/user", headers=headers, timeout=10)
                if response.status_code >= 400:
                    return {"error": "Invalid or expired token", "status": response.status_code}
                return response.json()
            except requests.exceptions.Timeout:
                return {"error": "Authentication server timeout", "status": 504}
            except requests.exceptions.RequestException:
                return {"error": "Authentication server error", "status": 503}
        return await asyncio.to_thread(_call)

    async def refresh_token(self, refresh_token: str) -> dict:
        """Refresh an expired access token (Sync via Thread)."""
        def _call():
            try:
                response = requests.post(
                    f"{self.auth_url}/token?grant_type=refresh_token",
                    headers=self.headers,
                    json={"refresh_token": refresh_token},
                    timeout=10
                )
                if response.status_code >= 400:
                    return {"error": "Invalid refresh token", "status": response.status_code}
                return response.json()
            except requests.exceptions.Timeout:
                return {"error": "Authentication server timeout", "status": 504}
            except requests.exceptions.RequestException:
                return {"error": "Authentication server error", "status": 503}
        return await asyncio.to_thread(_call)

    async def logout(self, access_token: str) -> dict:
        """Invalidate the user's session (Sync via Thread)."""
        def _call():
            try:
                headers = {**self.headers, "Authorization": f"Bearer {access_token}"}
                response = requests.post(f"{self.auth_url}/logout", headers=headers, timeout=10)
                if response.status_code >= 400:
                    return {"error": "Logout failed", "status": response.status_code}
                return {"message": "Logged out successfully"}
            except requests.exceptions.RequestException:
                return {"message": "Logged out locally"}
        return await asyncio.to_thread(_call)


# Singleton
auth = SupabaseAuth()
