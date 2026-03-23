import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request("https://omdtllopgzuczpmxtkvu.supabase.co/auth/v1/health")
try:
    with urllib.request.urlopen(req, context=ctx, timeout=5) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode())
except Exception as e:
    print("Error:", e)
