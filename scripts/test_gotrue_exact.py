import os
import httpx
from dotenv import load_dotenv

load_dotenv(".env.local")
url = os.environ.get("VITE_SUPABASE_URL")
anon_key = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

headers = {
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}",
    "Content-Type": "application/json"
}

body = {
    "email": "abc123@gmail.com",
    "password": "Password@123"
}

res = httpx.post(f"{url}/auth/v1/signup", headers=headers, json=body)
print(f"Status: {res.status_code}")
print(f"Body: {res.text}")
