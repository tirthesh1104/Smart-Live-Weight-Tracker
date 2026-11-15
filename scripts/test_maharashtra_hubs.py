import os
import json
import httpx
from pathlib import Path
from dotenv import load_dotenv

load_dotenv('.env.local')
rc_key = os.getenv('RAILCORE_API_KEY', '').strip()
headers_rc = {"Authorization": f"Bearer {rc_key}"}

hubs = ["Chhatrapati Sambhajinagar", "Aurangabad", "Nashik", "Nagpur", "Pune", "Mumbai"]

with httpx.Client(timeout=15.0) as client:
    for hub in hubs:
        r = client.get(f"https://ir.railcore.tech/v1/stations/search?q={hub}", headers=headers_rc)
        if r.status_code == 200:
            res = r.json().get('data', {}).get('results', [])
            sample = res[0] if res else None
            if sample:
                print(f"Hub '{hub}' -> Code: {sample.get('station_code')}, Name: {sample.get('station_name')}, City: {sample.get('city')}, State: {sample.get('state')}")
            else:
                print(f"Hub '{hub}' -> No stations found")
        else:
            print(f"Hub '{hub}' error: {r.status_code}")
