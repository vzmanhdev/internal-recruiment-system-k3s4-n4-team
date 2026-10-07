import urllib.request
import json
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api/v1/master-data"

def request(url, method="GET", data=None):
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method=method
    )
    try:
        with urllib.request.urlopen(req) as resp:
            res_body = resp.read().decode("utf-8")
            return resp.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        print(f"HTTPError {e.code}: {e.read().decode('utf-8')}")
        raise e

print("=== 1. TESTING GET /salary-bands ===")
status, bands = request(f"{BASE_URL}/salary-bands")
print(f"Status: {status}, Total bands in DB: {len(bands)}")

print("\n=== 2. TESTING POST /salary-bands (Create new job title) ===")
unique_code = f"AI-ENG-{int(time.time() * 1000)}"
new_band_payload = {
    "code": unique_code,
    "title": "Kỹ Sư AI / Machine Learning Cao Cấp",
    "level": "Senior",
    "minSalary": 40000000,
    "maxSalary": 65000000,
    "department": "Trung Tâm Phát Triển Phần Mềm"
}
status, created_band = request(f"{BASE_URL}/salary-bands", method="POST", data=new_band_payload)
print(f"Status: {status}, Created Band ID: {created_band.get('id')}, Code: {created_band.get('code')}")

print("\n=== 3. TESTING PUT /salary-bands/{id} (Update salary band) ===")
band_id = created_band["id"]
update_payload = {"maxSalary": 70000000, "level": "Lead"}
status, updated_band = request(f"{BASE_URL}/salary-bands/{band_id}", method="PUT", data=update_payload)
print(f"Status: {status}, Updated MaxSalary: {updated_band.get('maxSalary')}, Level: {updated_band.get('level')}")

print("\n=== 4. TESTING GET /departments ===")
status, depts = request(f"{BASE_URL}/departments")
print(f"Status: {status}, Total departments in DB: {len(depts)}")

print("\n=== 5. TESTING POST /departments (Create child department) ===")
unique_dept_code = f"AI-LAB-{int(time.time() * 1000)}"
new_dept_payload = {
    "code": unique_dept_code,
    "name": "Phòng Nghiên Cứu AI & Generative AI",
    "managerName": "Nguyễn AI Leader",
    "managerTitle": "Chief AI Scientist",
    "headcountBudget": 10,
    "parentId": "dept-2"
}
status, created_dept = request(f"{BASE_URL}/departments", method="POST", data=new_dept_payload)
print(f"Status: {status}, Created Dept ID: {created_dept.get('id')}, Code: {created_dept.get('code')}")

print("\n=== 6. CLEANING UP TEST DATA ===")
status, _ = request(f"{BASE_URL}/salary-bands/{band_id}", method="DELETE")
print(f"Deleted Salary Band: {status}")
status, _ = request(f"{BASE_URL}/departments/{created_dept['id']}", method="DELETE")
print(f"Deleted Department: {status}")

print("\n>>> ALL MASTER DATA CRUD TESTS PASSED 100%! <<<")
