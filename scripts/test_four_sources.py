import urllib.request
import ssl
import json
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def test_url(name, url):
    print(f"\n--- Testing {name}: {url} ---")
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            print(f"Status: {r.status}")
            data = r.read(10000).decode('utf-8', errors='ignore')
            print(f"Content Length read: {len(data)}")
            # print first 300 chars
            print("Snippet:", data[:300].replace('\n', ' '))
            return True, data
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        return False, str(e)
    except Exception as e:
        print(f"Exception: {e}")
        return False, str(e)

# 1. CRIS
test_url("CRIS Main", "https://cris.org.in/")
test_url("CRIS Services", "https://cris.org.in/crisweb/design1/services.jsp")

# 2. ISRO RTIS Report / Site
test_url("ISRO Main", "https://www.isro.gov.in/")

# 3. RailRadar
test_url("RailRadar Main", "https://railradar.in/")
test_url("RailRadar Docs NTES Lookup", "https://railradar.in/docs/ntes-trains-lookup")
