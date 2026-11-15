"""
Smart Live Weight Tracker - Official Qrail Developer API Service
=============================================================================
Provides secure server-side integration with Qrail Indian Railways REST API.
API Base URL: https://www.qrail.in/api/v3

Key Security & Integrity Rules:
1. QRAIL_API_KEY is read strictly from server-side environment (.env.local / os.environ).
2. The raw key is never exposed in responses, client bundles, or error messages.
3. In-memory caching respects the free tier quota (100 req/day).
4. Free tier restrictions are explicitly surfaced (Running Status is a Pro plan feature).
5. All records are explicitly labeled with source_name = 'Qrail'.
"""

import os
import time
import logging
from typing import Dict, Any, Optional
from pathlib import Path
import httpx
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("qrail_service")

# Load environment variables from .env.local
ROOT_DIR = Path(__file__).resolve().parent.parent
dotenv_path = ROOT_DIR / ".env.local"
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

BASE_URL = "https://qrail.in/api/v3"

# In-memory TTL Cache to preserve quota (100 req/day)
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
    """Safely mask key for logs and status, e.g. tLp...lWH"""
    if not key or len(key) < 8:
        return "NOT_CONFIGURED"
    return f"{key[:6]}...{key[-4:]}"

class QrailService:
    def __init__(self):
        self.api_key = os.getenv("QRAIL_API_KEY", "").strip()
        self.base_url = BASE_URL
        self.last_rate_limit: Dict[str, Any] = {}

    def is_configured(self) -> bool:
        if dotenv_path.exists():
            load_dotenv(dotenv_path=dotenv_path, override=True)
        self.api_key = os.getenv("QRAIL_API_KEY", "").strip()
        return bool(self.api_key and len(self.api_key) >= 8)

    async def _execute_request(self, endpoint_template: str, ttl_seconds: int = 300) -> Dict[str, Any]:
        """
        Executes request to Qrail API.
        Endpoint template contains placeholder {KEY} which is replaced on the server side.
        """
        cache_key = f"qrail:{endpoint_template}"
        cached = cache.get(cache_key)
        if cached is not None:
            return {
                "success": True,
                "source_name": "Qrail",
                "source_type": "THIRD_PARTY_SCHEDULED",
                "retrieved_at": cached.get("retrieved_at"),
                "cached": True,
                "data": cached.get("data")
            }

        if not self.is_configured():
            return {
                "success": False,
                "error": {
                    "code": "QRAIL_NOT_CONFIGURED",
                    "message": "Qrail API key is not configured on the server. Set QRAIL_API_KEY in .env.local."
                },
                "source_name": "Qrail",
                "status_code": 503
            }

        # Substitute server-side key safely into endpoint
        endpoint = endpoint_template.replace("{KEY}", self.api_key)
        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        headers = {
            "User-Agent": "SmartLiveWeightTracker/2.0 (Railway Safety Prototype)",
            "Accept": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                res = await client.get(url, headers=headers)
                
                # Capture rate limit headers
                self.last_rate_limit = {
                    "limit": res.headers.get("x-ratelimit-limit"),
                    "remaining": res.headers.get("x-ratelimit-remaining")
                }

                if res.status_code == 200:
                    # Qrail sometimes returns 0-byte body when plan restricts endpoint (e.g. running status on Free tier)
                    if not res.text or not res.text.strip():
                        return {
                            "success": False,
                            "error": {
                                "code": "PLAN_RESTRICTION",
                                "message": "Qrail returned an empty response. Running Status requires Qrail Pro plan (₹1,999/yr); Free accounts (100 req/day) include Schedule and Trains Between Stations only."
                            },
                            "status_code": 403,
                            "source_name": "Qrail",
                            "upstream_status": res.status_code
                        }

                    try:
                        json_data = res.json()
                    except Exception:
                        return {
                            "success": False,
                            "error": {
                                "code": "PLAN_RESTRICTION",
                                "message": "Qrail endpoint response empty or non-JSON under current plan tier (Free plan excludes Live Running Status)."
                            },
                            "status_code": 403,
                            "source_name": "Qrail",
                            "upstream_status": res.status_code
                        }

                    # Check Qrail custom error envelopes
                    if isinstance(json_data, dict) and json_data.get("success") is False:
                        err_msg = json_data.get("Error") or json_data.get("message") or "Qrail request failed"
                        is_unauth = "unauthorized" in str(err_msg).lower()
                        return {
                            "success": False,
                            "error": {
                                "code": "UNAUTHORIZED_REQUEST" if is_unauth else "PROVIDER_ERROR",
                                "message": f"Qrail Authentication Failed: {err_msg}. The configured API key was rejected by Qrail. Please verify and regenerate your API key in Qrail (My Account > API)." if is_unauth else f"Qrail: {err_msg}",
                                "upstream_status": res.status_code,
                                "raw_error": err_msg
                            },
                            "status_code": 401 if is_unauth else 400,
                            "source_name": "Qrail",
                            "upstream_status": res.status_code
                        }

                    retrieved_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                    cache.set(cache_key, {
                        "data": json_data,
                        "retrieved_at": retrieved_at
                    }, ttl_seconds=ttl_seconds)

                    return {
                        "success": True,
                        "source_name": "Qrail",
                        "source_type": "THIRD_PARTY_SCHEDULED",
                        "retrieved_at": retrieved_at,
                        "cached": False,
                        "rate_limits": self.last_rate_limit,
                        "data": json_data
                    }
                elif res.status_code == 404:
                    return {
                        "success": False,
                        "error": {
                            "code": "NOT_FOUND",
                            "message": "Qrail endpoint or requested train not found."
                        },
                        "status_code": 404,
                        "source_name": "Qrail"
                    }
                elif res.status_code == 429:
                    return {
                        "success": False,
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": "Qrail free plan daily rate limit (100 req/day) exceeded."
                        },
                        "status_code": 429,
                        "source_name": "Qrail"
                    }
                else:
                    return {
                        "success": False,
                        "error": {
                            "code": f"HTTP_{res.status_code}",
                            "message": f"Qrail provider returned status HTTP {res.status_code}"
                        },
                        "status_code": res.status_code,
                        "source_name": "Qrail"
                    }
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": {
                    "code": "TIMEOUT",
                    "message": "Qrail API connection timed out."
                },
                "status_code": 504,
                "source_name": "Qrail"
            }
        except Exception as e:
            logger.error(f"Qrail request error: {str(e)}")
            return {
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": f"Failed to communicate with Qrail: {str(e)}"
                },
                "status_code": 500,
                "source_name": "Qrail"
            }

    async def get_status(self) -> Dict[str, Any]:
        """Returns health and authentication status of Qrail without exposing raw key."""
        configured = self.is_configured()
        return {
            "service": "Qrail Integration Service",
            "provider_base_url": self.base_url,
            "documentation": "https://www.qrail.in/developers",
            "configured": configured,
            "masked_key": mask_key(self.api_key),
            "plan_tier": "Free Tier (100 req/day)" if configured else "UNCONFIGURED",
            "free_plan_limits": "100 req/day (Free tier includes Schedule & Trains Between; Live Running Status requires Pro plan at ₹1,999/yr)",
            "last_rate_limit": self.last_rate_limit,
            "provenance_status": "AUTHORIZED_LIVE" if configured else "ACCESS_NOT_AUTHORIZED"
        }

    async def get_train_schedule(self, train_number: str) -> Dict[str, Any]:
        """Fetch train schedule from Qrail (Free plan endpoint: /trains/schedule/{train}/{key})."""
        clean_num = train_number.strip()
        return await self._execute_request(f"trains/schedule/{clean_num}/{{KEY}}", ttl_seconds=86400)

    async def get_trains_between_stations(self, from_st: str, to_st: str) -> Dict[str, Any]:
        """Fetch trains between stations from Qrail (Free plan endpoint: /trains/between/{from}/{to}/{key})."""
        c_from = from_st.strip().upper()
        c_to = to_st.strip().upper()
        return await self._execute_request(f"trains/between/{c_from}/{c_to}/{{KEY}}", ttl_seconds=3600)

    async def get_live_running_status(self, train_number: str, day: str = "today") -> Dict[str, Any]:
        """
        Fetch running status from Qrail (/trains/running/{train}/{day}/{key}).
        Note: Requires Qrail Pro plan (₹1,999/yr). Free accounts will receive a plan restriction notice.
        """
        clean_num = train_number.strip()
        return await self._execute_request(f"trains/running/{clean_num}/{day}/{{KEY}}", ttl_seconds=60)

qrail_service = QrailService()
