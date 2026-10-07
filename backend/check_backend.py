import urllib.request

try:
    with urllib.request.urlopen("http://127.0.0.1:8000/api/v1/master-data/departments", timeout=3) as resp:
        print("Backend Status:", resp.status)
except Exception as e:
    print("Backend Error:", e)
