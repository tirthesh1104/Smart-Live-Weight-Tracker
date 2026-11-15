import os
import httpx
from dotenv import load_dotenv

load_dotenv(".env.local")
url = os.environ.get("VITE_SUPABASE_URL")
service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}"
}

res = httpx.get(f"{url}/auth/v1/admin/users", headers=headers)
print(f"Status: {res.status_code}")
data = res.json()
users = data.get("users", [])
print(f"Total Users: {len(users)}")
for u in users:
    print(f"- Email: {u.get('email')}, Role: {u.get('user_metadata', {}).get('role')}, Confirmed: {bool(u.get('email_confirmed_at'))}")
