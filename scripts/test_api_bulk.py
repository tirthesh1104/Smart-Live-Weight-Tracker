import os
import time
from dotenv import load_dotenv
import httpx

load_dotenv('.env.local')
rr_key = os.getenv('RAILRADAR_API_KEY')
rc_key = os.getenv('RAILCORE_API_KEY')

headers_rr = {'Authorization': f'Bearer {rr_key}', 'User-Agent': 'SmartLiveWeightTracker/2.0'}
headers_rc = {'Authorization': f'Bearer {rc_key}'}

t0 = time.time()
r_trains = httpx.get('https://api.railradar.in/v1/lookup/trains/ntes', headers=headers_rr, timeout=12)
trains = r_trains.json().get('data', {}) if r_trains.status_code == 200 else {}
print(f'RailRadar NTES Trains: {len(trains)} retrieved in {time.time() - t0:.2f}s')

t1 = time.time()
r_stations = httpx.get('https://api.railradar.in/v1/lookup/stations', headers=headers_rr, timeout=12)
stations = r_stations.json().get('data', {}) if r_stations.status_code == 200 else {}
print(f'RailRadar Stations: {len(stations)} retrieved in {time.time() - t1:.2f}s')

# Test search query
q = 'mumbai'
matches = [{'code': k, 'name': v} for k, v in stations.items() if q in k.lower() or q in v.lower()]
print(f'Station search for \"{q}\": {len(matches)} matches (Sample: {matches[:3]})')

# Test RailCore station search for enrichment
r_rc_st = httpx.get('https://ir.railcore.tech/v1/stations/search?q=mumbai', headers=headers_rc, timeout=12)
if r_rc_st.status_code == 200:
    results = r_rc_st.json().get('data', {}).get('results', [])
    print(f'RailCore enriched stations for \"mumbai\": {len(results)}')
    if results:
        print('Sample RailCore station:', results[0])
