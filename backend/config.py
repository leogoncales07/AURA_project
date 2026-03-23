import sys
import os
import hashlib
from typing import Dict, List, Optional
from dotenv import load_dotenv
from colorama import Fore, init

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

init(autoreset=True)

# --- Path Discovery ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

# Try to load .env from several likely locations
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
else:
    # Try current working directory or parent
    load_dotenv()

def _mask(value: str, visible_chars: int = 4) -> str:
    """Mask a secret, showing only the last N characters."""
    if not value:
        return "EMPTY"
    if len(value) <= visible_chars:
        return "****"
    return "*" * (len(value) - visible_chars) + value[-visible_chars:]


class Settings:
    """
    Immutable settings object. Validates all required keys at creation time.
    Access keys via properties -- never exposes raw values in logs.
    """

    _REQUIRED_KEYS = [
        "G_KEY",
        "S_URL",
        "S_ANON",
        "O_PASS",
    ]

    _OPTIONAL_KEYS = [
        "S_SERV",
        "PORT",
    ]

    def __init__(self):
        self._store: Dict[str, str] = {}
        missing = []

        for key in self._REQUIRED_KEYS:
            val = os.getenv(key, "").strip()
            if not val:
                missing.append(key)
            else:
                self._store[key] = val

        # Load optional keys
        for key in self._OPTIONAL_KEYS:
            val = os.getenv(key, "").strip()
            if val:
                self._store[key] = val

        if missing:
            print(f"{Fore.RED}+==========================================+")
            print(f"{Fore.RED}|  FATAL: Missing environment variables!   |")
            print(f"{Fore.RED}+==========================================+")
            for k in missing:
                print(f"{Fore.RED}  X {k}")
            print(f"\n{Fore.YELLOW}  Please ensure {ENV_PATH} exists and contains these keys.")
            print(f"{Fore.YELLOW}  You can use .env.example as a template.")
            # We exit because the app cannot function without these keys
            sys.exit(1)

        # Startup confirmation (masked)
        print(f"{Fore.CYAN}[Config] Loading settings...")
        for key in self._REQUIRED_KEYS:
            print(f"  {key}: {Fore.GREEN}{_mask(self._store[key])}")
        
        if "S_SERV" in self._store:
            print(f"  S_SERV: {Fore.GREEN}{_mask(self._store['S_SERV'])}")
        else:
            print(f"  S_SERV: {Fore.YELLOW}(Optional) Not set, using anon key fallback")
        print(f"{Fore.CYAN}[Config] Done.\n")

    # --- Properties (read-only access) ---

    @property
    def google_api_key(self) -> str:
        return self._store["G_KEY"]

    @property
    def supabase_url(self) -> str:
        return self._store["S_URL"]

    @property
    def supabase_anon_key(self) -> str:
        return self._store["S_ANON"]

    @property
    def supabase_service_role_key(self) -> str:
        """Falls back to anon key if service role key is not set or invalid."""
        key = self._store.get("S_SERV", "").strip()
        # Basic JWT validation: service role keys are usually JWTs
        if not key or "." not in key:
            return self._store["S_ANON"]
        return key

    @property
    def owner_secret(self) -> str:
        return self._store["O_PASS"]
    
    @property
    def port(self) -> int:
        return int(self._store.get("PORT", "8000"))

    def mask(self, key_name: str) -> str:
        """Get a masked version of any stored key for logging."""
        return _mask(self._store.get(key_name, ""))


# Singleton -- import this everywhere
try:
    settings = Settings()
except Exception as e:
    print(f"{Fore.RED}Critical error during configuration initialization: {e}")
    sys.exit(1)
