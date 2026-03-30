import urllib.request
import json
import traceback

key = 'AIzaSyDSqxmIuIUev5y-qJSM5Vxth4jt5Yt2ENk'
results = {}

def test_api(model, version):
    url = f"https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={key}"
    data = json.dumps({"contents": [{"parts": [{"text": "hi"}]}]}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as f:
            results[f"{model}_{version}"] = {"status": f.status, "body": f.read().decode('utf-8')}
    except urllib.error.HTTPError as e:
        results[f"{model}_{version}"] = {"status": e.code, "body": e.read().decode('utf-8')}
    except Exception as e:
        results[f"{model}_{version}"] = {"error": str(e), "trace": traceback.format_exc()}

test_api('gemini-2.0-flash', 'v1')
test_api('gemini-2.5-flash', 'v1')
test_api('gemini-1.5-flash', 'v1')

with open('result.json', 'w') as f:
    json.dump(results, f, indent=2)
