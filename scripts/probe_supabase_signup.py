import os
import httpx
from pathlib import Path
from dotenv import load_dotenv

dotenv_path = Path(".env.local")
load_dotenv(dotenv_path=dotenv_path)

supabase_url = os.getenv("VITE_SUPABASE_URL", "")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY", "") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY", "")

url = f"{supabase_url}/auth/v1/signup"
headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json"
}

body = {
    "email": "abc123@gmail.com",
    "password": "Pass@123",
    "data": {
        "full_name": "abc",
        "phone": "77895632636"
    }
}

print(f"POST {url}")
res = httpx.post(url, headers=headers, json=body)
print(f"Status Code: {res.status_code}")
print(f"Response Headers: {dict(res.headers)}")
print(f"Response Body: {res.text}")
