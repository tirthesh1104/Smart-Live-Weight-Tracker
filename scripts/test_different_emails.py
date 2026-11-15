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

emails = [
    "abc123@gmail.com",
    "john.doe@gmail.com",
    "railway.commuter@gmail.com",
    "commuter123@yahoo.com",
    "student@university.edu",
    "engineer@company.com",
    "testuser456@outlook.com",
    "passenger99@hotmail.com"
]

for em in emails:
    res = httpx.post(url, headers=headers, json={"email": em, "password": "Password@123", "data": {"full_name": "Test User"}})
    print(f"'{em}': status={res.status_code}, error_code={res.json().get('error_code')}, msg={res.json().get('msg')}")
