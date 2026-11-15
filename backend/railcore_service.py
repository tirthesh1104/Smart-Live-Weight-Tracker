"""
Smart Live Weight Tracker - Official RailCore Developer API Service
=============================================================================
Provides secure server-side integration with RailCore Indian Railways REST API.
API Base URL: https://ir.railcore.tech/v1

Key Security & Integrity Rules:
1. RAILCORE_API_KEY is read strictly from server-side environment (.env.local / os.environ).
2. The raw key is never exposed in responses, client bundles, or error messages.
3. In-memory caching respects the free tier quota (2,000 req/month, 20 req/min).
4. No fake or simulated train data is returned when the API fails; returns honest error status.
5. All records are explicitly labeled with source_name = 'RailCore'.
"""

import os
import time
import logging
from typing import Dict, Any, Optional
from pathlib import Path
import httpx
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("railcore_service")

# Load environment variables from .env.local
ROOT_DIR = Path(__file__).resolve().parent.parent
dotenv_path = ROOT_DIR / ".env.local"
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

BASE_URL = "https://ir.railcore.tech/v1"
RAILCORE_API_KEY = os.getenv("RAILCORE_API_KEY", "").strip()

# In-memory TTL Cache to preserve quota (2,000 req/month)
class TTLCache:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            entry = self._cache[key]
            if time.time() < entry["expires_at"]:
                return entry["data"]
            else:
                del self._cache[key]
        return None

    def set(self, key: str, data: Any, ttl_seconds: int):
        self._cache[key] = {
            "data": data,
            "expires_at": time.time() + ttl_seconds
        }

cache = TTLCache()

def mask_key(key: str) -> str:
    """Safely mask key for logs and status, e.g. rc_7f...9b"""
    if not key or len(key) < 8:
        return "NOT_CONFIGURED"
    return f"{key[:6]}...{key[-4:]}"

class RailCoreService:
    def __init__(self):
        self.api_key = os.getenv("RAILCORE_API_KEY", "").strip()
        self.base_url = BASE_URL
        self.last_rate_limit: Dict[str, Any] = {}

    def is_configured(self) -> bool:
        self.api_key = os.getenv("RAILCORE_API_KEY", "").strip()
        return bool(self.api_key and len(self.api_key) >= 8)

    def _get_headers(self) -> Dict[str, str]:
        if not self.is_configured():
            raise ValueError("RAILCORE_API_KEY is not configured on server.")
        return {
            "X-RailCore-Key": self.api_key,
            "User-Agent": "SmartLiveWeightTracker/2.0 (Railway Safety Prototype)",
            "Accept": "application/json"
        }

    async def _execute_request(self, endpoint: str, ttl_seconds: int = 300) -> Dict[str, Any]:
        """Executes authenticated GET request with in-memory caching and error translation."""
        cache_key = f"railcore:{endpoint}"
        cached = cache.get(cache_key)
        if cached is not None:
            return {
                "success": True,
                "source_name": "RailCore",
                "source_type": "THIRD_PARTY_SCHEDULED",
                "retrieved_at": cached.get("retrieved_at"),
                "cached": True,
                "data": cached.get("data")
            }

        if not self.is_configured():
            return {
                "success": False,
                "error": {
                    "code": "RAILCORE_NOT_CONFIGURED",
                    "message": "RailCore API key is not configured on the server. Set RAILCORE_API_KEY in .env.local."
                },
                "source_name": "RailCore",
                "status_code": 503
            }

        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, headers=headers)
                
                # Record headers
                self.last_rate_limit = {
                    "plan": res.headers.get("x-railcore-plan", "unknown"),
                    "credits_cost": res.headers.get("x-railcore-credits-cost"),
                    "credits_remaining": res.headers.get("x-railcore-credits-remaining"),
                    "request_id": res.headers.get("x-railcore-request-id")
                }

                if res.status_code == 200:
                    json_data = res.json()
                    payload = json_data.get("data", json_data)
                    retrieved_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                    
                    cache.set(cache_key, {
                        "data": payload,
                        "retrieved_at": retrieved_at
                    }, ttl_seconds=ttl_seconds)

                    return {
                        "success": True,
                        "source_name": "RailCore",
                        "source_type": "THIRD_PARTY_SCHEDULED",
                        "retrieved_at": retrieved_at,
                        "cached": False,
                        "rate_limits": self.last_rate_limit,
                        "data": payload
                    }
                elif res.status_code == 401:
                    return {
                        "success": False,
                        "error": {
                            "code": "UNAUTHORIZED",
                            "message": "RailCore API authentication failed. Verify RAILCORE_API_KEY on server."
                        },
                        "status_code": 401,
                        "source_name": "RailCore"
                    }
                elif res.status_code == 403:
                    return {
                        "success": False,
                        "error": {
                            "code": "FORBIDDEN",
                            "message": "RailCore endpoint not accessible under current free tier plan."
                        },
                        "status_code": 403,
                        "source_name": "RailCore"
                    }
                elif res.status_code == 429:
                    return {
                        "success": False,
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": "RailCore API rate limit exceeded. Free tier limit is 20 req/min."
                        },
                        "status_code": 429,
                        "source_name": "RailCore",
                        "rate_limits": self.last_rate_limit
                    }
                else:
                    return {
                        "success": False,
                        "error": {
                            "code": f"HTTP_{res.status_code}",
                            "message": f"RailCore provider returned status HTTP {res.status_code}"
                        },
                        "status_code": res.status_code,
                        "source_name": "RailCore"
                    }
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": {
                    "code": "TIMEOUT",
                    "message": "RailCore API connection timed out."
                },
                "status_code": 504,
                "source_name": "RailCore"
            }
        except Exception as e:
            logger.error(f"RailCore request error: {str(e)}")
            return {
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": f"Failed to communicate with RailCore: {str(e)}"
                },
                "status_code": 500,
                "source_name": "RailCore"
            }

    async def get_status(self) -> Dict[str, Any]:
        """Returns health and authentication status of RailCore without exposing raw key."""
        return {
            "service": "RailCore Integration Service",
            "provider_base_url": self.base_url,
            "configured": self.is_configured(),
            "masked_key": mask_key(self.api_key),
            "free_plan_limits": "2,000 req/month, ~20 req/min, 300 req/day",
            "last_rate_limit": self.last_rate_limit,
            "provenance_status": "AUTHORIZED_LIVE" if self.is_configured() else "ACCESS_NOT_AUTHORIZED"
        }

    async def get_train_schedule(self, train_number: str) -> Dict[str, Any]:
        """Fetch train schedule and station halts from RailCore (cached 24 hrs)."""
        clean_num = train_number.strip()
        return await self._execute_request(f"/trains/{clean_num}/schedule", ttl_seconds=86400)

    async def get_coach_position(self, train_number: str) -> Dict[str, Any]:
        """Fetch coach composition order from RailCore (cached 24 hrs)."""
        clean_num = train_number.strip()
        return await self._execute_request(f"/trains/{clean_num}/coach-position", ttl_seconds=86400)

    async def get_station_info(self, station_code: str) -> Dict[str, Any]:
        """Fetch station details from RailCore (cached 24 hrs)."""
        clean_code = station_code.strip().upper()
        return await self._execute_request(f"/stations/{clean_code}", ttl_seconds=86400)

    async def search_stations(self, query: str) -> Dict[str, Any]:
        """Search stations via RailCore IRCTC API with state, city, and coordinates (cached 24 hrs)."""
        clean_q = query.strip()
        return await self._execute_request(f"/stations/search?q={clean_q}", ttl_seconds=86400)

    async def search_trains(self, query: str) -> Dict[str, Any]:
        """Search trains via RailCore IRCTC API (cached 24 hrs)."""
        clean_q = query.strip()
        return await self._execute_request(f"/trains/search?q={clean_q}", ttl_seconds=86400)

railcore_service = RailCoreService()
