import os
import json
import httpx
from pathlib import Path
from dotenv import load_dotenv

dotenv_path = Path('.env.local')
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)

rr_key = os.getenv('RAILRADAR_API_KEY', '').strip()
rc_key = os.getenv('RAILCORE_API_KEY', '').strip()
qr_key = os.getenv('QRAIL_API_KEY', '').strip()

print(f"RailRadar Key Configured: {bool(rr_key)} (Len: {len(rr_key)})")
print(f"RailCore Key Configured: {bool(rc_key)} (Len: {len(rc_key)})")
print(f"Qrail Key Configured: {bool(qr_key)} (Len: {len(qr_key)})")

headers_rr = {"Authorization": f"Bearer {rr_key}", "User-Agent": "SmartLiveWeightTracker/2.0"}
headers_rc = {"Authorization": f"Bearer {rc_key}"}

results = {}

# 1. Test NED Station on RailCore
print("\n--- 1. Testing RailCore Station Search for NED / Nanded ---")
try:
    with httpx.Client(timeout=15.0) as client:
        # Search NED
        r = client.get("https://ir.railcore.tech/v1/stations/search?q=NED", headers=headers_rc)
        print(f"RailCore search NED HTTP Status: {r.status_code}")
        if r.status_code == 200:
            ned_data = r.json()
            results['rc_search_ned'] = ned_data
            print("RailCore NED search results:")
            print(json.dumps(ned_data, indent=2))
        else:
            print(f"RailCore search NED failed: {r.text[:200]}")

        # Search Nanded
        r2 = client.get("https://ir.railcore.tech/v1/stations/search?q=Nanded", headers=headers_rc)
        print(f"RailCore search Nanded HTTP Status: {r2.status_code}")
        if r2.status_code == 200:
            nanded_data = r2.json()
            results['rc_search_nanded'] = nanded_data
            print("RailCore Nanded search results:")
            print(json.dumps(nanded_data, indent=2))

        # Check Station Details endpoint for NED
        r3 = client.get("https://ir.railcore.tech/v1/stations/NED", headers=headers_rc)
        print(f"RailCore GET /stations/NED HTTP Status: {r3.status_code}")
        if r3.status_code == 200:
            print("Station /stations/NED exists!")
            print(json.dumps(r3.json(), indent=2))
            results['rc_station_ned'] = r3.json()
        else:
            print(f"/stations/NED response: {r3.text[:200]}")
except Exception as e:
    print(f"RailCore station test exception: {e}")

# 2. Test RailRadar Bulk Stations for NED and Solapur (SUR)
print("\n--- 2. Testing RailRadar Bulk Stations for NED & SUR ---")
try:
    with httpx.Client(timeout=15.0) as client:
        r = client.get("https://api.railradar.in/v1/lookup/stations", headers=headers_rr)
        print(f"RailRadar /lookup/stations HTTP Status: {r.status_code}")
        if r.status_code == 200:
            st_data = r.json().get('data', {})
            print(f"Total RailRadar Stations: {len(st_data)}")
            print(f"NED in RailRadar: {st_data.get('NED')}")
            print(f"SUR in RailRadar: {st_data.get('SUR')}")
            print(f"CSMT in RailRadar: {st_data.get('CSMT')}")
            print(f"PUNE in RailRadar: {st_data.get('PUNE')}")
            print(f"NGP in RailRadar: {st_data.get('NGP')}")
            print(f"NK in RailRadar: {st_data.get('NK')}")
            print(f"AWB in RailRadar: {st_data.get('AWB')}")
            results['rr_stations_count'] = len(st_data)
            results['rr_ned'] = st_data.get('NED')
            results['rr_sur'] = st_data.get('SUR')
except Exception as e:
    print(f"RailRadar stations test exception: {e}")

# 3. Test Trains serving NED
print("\n--- 3. Testing Trains Serving NED ---")
try:
    with httpx.Client(timeout=15.0) as client:
        # Search trains for NED in RailCore
        r_tr = client.get("https://ir.railcore.tech/v1/trains/search?q=NED", headers=headers_rc)
        print(f"RailCore train search NED HTTP Status: {r_tr.status_code}")
        if r_tr.status_code == 200:
            tr_data = r_tr.json()
            print("RailCore Trains matching NED:")
            print(json.dumps(tr_data, indent=2))
            results['rc_trains_ned'] = tr_data

        # Also search Nanded in RailCore trains
        r_tr2 = client.get("https://ir.railcore.tech/v1/trains/search?q=Nanded", headers=headers_rc)
        print(f"RailCore train search Nanded HTTP Status: {r_tr2.status_code}")
        if r_tr2.status_code == 200:
            tr2_data = r_tr2.json()
            print("RailCore Trains matching Nanded:")
            print(json.dumps(tr2_data, indent=2))
            results['rc_trains_nanded'] = tr2_data
except Exception as e:
    print(f"Trains search exception: {e}")

# Save raw output
with open('scripts/live_audit_results.json', 'w') as f:
    json.dump(results, f, indent=2)
print("\nResults saved to scripts/live_audit_results.json")
