import http.client

try:
    conn = http.client.HTTPConnection("localhost", 8000)
    conn.request("GET", "/")
    response = conn.getresponse()
    print(f"Status: {response.status}")
    print(f"Content: {response.read().decode()}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
