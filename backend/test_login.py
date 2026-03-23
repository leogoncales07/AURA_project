import requests

url = "http://localhost:8000/auth/login"
headers = {
    "Content-Type": "application/json",
    "X-Owner-Secret": "rRA5utI-P45PjhV3HP1gYLmDCSbFL29l-uqunqqtArV8mohJk9Ov1R2QSGKYkZXN"
}
data = {
    "email": "demo@aura.com",
    "password": "demo123456"
}

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Login successful!")
        data = response.json()
        print(f"Access Token length: {len(data.get('access_token', ''))}")
        user = data.get('user', {})
        print(f"User: {user.get('email')} (ID: {user.get('id')})")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
