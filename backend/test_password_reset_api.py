import requests

url = "http://127.0.0.1:8000/api/v1/auth/password-reset/request"
payload = {"email": "admin@company.com"}

print("Sending POST request to:", url)
res = requests.post(url, json=payload)
print("Status Code:", res.status_code)
print("Response JSON:", res.json())
