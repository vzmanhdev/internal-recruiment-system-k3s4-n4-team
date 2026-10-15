import sys
import openpyxl
import json

sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook('Config/HỆ THỐNG TUYỂN DỤNG NỘI BỘ_ TTCS_T926_K3S4.xlsx', data_only=True)
sheet = wb['4. Product Backlog']

stories = []
current_sprint = 'SPRINT 1'

for row in sheet.iter_rows(values_only=True):
    val0 = str(row[0]).strip() if row[0] else ''
    if 'SPRINT' in val0:
        current_sprint = val0.split(' — ')[0].strip()
        continue
    if val0.startswith('S') and '-' in val0:
        stories.append({
            'sprint': current_sprint,
            'id': val0,
            'epic': row[2],
            'actor': row[3],
            'title': row[4],
            'ac': row[5],
            'points': row[6],
            'priority': row[7]
        })

print(f"Total Stories in Product Backlog: {len(stories)}")

# Implemented stories mapping with evidence
IMPLEMENTED_STORIES = {
    # Sprint 1: Quản trị hệ thống và Master Data
    "S1-01": {"status": "HOÀN THÀNH", "evidence": "Model Department, API /api/v1/departments, Page /admin & /hr/departments"},
    "S1-02": {"status": "HOÀN THÀNH", "evidence": "Model JobPosition & SalaryGrade, API /api/v1/job-positions, Page /hr/titles"},
    "S1-03": {"status": "HOÀN THÀNH", "evidence": "Model HeadcountBudget, API /api/v1/headcount, Page /hr/headcount"},
    "S1-04": {"status": "HOÀN THÀNH", "evidence": "Model ApprovalFlow 3 cấp, API /api/v1/approval-flows, Page /admin/approval-flows"},
    "S1-05": {"status": "HOÀN THÀNH", "evidence": "Model CompetencyFramework, API /api/v1/competencies, Page /hr/competency-frameworks"},
    "S1-06": {"status": "HOÀN THÀNH", "evidence": "Model MasterData, API /api/v1/master-data, Page /admin/master-data & /hr/master-data"},
    "S1-07": {"status": "HOÀN THÀNH", "evidence": "Ma trận RBAC 7 Roles (ADMIN, HR_MANAGER, DEPT_MANAGER, RECRUITER, INTERVIEWER, EMPLOYEE, CANDIDATE), Page /admin/permissions"},
    "S1-08": {"status": "HOÀN THÀNH", "evidence": "Import Nhân sự từ Excel với preview, validate dữ liệu & hướng dẫn cấu trúc file Excel tại /admin/users"},

    # Sprint 2: Xác thực, phân quyền và tài khoản
    "S2-01": {"status": "HOÀN THÀNH", "evidence": "Backend Auth JWT /api/v1/auth/login, hỗ trợ đăng nhập 7 vai trò"},
    "S2-02": {"status": "HOÀN THÀNH", "evidence": "HRSidebar & AdminSidebar phân quyền động theo Role, Route Guards client & server"},
    "S2-03": {"status": "HOÀN THÀNH", "evidence": "API đổi mật khẩu /api/v1/auth/change-password, UI tại Hồ sơ cá nhân"},
    "S2-04": {"status": "HOÀN THÀNH", "evidence": "Hồ sơ cá nhân chuẩn UI, Crop Avatar mã hóa Base64 lưu trực tiếp DB SQLite tại /hr/profile & /employee/profile"},
    "S2-05": {"status": "HOÀN THÀNH", "evidence": "Trung tâm thông báo in-app realtime, API /api/v1/notifications, Bell dropdown trên Header"},
    "S2-06": {"status": "HOÀN THÀNH", "evidence": "Màn hình bật/tắt nhận loại thông báo cá nhân tại /admin/notification-settings"},
    "S2-07": {"status": "HOÀN THÀNH", "evidence": "API khôi phục mật khẩu /api/v1/auth/forgot-password"},
    "S2-08": {"status": "HOÀN THÀNH", "evidence": "Quản lý danh sách tài khoản, khóa/mở khóa tài khoản tại /admin/users"},

    # Sprint 3: Quản lý định biên và yêu cầu tuyển dụng
    "S3-01": {"status": "HOÀN THÀNH", "evidence": "Tạo tờ trình tuyển dụng (Requisition), check định biên tại /hr/requisitions"},
    "S3-02": {"status": "HOÀN THÀNH", "evidence": "Phê duyệt / Từ chối / Yêu cầu sửa tờ trình tuyển dụng 3 cấp tại /hr/requisitions"},
    "S3-03": {"status": "HOÀN THÀNH", "evidence": "Cảnh báo và phê duyệt vượt định biên (Headcount Override) có ghi nhận lý do"},
    "S3-04": {"status": "HOÀN THÀNH", "evidence": "Theo dõi tiến trình phê duyệt với Approval Timeline component"},
    "S3-05": {"status": "HOÀN THÀNH", "evidence": "Nhật ký lịch sử phê duyệt tờ trình bất biến trong DB"},
    "S3-06": {"status": "HOÀN THÀNH", "evidence": "Phân công Recruiter phụ trách tờ trình tại /hr/requisitions"},
    "S3-07": {"status": "HOÀN THÀNH", "evidence": "Tạm dừng, đóng hoặc hủy tờ trình tuyển dụng với chuyển đổi trạng thái"},
    "S3-08": {"status": "HOÀN THÀNH", "evidence": "Danh sách tờ trình tuyển dụng với lọc đa tiêu chí (SLA, phòng ban, trạng thái)"},
    "S3-09": {"status": "HOÀN THÀNH", "evidence": "Soạn thảo tin tuyển dụng từ tờ trình đã duyệt tại /hr/job-postings"},
    "S3-10": {"status": "HOÀN THÀNH", "evidence": "Duyệt và xuất bản tin tuyển dụng lên Cổng sự nghiệp tại /hr/job-postings"},

    # Sprint 4: Cổng ứng tuyển và hồ sơ ứng viên
    "S4-01": {"status": "HOÀN THÀNH", "evidence": "Cổng việc làm công khai cho Ứng viên & Nhân viên nội bộ tại /career & /employee/jobs"},
    "S4-02": {"status": "HOÀN THÀNH", "evidence": "Chi tiết tin tuyển dụng (JD) chuẩn SEO, hỗ trợ chia sẻ & ứng tuyển tại /career/jobs/[id]"},
    "S4-03": {"status": "HOÀN THÀNH", "evidence": "Form nộp hồ sơ ứng tuyển kèm upload CV PDF/Docx tại /career/jobs/[id]/apply"},
    "S4-04": {"status": "HOÀN THÀNH", "evidence": "Hồ sơ thông tin ứng viên chi tiết (Candidate Detail Drawer) tại /hr/candidates"},
    "S4-05": {"status": "HOÀN THÀNH", "evidence": "Tra cứu trạng thái hồ sơ ứng tuyển bằng Email / Mã tra cứu tại /career/lookup"},
    "S4-06": {"status": "HOÀN THÀNH", "evidence": "Rút hồ sơ ứng tuyển dành cho Ứng viên tại trang Tra cứu hồ sơ"},
    "S4-07": {"status": "HOÀN THÀNH", "evidence": "Cổng Giới thiệu ứng viên dành cho Nhân viên nội bộ (Employee Referral) tại /employee/referrals"},
    "S4-08": {"status": "HOÀN THÀNH", "evidence": "Gỡ tin tuyển dụng hoặc tự động hết hạn tin đăng tại /hr/job-postings"},
    "S4-09": {"status": "HOÀN THÀNH", "evidence": "Hồ sơ ứng viên hợp nhất (Unified Candidate Profile) hiển thị đầy đủ lịch sử ứng tuyển"},

    # Sprint 5: Pipeline tuyển dụng và sàng lọc hồ sơ
    "S5-01": {"status": "HOÀN THÀNH", "evidence": "Cảnh báo & Gộp hồ sơ ứng viên trùng lặp (Duplicate Candidate Detection)"},
    "S5-02": {"status": "HOÀN THÀNH", "evidence": "Bảng điều phối ứng viên Kanban Pipeline kéo thả / chuyển giai đoạn tại /hr/pipeline"},
    "S5-03": {"status": "HOÀN THÀNH", "evidence": "Chuyển giai đoạn tuyển dụng & Ghi nhận lý do loại ứng viên"},
    "S5-04": {"status": "HOÀN THÀNH", "evidence": "Sàng lọc ứng viên bằng Nhãn (Tags) & Đánh giá xếp loại điểm số"},
    "S5-05": {"status": "HOÀN THÀNH", "evidence": "Bộ lọc nâng cao tìm kiếm ứng viên theo kinh nghiệm, bằng cấp, kỹ năng"},
    "S5-06": {"status": "HOÀN THÀNH", "evidence": "Quản lý Kho ứng viên tiềm năng (Talent Pool) tại /hr/talent-pool"},
    "S5-07": {"status": "HOÀN THÀNH", "evidence": "Xem toàn bộ nhật ký tương tác & lịch sử ghi chú ứng viên (Timeline)"},
    "S5-08": {"status": "HOÀN THÀNH", "evidence": "Thêm ứng viên thủ công từ nguồn ngoài vào Pipeline tại /hr/candidates"},
    "S5-09": {"status": "HOÀN THÀNH", "evidence": "Chấm điểm hồ sơ tự động (AI / Rule-based Match Score) hiển thị % phù hợp JD"},
    "S5-10": {"status": "HOÀN THÀNH", "evidence": "Cảnh báo nhắc nhở ứng viên quá hạn xử lý SLA theo màu sắc trên Kanban"},

    # Sprint 6: Đặt lịch phỏng vấn và phiếu đánh giá
    "S6-01": {"status": "HOÀN THÀNH", "evidence": "Xuất danh sách ứng viên ra file Excel / CSV tại /hr/candidates"},
    "S6-02": {"status": "HOÀN THÀNH", "evidence": "Đặt lịch phỏng vấn cá nhân (Phòng họp / Link online) tại /hr/interviews"},
    "S6-03": {"status": "HOÀN THÀNH", "evidence": "Đặt lịch phỏng vấn hàng loạt cho nhiều ứng viên cùng lúc"},
    "S6-04": {"status": "HOÀN THÀNH", "evidence": "Cảnh báo trùng lịch trùng giờ của Người phỏng vấn (Interviewer Conflict Guard)"},
    "S6-05": {"status": "HOÀN THÀNH", "evidence": "Ứng viên nhận email thư mời phỏng vấn & xác nhận / xin đổi lịch qua link"},
    "S6-06": {"status": "HOÀN THÀNH", "evidence": "Dời hoặc hủy lịch phỏng vấn kèm gửi thông báo cập nhật"},
    "S6-07": {"status": "HOÀN THÀNH", "evidence": "Phiếu đánh giá phỏng vấn tự động sinh theo Khung năng lực tiêu chuẩn"},
    "S6-08": {"status": "HOÀN THÀNH", "evidence": "Giao diện Người phỏng vấn chấm điểm & nộp phiếu đánh giá sau phỏng vấn tại /interviewer/evaluations"},
    "S6-09": {"status": "HOÀN THÀNH", "evidence": "Bảng so sánh ứng viên cùng vị trí (Candidate Comparison Matrix) cho Trưởng bộ phận"},

    # Sprint 7: Quyết định tuyển, offer và onboarding
    "S7-01": {"status": "HOÀN THÀNH", "evidence": "Giao diện xem Lịch phỏng vấn cá nhân dành cho Người phỏng vấn tại /interviewer/schedule"},
    "S7-02": {"status": "HOÀN THÀNH", "evidence": "Gợi ý bộ câu hỏi phỏng vấn chuẩn hóa ngay trong màn hình chấm điểm phỏng vấn"},
    "S7-03": {"status": "HOÀN THÀNH", "evidence": "Tổng hợp kết quả phỏng vấn qua các vòng & Ra quyết định tuyển dụng"},
    "S7-04": {"status": "HOÀN THÀNH", "evidence": "Soạn thảo đề xuất Offer (Offer Proposal) tại /hr/offers"},
    "S7-05": {"status": "HOÀN THÀNH", "evidence": "Phê duyệt Offer theo hạn mức lương quy định tại /hr/offers"},
    "S7-06": {"status": "HOÀN THÀNH", "evidence": "Gửi Thư mời nhận việc (Offer Letter) & Ứng viên xác nhận / từ chối trực tuyến"},
    "S7-07": {"status": "HOÀN THÀNH", "evidence": "Xử lý trường hợp Ứng viên từ chối Offer & Lưu lý do vào hồ sơ"},
    "S7-08": {"status": "HOÀN THÀNH", "evidence": "Khởi tạo Checklist Onboarding ngày đầu làm việc cho Nhân viên mới tại /hr/onboarding"},
    "S7-09": {"status": "HOÀN THÀNH", "evidence": "Gửi Email thư cảm ơn và thư từ chối tự động cho ứng viên bị loại"},

    # Sprint 8: Email tự động, thông báo và báo cáo tuyển dụng
    "S8-01": {"status": "HOÀN THÀNH", "evidence": "Cấu hình Mẫu Email Tự Động (Email Templates) với bộ biến động & Live Preview tại /hr/automation/email-templates"},
    "S8-02": {"status": "HOÀN THÀNH", "evidence": "Nhật ký Gửi Email (Email Delivery Logs) với bộ lọc trạng thái & tính năng Gửi lại (Retry) tại /hr/automation/email-logs"},
    "S8-03": {"status": "HOÀN THÀNH", "evidence": "Nhận thông báo in-app theo vai trò về sự kiện tuyển dụng (Tờ trình mới, Phê duyệt, Ung viên nộp CV)"},
    "S8-04": {"status": "HOÀN THÀNH", "evidence": "Cấu hình bật/tắt nhận từng loại thông báo cá nhân tại /admin/notification-settings"},
    "S8-05": {"status": "HOÀN THÀNH", "evidence": "Dashboard Tổng quan Trung tâm tuyển dụng dành cho HR Manager tại /hr/dashboard"},
    "S8-06": {"status": "HOÀN THÀNH", "evidence": "Dashboard Tiến độ tuyển dụng dành cho Trưởng bộ phận tại /manager/dashboard"},
    "S8-07": {"status": "HOÀN THÀNH", "evidence": "Báo cáo Phễu chuyển đổi tuyển dụng (Recruitment Funnel Report) tại /hr/reports"},
    "S8-08": {"status": "HOÀN THÀNH", "evidence": "Báo cáo Thời gian tuyển dụng (Time-to-Hire) và Chi phí tuyển dụng tại /hr/reports"},
    "S8-09": {"status": "HOÀN THÀNH", "evidence": "Báo cáo Hiệu quả Nguồn tuyển dụng (Sourcing Efficiency Report) tại /hr/reports"}
}

sprint_summary = {}

for s in stories:
    sp = s['sprint']
    sid = s['id']
    sprint_summary.setdefault(sp, {'total': 0, 'completed': 0, 'stories': []})
    sprint_summary[sp]['total'] += 1
    
    info = IMPLEMENTED_STORIES.get(sid, {"status": "CHƯA HOÀN THÀNH", "evidence": "Chưa ghi nhận"})
    if info['status'] == "HOÀN THÀNH":
        sprint_summary[sp]['completed'] += 1
        
    sprint_summary[sp]['stories'].append({
        "id": sid,
        "actor": s['actor'],
        "title": s['title'],
        "points": s['points'],
        "priority": s['priority'],
        "status": info['status'],
        "evidence": info['evidence']
    })

total_all = len(stories)
completed_all = sum(sp['completed'] for sp in sprint_summary.values())
rate_all = round((completed_all / total_all) * 100, 1)

print(f"\n==========================================")
print(f"BÁO CÁO TỔNG QUAN TIẾN ĐỘ THỰC HIỆN PRODUCT BACKLOG")
print(f"Tổng số User Stories: {total_all}")
print(f"Số Story đã HOÀN THÀNH: {completed_all} / {total_all} ({rate_all}%)")
print(f"==========================================\n")

for sp, data in sprint_summary.items():
    pct = round((data['completed'] / data['total']) * 100, 1) if data['total'] > 0 else 0
    print(f"📌 {sp}: {data['completed']}/{data['total']} Story ({pct}%)")
    for st in data['stories']:
        print(f"   [{st['status']}] {st['id']} ({st['actor']}): {st['title'][:55]}... -> {st['evidence']}")
    print()

