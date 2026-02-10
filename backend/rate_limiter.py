"""
Rate Limiter — Token Bucket Algorithm
=======================================
Prevents exceeding API quotas (Gemini free tier, Supabase, etc.)
with automatic retry and exponential backoff.
"""

import time
import threading
import functools
from colorama import Fore, init

init(autoreset=True)


class TokenBucket:
    """
    Thread-safe Token Bucket rate limiter.
    
    - max_tokens: max burst capacity
    - refill_rate: tokens added per second
    """

    def __init__(self, max_tokens: float, refill_rate: float, name: str = "default"):
        self.max_tokens = max_tokens
        self.refill_rate = refill_rate
        self.name = name
        self._tokens = max_tokens
        self._last_refill = time.monotonic()
        self._lock = threading.Lock()

    def _refill(self):
        now = time.monotonic()
        elapsed = now - self._last_refill
        self._tokens = min(self.max_tokens, self._tokens + elapsed * self.refill_rate)
        self._last_refill = now

    def acquire(self, tokens: int = 1, timeout: float = 60.0) -> bool:
        """
        Block until tokens are available or timeout is reached.
        Returns True if tokens were acquired, False on timeout.
        """
        deadline = time.monotonic() + timeout
        while True:
            with self._lock:
                self._refill()
                if self._tokens >= tokens:
                    self._tokens -= tokens
                    return True

            # Calculate wait time
            with self._lock:
                wait = (tokens - self._tokens) / self.refill_rate
            wait = min(wait, deadline - time.monotonic())

            if wait <= 0:
                print(f"{Fore.RED}[RateLimit:{self.name}] Timeout waiting for tokens!")
                return False

            print(f"{Fore.YELLOW}[RateLimit:{self.name}] Waiting {wait:.1f}s for capacity...")
            time.sleep(min(wait, 1.0))  # Sleep in 1s increments for responsiveness

    @property
    def available(self) -> float:
        with self._lock:
            self._refill()
            return self._tokens


# ──────────────────────────────────────────────
# Pre-configured limiters for each service
# ──────────────────────────────────────────────

# Gemini Free Tier: 15 RPM → 0.25 requests/sec
gemini_limiter = TokenBucket(
    max_tokens=5,         # burst of 5
    refill_rate=15 / 60,  # 15 per minute = 0.25/sec
    name="Gemini"
)

# Supabase: generous limits, but still protect
supabase_limiter = TokenBucket(
    max_tokens=20,
    refill_rate=100 / 60,
    name="Supabase"
)


# ──────────────────────────────────────────────
# Decorator for easy use
# ──────────────────────────────────────────────

_LIMITERS = {
    "gemini": gemini_limiter,
    "supabase": supabase_limiter,
}


def rate_limited(service: str, max_retries: int = 3):
    """
    Decorator that applies rate limiting + exponential backoff.
    
    Usage:
        @rate_limited("gemini")
        def call_gemini(prompt):
            ...
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            limiter = _LIMITERS.get(service)
            if not limiter:
                return func(*args, **kwargs)

            for attempt in range(1, max_retries + 1):
                # Wait for rate limit capacity
                if not limiter.acquire():
                    raise RuntimeError(f"Rate limit timeout for {service}")

                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    error_str = str(e).upper()
                    if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                        backoff = 2 ** attempt
                        print(
                            f"{Fore.YELLOW}[RateLimit:{service}] "
                            f"Quota hit (attempt {attempt}/{max_retries}), "
                            f"backing off {backoff}s..."
                        )
                        time.sleep(backoff)
                    else:
                        raise  # Non-rate-limit error, re-raise immediately

            raise RuntimeError(
                f"Exhausted {max_retries} retries for {service} after rate limit errors."
            )

        return wrapper
    return decorator
