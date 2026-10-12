import sys, openpyxl, json
sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook(r'd:\TTCS_CODE_GYM\internal-recruiment-system-k3s4-n4-team\HỆ THỐNG TUYỂN DỤNG NỘI BỘ_ TTCS_T926_K3S4.xlsx', data_only=True)

ws_pb = wb['4. Product Backlog']
stories = []
for r in range(2, ws_pb.max_row + 1):
    code = str(ws_pb.cell(row=r, column=1).value or '').strip()
    sprint = str(ws_pb.cell(row=r, column=2).value or '').strip()
    epic = str(ws_pb.cell(row=r, column=3).value or '').strip()
    role = str(ws_pb.cell(row=r, column=4).value or '').strip()
    story = str(ws_pb.cell(row=r, column=5).value or '').strip()
    ac = str(ws_pb.cell(row=r, column=6).value or '').strip()
    priority = str(ws_pb.cell(row=r, column=7).value or '').strip()
    
    if code and story:
        stories.append({
            'code': code, 'sprint': sprint, 'epic': epic, 'role': role,
            'story': story, 'ac': ac, 'priority': priority
        })

print(f"TOTAL STORIES IN BACKLOG: {len(stories)}\n")

direct_hr = []
indirect_hr = []

for s in stories:
    role_lower = s['role'].lower()
    story_lower = s['story'].lower()
    ac_lower = s['ac'].lower()
    
    if 'trưởng phòng nhân sự' in role_lower or 'hr manager' in role_lower:
        direct_hr.append(s)
    elif any(k in role_lower or k in story_lower or k in ac_lower for k in ['nhân sự', 'hr', 'duyệt', 'headcount', 'quy trình', 'báo cáo', 'chỉ tiêu', 'offer', 'cấu hình', 'onboarding', 'phòng ban', 'chức danh']):
        indirect_hr.append(s)

print(f"=== 1. TRỰC TIẾP HR MANAGER STORIES ({len(direct_hr)} STORIES) ===")
for s in direct_hr:
    print(f"[{s['code']}] Sprint {s['sprint']} | Epic: {s['epic']} | Priority: {s['priority']}")
    print(f"   Story: {s['story']}")
    print(f"   AC:\n{s['ac']}")
    print('-'*70)

print(f"\n=== 2. GIÁN TIẾP HR MANAGER TIẾP CẬN/PHÂN QUYỀN STORIES ({len(indirect_hr)} STORIES) ===")
for s in indirect_hr:
    print(f"[{s['code']}] Role: {s['role']} | Epic: {s['epic']}")
    print(f"   Story: {s['story']}")
    print(f"   AC:\n{s['ac']}")
    print('-'*70)
