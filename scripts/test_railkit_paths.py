import os
import httpx
from dotenv import load_dotenv

load_dotenv('.env.local')
rk_key = os.getenv('RAILKIT_API_KEY', '').strip()
headers = {"Authorization": f"Bearer {rk_key}"}

test_urls = [
    "https://api.railkit.in/v1/trains/12101/info",
    "https://api.railkit.in/api/v1/trains/12101/info",
    "https://api.railkit.in/v1/trains/12101",
    "https://api.railkit.in/v1/pnr/1234567890",
    "https://api.railkit.in/api/v1/pnr/1234567890",
    "https://api.railkit.in/api/v1/stations/CSMT",
    "https://api.railkit.in/api/v1/user/me",
    "https://api.railkit.in/api/v1/auth/verify",
    "https://api.railkit.in/health"
]

with httpx.Client(timeout=8.0) as client:
    for url in test_urls:
        try:
            r = client.get(url, headers=headers)
            print(f"GET {url} -> {r.status_code}: {r.text[:150]}")
        except Exception as e:
            print(f"GET {url} failed: {e}")
