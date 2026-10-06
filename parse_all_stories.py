import sys
import openpyxl
import json

sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook('Config/HỆ THỐNG TUYỂN DỤNG NỘI BỘ_ TTCS_T926_K3S4.xlsx', data_only=True)
sheet = wb['4. Product Backlog']

all_stories = []
current_sprint = 'SPRINT 1'

for idx, row in enumerate(sheet.iter_rows(values_only=True), start=1):
    val0 = str(row[0]).strip() if row[0] is not None else ''
    val1 = str(row[1]).strip() if row[1] is not None else ''
    val2 = str(row[2]).strip() if row[2] is not None else ''
    val3 = str(row[3]).strip() if row[3] is not None else ''
    val4 = str(row[4]).strip() if row[4] is not None else ''
    val5 = str(row[5]).strip() if row[5] is not None else ''
    val6 = str(row[6]).strip() if row[6] is not None else ''
    val7 = str(row[7]).strip() if row[7] is not None else ''

    if 'SPRINT' in val0:
        current_sprint = val0.split(' — ')[0].strip()
        continue
    
    if (val0.startswith('S') and '-' in val0) or (val1.startswith('S') and '-' in val1):
        story_id = val0 if (val0.startswith('S') and '-' in val0) else val1
        all_stories.append({
            'row': idx,
            'sprint': current_sprint,
            'id': story_id,
            'epic': val2,
            'actor': val3,
            'title': val4,
            'ac': val5,
            'points': val6,
            'priority': val7
        })

print(f"Total User Stories Extracted: {len(all_stories)}")
with open('extracted_stories.json', 'w', encoding='utf-8') as f:
    json.dump(all_stories, f, ensure_ascii=False, indent=2)

for s in all_stories:
    print(f"Row {s['row']}: [{s['sprint']}] [{s['id']}] [{s['actor']}] {s['title'][:50]}")
