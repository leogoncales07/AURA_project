import urllib.request
import json
import traceback

key = 'AIzaSyDSqxmIuIUev5y-qJSM5Vxth4jt5Yt2ENk'
results = {}

def test_api():
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": "hello"}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 300}
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as f:
            results["payload_test"] = {"status": f.status, "body": f.read().decode('utf-8')}
    except urllib.error.HTTPError as e:
        results["payload_test"] = {"status": e.code, "body": e.read().decode('utf-8')}
    except Exception as e:
        results["payload_test"] = {"error": str(e), "trace": traceback.format_exc()}

test_api()

with open('result_full.json', 'w') as f:
    json.dump(results, f, indent=2)
