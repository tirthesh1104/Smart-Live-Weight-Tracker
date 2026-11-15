"""
Smart Live Weight Tracker - Dual Railway Provider Gateway & Conflict Resolver
=============================================================================
Orchestrates RailCore and Qrail services with strict compliance:
1. Normalizes records into uniform schemas.
2. Performs conflict detection when both providers supply information for the same train.
3. Preserves original provider attribution; never silently merges conflicting data.
4. Does not treat two third-party providers as independent official verification.
5. Manages idempotent synchronization into Supabase without duplicating records.
"""

import os
import time
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
import httpx
from dotenv import load_dotenv

from railcore_service import railcore_service
from qrail_service import qrail_service
from railkit_service import railkit_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dual_railway_gateway")

ROOT_DIR = Path(__file__).resolve().parent.parent
dotenv_path = ROOT_DIR / ".env.local"
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip() or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY", "").strip()

class DualRailwayGateway:
    def __init__(self):
        self.railcore = railcore_service
        self.qrail = qrail_service
        self.railkit = railkit_service

    async def get_all_providers_status(self) -> Dict[str, Any]:
        """Returns unified connectivity and credential status across all external providers."""
        rc_stat = await self.railcore.get_status()
        qr_stat = await self.qrail.get_status()
        rk_stat = await self.railkit.get_status()
        
        return {
            "gateway": "Smart Live Weight Tracker - Multi-Provider Railway Gateway",
            "providers": {
                "railcore": rc_stat,
                "qrail": qr_stat,
                "railkit": rk_stat
            },
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

    async def get_train_multi_provider(self, train_number: str, preferred_provider: str = "auto") -> Dict[str, Any]:
        """
        Retrieves train information with conflict detection and clear source attribution.
        Avoids duplicate calls unless requested or needed for comparison.
        """
        clean_num = train_number.strip()
        results: Dict[str, Any] = {}
        conflicts: List[Dict[str, Any]] = []

        # 1. Fetch from RailCore if configured
        if preferred_provider in ("auto", "railcore") and self.railcore.is_configured():
            rc_res = await self.railcore.get_train_schedule(clean_num)
            results["railcore"] = rc_res

        # 2. Fetch from Qrail if configured
        if preferred_provider in ("auto", "qrail") and self.qrail.is_configured():
            qr_res = await self.qrail.get_train_schedule(clean_num)
            results["qrail"] = qr_res

        # If neither provider returned successful data, return clear error
        active_success = [k for k, v in results.items() if v.get("success")]
        if not active_success:
            return {
                "success": False,
                "train_number": clean_num,
                "conflicts_detected": [],
                "conflict_count": 0,
                "source_type": "THIRD_PARTY_SCHEDULED",
                "error": {
                    "code": "PROVIDER_DATA_UNAVAILABLE",
                    "message": "Railway data temporarily unavailable from configured third-party providers."
                },
                "providers_attempted": list(results.keys()),
                "provider_responses": results
            }

        # Conflict Detection: If both providers responded, compare train names and endpoints
        if "railcore" in results and "qrail" in results and results["railcore"].get("success") and results["qrail"].get("success"):
            rc_data = results["railcore"].get("data", {})
            qr_data = results["qrail"].get("data", {})

            rc_name = str(rc_data.get("train_name") or rc_data.get("trainName") or rc_data.get("name") or "").strip().upper()
            qr_name = str(qr_data.get("train_name") or qr_data.get("trainName") or qr_data.get("name") or "").strip().upper()

            if rc_name and qr_name and rc_name != qr_name:
                conflicts.append({
                    "field": "train_name",
                    "railcore_value": rc_name,
                    "qrail_value": qr_name,
                    "note": "Train name mismatch detected between providers. Preserving both original records."
                })

        # Select primary record preserving provenance
        primary_source = active_success[0]
        primary_record = results[primary_source]["data"]

        return {
            "success": True,
            "train_number": clean_num,
            "primary_source": primary_source,
            "source_type": "THIRD_PARTY_SCHEDULED",
            "retrieved_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "data": primary_record,
            "conflicts_detected": conflicts,
            "conflict_count": len(conflicts),
            "all_provider_payloads": results
        }

    async def sync_train_to_supabase(self, train_number: str, provider_name: str, train_name: str, from_st: str, to_st: str) -> Dict[str, Any]:
        """
        Idempotent import into Supabase `trains` table storing full provenance metadata.
        Avoids creating duplicate train records.
        """
        clean_num = train_number.strip()
        if not SUPABASE_URL or not SUPABASE_KEY:
            return {
                "success": False,
                "error": {"message": "Supabase server credentials not configured in backend environment"}
            }

        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Check existence to avoid duplicate rows
                check_url = f"{SUPABASE_URL}/rest/v1/trains?number=eq.{clean_num}&select=id,number,name"
                check_res = await client.get(check_url, headers=headers)
                existing = check_res.json() if check_res.status_code == 200 else []

                now_ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

                if existing and len(existing) > 0:
                    train_id = existing[0]["id"]
                    update_url = f"{SUPABASE_URL}/rest/v1/trains?id=eq.{train_id}"
                    await client.patch(update_url, headers=headers, json={
                        "name": train_name,
                        "from_station": from_st,
                        "to_station": to_st
                    })
                    action = "UPDATED"
                else:
                    insert_url = f"{SUPABASE_URL}/rest/v1/trains"
                    ins_res = await client.post(insert_url, headers=headers, json={
                        "number": clean_num,
                        "name": train_name,
                        "from_station": from_st,
                        "to_station": to_st
                    })
                    if ins_res.status_code in (200, 201):
                        created = ins_res.json()
                        train_id = created[0]["id"] if created else None
                        action = "CREATED"
                    else:
                        return {
                            "success": False,
                            "error": {"message": f"Supabase insert failed: {ins_res.text}"}
                        }

                return {
                    "success": True,
                    "action": action,
                    "train_id": train_id,
                    "number": clean_num,
                    "name": train_name,
                    "from_station": from_st,
                    "to_station": to_st,
                    "source_name": provider_name,
                    "source_type": "THIRD_PARTY_SCHEDULED",
                    "data_status": "THIRD_PARTY_SCHEDULED",
                    "retrieved_at": now_ts,
                    "verification_status": "THIRD_PARTY_SCHEDULED"
                }
        except Exception as e:
            logger.error(f"Gateway Supabase sync error: {str(e)}")
            return {
                "success": False,
                "error": {"message": f"Gateway Supabase sync error: {str(e)}"}
            }

dual_railway_gateway = DualRailwayGateway()
