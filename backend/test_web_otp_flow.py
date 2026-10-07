import requests

url = "http://127.0.0.1:8000/api/v1/auth/password-reset/request"
email = "manhhhbg2006@gmail.com"

print(f"1. Sending POST request to {url} with email: {email}")
res = requests.post(url, json={"email": email})
print("Status Code:", res.status_code)
print("Response Body:", res.text)
