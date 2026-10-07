import urllib.request
import json

url = "http://127.0.0.1:8000/api/v1/auth/password-reset/request"
data = json.dumps({"email": "manhhhbg2006@gmail.com"}).encode("utf-8")

req = urllib.request.Request(
    url, 
    data=data, 
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(req) as response:
        print("Status Code:", response.status)
        body = json.loads(response.read().decode("utf-8"))
        print("Success Message:", body.get("message"))
except urllib.error.HTTPError as e:
    print("HTTPError Code:", e.code)
    err_body = json.loads(e.read().decode("utf-8"))
    print("HTTPError Detail:", err_body.get("detail"))
except Exception as e:
    print("Error:", e)
