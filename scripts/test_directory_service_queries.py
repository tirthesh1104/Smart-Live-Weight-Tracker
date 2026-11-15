import asyncio
import json
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(backend_dir))

from railway_directory_service import railway_directory_service

async def main():
    print("Testing railway_directory_service methods with live API calls...")
    
    # 1. Test NED station search
    res_ned = await railway_directory_service.search_stations(query="NED")
    print(f"\n1. Station query 'NED': {res_ned.get('total_matches')} matches")
    for s in res_ned.get('stations', [])[:3]:
        print(f"   Code: {s.get('code')}, Name: {s.get('name')}, City: {s.get('city')}, State: {s.get('state')}, Source: {s.get('source')}")

    # 2. Test Nanded city search
    res_nanded = await railway_directory_service.search_stations(city="Nanded")
    print(f"\n2. City 'Nanded': {res_nanded.get('total_matches')} matches")
    for s in res_nanded.get('stations', [])[:3]:
        print(f"   Code: {s.get('code')}, Name: {s.get('name')}, City: {s.get('city')}, State: {s.get('state')}, Source: {s.get('source')}")

    # 3. Test Solapur city search
    res_solapur = await railway_directory_service.search_stations(city="Solapur")
    print(f"\n3. City 'Solapur': {res_solapur.get('total_matches')} matches")
    for s in res_solapur.get('stations', [])[:3]:
        print(f"   Code: {s.get('code')}, Name: {s.get('name')}, City: {s.get('city')}, State: {s.get('state')}, Source: {s.get('source')}")

    # 4. Test Train 17613 (NED train) full details
    details_17613 = await railway_directory_service.get_full_train_details("17613")
    print(f"\n4. Train 17613 Full Details:")
    print(f"   Train Name: {details_17613.get('train_name')}")
    print(f"   Source: {details_17613.get('source_station')} -> Destination: {details_17613.get('destination_station')}")
    print(f"   Stops count: {details_17613.get('stops_count')}")
    print(f"   Coaches count: {len(details_17613.get('coaches', []))}")
    print(f"   Rake Formation: {details_17613.get('rake_formation')}")
    print(f"   Provenance: {json.dumps(details_17613.get('provenance'))}")

    # 5. Test Train Search for Nanded
    tr_search = await railway_directory_service.search_trains(query="Nanded", limit=5)
    print(f"\n5. Train Search 'Nanded': {tr_search.get('total_matches')} matches")
    for t in tr_search.get('trains', []):
        print(f"   {t.get('train_number')} - {t.get('train_name')}")

asyncio.run(main())
