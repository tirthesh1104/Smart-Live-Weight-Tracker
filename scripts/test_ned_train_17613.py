import os
import json
import httpx
from pathlib import Path
from dotenv import load_dotenv

load_dotenv('.env.local')
rc_key = os.getenv('RAILCORE_API_KEY', '').strip()
rr_key = os.getenv('RAILRADAR_API_KEY', '').strip()

headers_rc = {"Authorization": f"Bearer {rc_key}"}
headers_rr = {"Authorization": f"Bearer {rr_key}", "User-Agent": "SmartLiveWeightTracker/2.0"}

print("--- Testing Train 17613 (Panvel - Hazur Sahib Nanded Express) ---")
with httpx.Client(timeout=15.0) as client:
    # Schedule from RailCore
    r_sch = client.get("https://ir.railcore.tech/v1/trains/17613/schedule", headers=headers_rc)
    print(f"RailCore 17613 schedule status: {r_sch.status_code}")
    if r_sch.status_code == 200:
        sch_data = r_sch.json().get('data', {})
        print(f"Train Name: {sch_data.get('train_name')}")
        print(f"Source: {sch_data.get('source_station_code')} -> Dest: {sch_data.get('destination_station_code')}")
        stops = sch_data.get('stops', [])
        print(f"Total Stops: {len(stops)}")
        # Check if NED is the destination or in stops
        ned_stop = next((s for s in stops if s.get('station_code') == 'NED'), None)
        print("NED in stops:", ned_stop)
        print("First 3 stops:", stops[:3])
        print("Last stop:", stops[-1] if stops else None)

    # Coach position from RailCore
    r_cp = client.get("https://ir.railcore.tech/v1/trains/17613/coach-position", headers=headers_rc)
    print(f"RailCore 17613 coach-position status: {r_cp.status_code}")
    if r_cp.status_code == 200:
        cp_data = r_cp.json().get('data', {})
        print("Formation:", cp_data.get('formation'))
        print("Coaches count:", len(cp_data.get('coach_position', [])))
        if cp_data.get('coach_position'):
            print("Sample coaches:", cp_data.get('coach_position')[:4])

    # Live Status from RailRadar
    r_live = client.get("https://api.railradar.in/v1/trains/17613/live", headers=headers_rr)
    print(f"RailRadar 17613 live status: {r_live.status_code}")
    if r_live.status_code == 200:
        print("RailRadar Live Data:", json.dumps(r_live.json(), indent=2)[:300])
