import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

url = "https://railradar.in/docs/ntes-trains-lookup"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
    html = r.read().decode('utf-8', errors='ignore')

# Extract text content from html
clean_text = re.sub(r'<[^>]+>', ' ', html)
clean_text = re.sub(r'\s+', ' ', clean_text)
print("RailRadar Docs Length:", len(clean_text))
print("Snippets from RailRadar docs:")
# print matches around keywords
for kw in ['api', 'endpoint', 'key', 'token', 'auth', 'ntes', 'train', 'lookup', 'rate', 'price', 'free', 'terms']:
    for m in re.finditer(rf'.{{0,100}}{kw}.{{0,100}}', clean_text, re.IGNORECASE):
        print(f"[{kw}]: {m.group(0).strip()}")
        break
