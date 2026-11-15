import os
import httpx
from dotenv import load_dotenv

load_dotenv(".env.local")
url = os.environ.get("VITE_SUPABASE_URL")
service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json"
}

# Test creating user via admin API with email_confirm: True
email = "test.verified.user@gmail.com"
body = {
    "email": email,
    "password": "Password@123",
    "email_confirm": True,
    "user_metadata": {
        "full_name": "Verified User",
        "role": "passenger"
    }
}

res = httpx.post(f"{url}/auth/v1/admin/users", headers=headers, json=body)
print(f"Admin Create User '{email}': Status={res.status_code}, Body={res.text}")

if res.status_code in (200, 201):
    created_id = res.json().get("id")
    print(f"Created user id: {created_id}")
    # clean up test user
    del_res = httpx.delete(f"{url}/auth/v1/admin/users/{created_id}", headers=headers)
    print(f"Cleaned up test user: Status={del_res.status_code}")
