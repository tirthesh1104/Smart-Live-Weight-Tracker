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

body = {
    "email": "abc123@gmail.com",
    "password": "Password@123",
    "email_confirm": True,
    "user_metadata": {
        "full_name": "abc",
        "phone": "77895632636",
        "role": "passenger"
    }
}

print("Testing Supabase Admin API creation of 'abc123@gmail.com'...")
res = httpx.post(f"{url}/auth/v1/admin/users", headers=headers, json=body)
print(f"Status Code: {res.status_code}")
print(f"Response: {res.text}")

if res.status_code in (200, 201):
    user_id = res.json().get("id")
    print(f"User created successfully! ID: {user_id}")
    # Also test inserting into profiles table
    profile = {
        "id": user_id,
        "full_name": "abc",
        "email": "abc123@gmail.com",
        "role": "passenger",
        "phone": "77895632636"
    }
    p_res = httpx.post(f"{url}/rest/v1/profiles", headers=headers, json=profile)
    print(f"Profile creation: Status={p_res.status_code}, Body={p_res.text}")
    
    # Delete test user so clean slate
    del_res = httpx.delete(f"{url}/auth/v1/admin/users/{user_id}", headers=headers)
    print(f"Cleaned up test user: {del_res.status_code}")
