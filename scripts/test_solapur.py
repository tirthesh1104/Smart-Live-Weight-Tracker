import os
import json
import httpx
from pathlib import Path
from dotenv import load_dotenv

load_dotenv('.env.local')
rc_key = os.getenv('RAILCORE_API_KEY', '').strip()
rr_key = os.getenv('RAILRADAR_API_KEY', '').strip()

headers_rc = {"Authorization": f"Bearer {rc_key}"}

print("--- Testing Solapur (SUR) on RailCore ---")
with httpx.Client(timeout=15.0) as client:
    r_st = client.get("https://ir.railcore.tech/v1/stations/search?q=Solapur", headers=headers_rc)
    print("Solapur search status:", r_st.status_code)
    if r_st.status_code == 200:
        print("Solapur station data:", json.dumps(r_st.json().get('data', {}).get('results', [])[:2], indent=2))

    r_tr = client.get("https://ir.railcore.tech/v1/trains/search?q=Solapur", headers=headers_rc)
    print("Solapur trains search status:", r_tr.status_code)
    if r_tr.status_code == 200:
        print("Solapur trains:", json.dumps(r_tr.json().get('data', {}).get('results', [])[:3], indent=2))
