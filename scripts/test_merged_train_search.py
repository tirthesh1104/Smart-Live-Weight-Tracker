import asyncio
import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(backend_dir))

from railcore_service import railcore_service
from railradar_service import railradar_service

async def test_search():
    q = "NED"
    catalog_res = await railradar_service.lookup_ntes_trains()
    catalog = catalog_res.get("data", {}) if catalog_res.get("success") else {}
    
    seen = set()
    matches = []
    
    # 1. RailCore search
    rc_res = await railcore_service.search_trains(q)
    if rc_res.get("success") and rc_res.get("data"):
        for it in rc_res["data"].get("results", []):
            num = it.get("train_number")
            if num and num not in seen:
                seen.add(num)
                matches.append({
                    "train_number": num,
                    "train_name": it.get("train_name"),
                    "source_station": it.get("source_station_code"),
                    "destination_station": it.get("destination_station_code"),
                    "source": "RailCore IRCTC API"
                })
                
    # 2. RailRadar catalog
    for k, v in catalog.items():
        if k not in seen and (k.startswith(q) or q in v):
            seen.add(k)
            matches.append({
                "train_number": k,
                "train_name": v,
                "source": "RailRadar NTES Official"
            })
            
    print(f"Total merged matches for '{q}': {len(matches)}")
    for m in matches[:10]:
        print(f"  {m['train_number']}: {m['train_name']} ({m.get('source_station', '')} -> {m.get('destination_station', '')}) [{m['source']}]")

asyncio.run(test_search())
