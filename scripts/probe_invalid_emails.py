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

emails_to_test = [
    "abc123@gmail.com ",     # with space
    " abc123@gmail.com",     # leading space
    "abc123gmail.com",       # no at
    "abc123@gmail..com",     # double dot
    "abc123@gmail",          # no tld
]

for em in emails_to_test:
    res = httpx.post(url, headers=headers, json={"email": em, "password": "Pass@123"})
    print(f"Testing '{em}' -> Status: {res.status_code}, Body: {res.text}")
