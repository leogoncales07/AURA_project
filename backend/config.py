import sys

# Force UTF-8 on Windows before any output happens
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

"""
Centralized Configuration & Secret Management
===============================================
All environment variables are loaded, validated, and masked here.
Import `settings` from this module instead of using os.getenv() directly.
"""

import os
import sys
from dotenv import load_dotenv
from colorama import Fore, init

init(autoreset=True)

# Load .env from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


def _mask(value: str, visible_chars: int = 4) -> str:
    """Mask a secret, showing only the last N characters."""
    if not value or len(value) <= visible_chars:
        return "****"
    return "*" * (len(value) - visible_chars) + value[-visible_chars:]


class Settings:
    """
    Immutable settings object. Validates all required keys at creation time.
    Access keys via properties -- never exposes raw values in logs.
    """

    _REQUIRED_KEYS = [
        "GOOGLE_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "OWNER_SECRET",
    ]

    def __init__(self):
        self._store: dict[str, str] = {}
        missing = []

        for key in self._REQUIRED_KEYS:
            val = os.getenv(key, "").strip()
            if not val:
                missing.append(key)
            else:
                self._store[key] = val

        if missing:
            print(f"{Fore.RED}+==========================================+")
            print(f"{Fore.RED}|  FATAL: Missing environment variables!   |")
            print(f"{Fore.RED}+==========================================+")
            for k in missing:
                print(f"{Fore.RED}  X {k}")
            print(f"\n{Fore.YELLOW}  Copy backend/.env.example -> backend/.env and fill in your keys.")
            sys.exit(1)

        # Startup confirmation (masked)
        print(f"{Fore.GREEN}+==========================================+")
        print(f"{Fore.GREEN}|  Config loaded -- all keys validated OK  |")
        print(f"{Fore.GREEN}+==========================================+")
        for key in self._REQUIRED_KEYS:
            print(f"  {key}: {_mask(self._store[key])}")
        print()

    # --- Properties (read-only access) ---

    @property
    def google_api_key(self) -> str:
        return self._store["GOOGLE_API_KEY"]

    @property
    def supabase_url(self) -> str:
        return self._store["SUPABASE_URL"]

    @property
    def supabase_anon_key(self) -> str:
        return self._store["SUPABASE_ANON_KEY"]

    @property
    def supabase_service_role_key(self) -> str:
        return self._store["SUPABASE_SERVICE_ROLE_KEY"]

    @property
    def owner_secret(self) -> str:
        return self._store["OWNER_SECRET"]

    def mask(self, key_name: str) -> str:
        """Get a masked version of any stored key for logging."""
        return _mask(self._store.get(key_name, ""))


# Singleton -- import this everywhere
settings = Settings()
