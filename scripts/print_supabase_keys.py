import os
from dotenv import load_dotenv

load_dotenv(".env.local")
for k in os.environ:
    if "SUPABASE" in k or "AUTH" in k:
        val = os.environ[k]
        print(f"{k}: {val[:12]}... (len {len(val)})")
