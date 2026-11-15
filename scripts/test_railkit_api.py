import os
import json
import httpx
from pathlib import Path
from dotenv import load_dotenv

load_dotenv('.env.local')
rk_key = os.getenv('RAILKIT_API_KEY', '').strip()
print(f"RailKit API Key present: {bool(rk_key)} (len: {len(rk_key)})")

base_urls = [
    "https://api.railkit.in",
    "https://railkit.in"
]

header_variants = [
    {"Authorization": f"Bearer {rk_key}"},
    {"x-api-key": rk_key},
    {"X-RailKit-Key": rk_key},
    {"api-key": rk_key}
]

endpoints = [
    "/api/v1/trains/12101/info",
    "/api/v1/stations/CSMT/live",
    "/api/v1/trains/12101/delays",
    "/api/v1/trains/between/CSMT/PUNE",
    "/health",
    "/"
]

with httpx.Client(timeout=10.0) as client:
    for base in base_urls:
        print(f"\n=== Testing Base URL: {base} ===")
        for ep in endpoints:
            for headers in header_variants:
                h_name = list(headers.keys())[0]
                url = f"{base}{ep}"
                try:
                    r = client.get(url, headers=headers)
                    print(f"[{h_name}] GET {ep} -> Status: {r.status_code}")
                    if r.status_code in (200, 201):
                        print("SUCCESS PAYLOAD:", r.text[:300])
                        break
                    elif r.status_code not in (404, 502, 503):
                        print(f"Response ({r.status_code}):", r.text[:200])
                except Exception as e:
                    print(f"Error connecting {url}: {e}")
                    break
