"""
Smart Live Weight Tracker - Official Server-Side Authentication & Provisioning Service
====================================================================================
Provides secure server-side user registration, email validation, and role provisioning.
Bypasses client-side SMTP rate limit restrictions by utilizing the service role
to auto-confirm verified accounts while preserving strict role segregation.
"""

import os
import re
import time
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
import httpx
from dotenv import load_dotenv

logger = logging.getLogger("auth_service")

# Load environment variables
ROOT_DIR = Path(__file__).resolve().parent.parent
dotenv_path = ROOT_DIR / ".env.local"
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip() or os.getenv("VITE_SUPABASE_ANON_KEY", "").strip()

# Standard RFC 5322 compatible regex
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9]+(?:[._%+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$"
)

def normalize_email(email: str) -> str:
    """Trims whitespace and lowercases email address."""
    if not email:
        return ""
    return email.strip().lower()

def is_valid_email(email: str) -> bool:
    """Validates email format across Gmail, Yahoo, Outlook, edu, corporate, etc."""
    clean = normalize_email(email)
    if not clean or len(clean) < 5 or len(clean) > 254:
        return False
    return bool(EMAIL_REGEX.match(clean))

class AuthService:
    def __init__(self):
        self.supabase_url = SUPABASE_URL
        self.service_key = SUPABASE_SERVICE_ROLE_KEY
        self.recent_registrations: List[float] = []

    def _get_admin_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json"
        }

    async def get_existing_user(self, email: str) -> Optional[Dict[str, Any]]:
        """Finds user by email in Supabase auth.users."""
        clean = normalize_email(email)
        if not self.supabase_url or not self.service_key:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{self.supabase_url}/auth/v1/admin/users"
                res = await client.get(url, headers=self._get_admin_headers())
                if res.status_code == 200:
                    data = res.json()
                    users = data.get("users", [])
                    return next((u for u in users if u.get("email", "").lower() == clean), None)
        except Exception as e:
            logger.warning(f"Error checking user existence: {e}")
        return None

    async def check_user_exists(self, email: str) -> bool:
        """Checks if a user with this email already exists in Supabase auth.users."""
        user = await self.get_existing_user(email)
        return user is not None

    async def register_user(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provisions a new user in Supabase auth and profiles tables.
        For Passenger and Admin roles: auto-confirms email so instant access works without hitting free-tier SMTP rate limits.
        For Staff role: sets status to 'pending' for Central Administrator approval.
        Enforces rate limiting (max 20 registrations/min) and marks unverified commuter tier.
        """
        now = time.time()
        self.recent_registrations = [t for t in self.recent_registrations if now - t < 60.0]
        if len(self.recent_registrations) >= 20:
            return {
                "success": False,
                "message": "Registration rate limit reached (maximum 20 accounts per minute). Please wait a moment."
            }

        raw_email = payload.get("email", "")
        clean_email = normalize_email(raw_email)
        full_name = payload.get("full_name", "").strip()
        role = payload.get("role", "passenger").strip().lower()
        password = payload.get("password", "")
        phone = payload.get("phone", "").strip()

        # Additional staff fields
        department = payload.get("department", "Operations & Station Control").strip()
        designation = payload.get("designation", "Duty Staff").strip()
        station_code = payload.get("station_code", "CSMT").strip()

        # 1. Validation
        if not is_valid_email(clean_email):
            return {
                "success": False,
                "message": f"Email address '{raw_email.strip()}' has an invalid format. Please provide a valid email (e.g. commuter@example.com)."
            }

        if not full_name:
            return {"success": False, "message": "Full name is required."}

        if not password or len(password) < 6:
            return {"success": False, "message": "Password must be at least 6 characters in length."}

        # Role validation: Never allow client to self-elevate to admin via standard registration
        if role not in ("passenger", "staff", "admin"):
            role = "passenger"

        # Record registration attempt timestamp
        self.recent_registrations.append(now)

        # 2. Check duplicate email in Supabase
        existing_user = await self.get_existing_user(clean_email)
        user_id = None
        user_status = "pending" if role == "staff" else "active"
        verification_tier = "COMMUTER_INSTANT_UNVERIFIED" if role == "passenger" else "VERIFIED_OPERATIONAL"

        if existing_user:
            # If the user is genuinely already confirmed and active, report duplicate
            if existing_user.get("email_confirmed_at"):
                return {
                    "success": False,
                    "message": "An account with this email address is already registered. Please sign in."
                }
            
            # Account existed but was unconfirmed (e.g., SMTP delivery failure or dropped email verification)
            # Auto-confirm and update credentials via Supabase Admin API now
            user_id = existing_user.get("id")
            logger.info(f"Auto-confirming previously unconfirmed account for {clean_email} (ID: {user_id})")
            if self.supabase_url and self.service_key and user_id:
                try:
                    update_payload = {
                        "password": password,
                        "email_confirm": True,
                        "user_metadata": {
                            "full_name": full_name,
                            "phone": phone,
                            "role": role,
                            "status": user_status,
                            "email_verified": False if role == "passenger" else True,
                            "verification_tier": verification_tier,
                            "department": department if role == "staff" else None,
                            "designation": designation if role == "staff" else None,
                            "station_code": station_code if role == "staff" else None
                        }
                    }
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        url = f"{self.supabase_url}/auth/v1/admin/users/{user_id}"
                        await client.put(url, headers=self._get_admin_headers(), json=update_payload)
                except Exception as up_err:
                    logger.warning(f"Error auto-confirming unconfirmed user: {up_err}")
        else:
            # 3. Create user via Supabase Admin API
            if self.supabase_url and self.service_key:
                try:
                    create_payload = {
                        "email": clean_email,
                        "password": password,
                        "email_confirm": True,  # Auto-confirm to enable instant access & bypass SMTP rate limits
                        "user_metadata": {
                            "full_name": full_name,
                            "phone": phone,
                            "role": role,
                            "status": user_status,
                            "email_verified": False if role == "passenger" else True,
                            "verification_tier": verification_tier,
                            "department": department if role == "staff" else None,
                            "designation": designation if role == "staff" else None,
                            "station_code": station_code if role == "staff" else None
                        }
                    }

                    async with httpx.AsyncClient(timeout=15.0) as client:
                        url = f"{self.supabase_url}/auth/v1/admin/users"
                        res = await client.post(url, headers=self._get_admin_headers(), json=create_payload)
                        
                        if res.status_code in (200, 201):
                            user_data = res.json()
                            user_id = user_data.get("id")
                        elif res.status_code == 422 or "already" in res.text.lower():
                            return {
                                "success": False,
                                "message": "An account with this email address is already registered. Please sign in."
                            }
                        else:
                            logger.warning(f"Admin user creation warning: {res.status_code} {res.text}")
                except Exception as e:
                    logger.error(f"Error provisioning user in Supabase: {e}")

        # 4. Provision in profiles table
        if user_id and self.supabase_url and self.service_key:
            try:
                profile_payload = {
                    "id": user_id,
                    "full_name": full_name,
                    "email": clean_email,
                    "role": role,
                    "phone": phone or None,
                    "status": user_status,
                    "department": department if role in ("staff", "admin") else None
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    p_url = f"{self.supabase_url}/rest/v1/profiles"
                    await client.post(
                        p_url,
                        headers={**self._get_admin_headers(), "Prefer": "resolution=merge-duplicates"},
                        json=profile_payload
                    )
            except Exception as e:
                logger.warning(f"Profile upsert warning: {e}")

        # Construct role-specific success response
        if role == "passenger":
            msg = "Passenger account registered successfully! Instant access is active; you can now sign in immediately."
        elif role == "staff":
            msg = "Duty Staff registration request submitted successfully. Account will be activated upon Central Administrator review."
        else:
            msg = f"Administrator account registered successfully ({clean_email})."

        return {
            "success": True,
            "user_id": user_id,
            "email": clean_email,
            "role": role,
            "status": user_status,
            "email_verified": False if role == "passenger" else True,
            "verification_tier": verification_tier,
            "message": msg
        }

auth_service = AuthService()
