"""
Seed data script for Internal Recruitment System
Creates default accounts and recruitment data:
- Password chung cho tất cả tài khoản seed data: company123
- Admin: admin@company.com / company123
- HR Manager / Recruiter: hr@company.com / company123
- Hiring Manager: manager@company.com / company123
- Employee: tranthib@company.com / company123
- Job Postings (bao gồm bài đăng đã duyệt và bài đăng chờ duyệt)
- Candidate Applications across all ATS stages
- Interview Schedules
- Referral Records
"""

import sys
import io
import json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.db.session import SessionLocal, engine, Base
from app.models.user import User
from app.models.recruitment import JobRequisition, JobPosting, Application, InterviewSchedule, ReferralRecord
from app.models.audit import AuditLog
from app.core.security import hash_password
from sqlalchemy import inspect, text

# Ensure tables exist
Base.metadata.create_all(bind=engine)

# Ensure approval_status and requisition_id columns exist in SQLite / Postgres
with engine.begin() as connection:
    if "job_postings" in inspect(engine).get_table_names():
        job_columns = {column["name"] for column in inspect(engine).get_columns("job_postings")}
        if "approval_status" not in job_columns:
            connection.execute(text("ALTER TABLE job_postings ADD COLUMN approval_status VARCHAR(30) NOT NULL DEFAULT 'approved'"))
        if "requisition_id" not in job_columns:
            connection.execute(text("ALTER TABLE job_postings ADD COLUMN requisition_id INTEGER NULL"))

DEFAULT_SEED_PASSWORD = "company123"

SEED_USERS = [
    {
        "email": "admin@company.com",
        "password": DEFAULT_SEED_PASSWORD,
        "full_name": "System Administrator",
        "role": "admin",
        "phone": "0901234567",
        "account_status": "active",
        "is_active": True,
    },
    {
        "email": "hr@company.com",
        "password": DEFAULT_SEED_PASSWORD,
        "full_name": "Nguyễn Thu Hà (Nhân sự)",
        "role": "hr_manager",
        "phone": "0902345678",
        "account_status": "active",
        "is_active": True,
    },
    {
        "email": "manager@company.com",
        "password": DEFAULT_SEED_PASSWORD,
        "full_name": "Trần Quốc Bảo (Tech Manager)",
        "role": "manager",
        "phone": "0903456789",
        "account_status": "active",
        "is_active": True,
    },
    {
        "email": "tranthib@company.com",
        "password": DEFAULT_SEED_PASSWORD,
        "full_name": "Trần Thị B",
        "role": "employee",
        "phone": "0987654321",
        "account_status": "active",
        "is_active": True,
    },
    {
        "email": "skibidi@company.com",
        "password": DEFAULT_SEED_PASSWORD,
        "full_name": "Tài Khoản Bị Khóa",
        "role": "manager",
        "phone": "0909999999",
        "account_status": "locked",
        "is_active": False,
        "lock_reason": "Vi phạm chính sách bảo mật nội bộ doanh nghiệp",
    },
]

SEED_REQUISITIONS = [
    {
        "id": 1,
        "title": "Kỹ sư DevOps / Hạ tầng Cloud",
        "department": "Khối Công nghệ",
        "salary_range": "35 - 50 Triệu VNĐ",
        "openings": 2,
        "experience_level": "Senior (3+ năm)",
        "reason": "Mở rộng hệ sinh thái microservices và chuẩn hóa Kubernetes",
        "status": "approved",
        "approval_chain": json.dumps([
            {"step": 1, "role": "Trưởng bộ phận Kỹ thuật", "approver": "Trần Quốc Bảo (Tech Manager)", "status": "approved", "comment": "Đồng ý đề xuất mở rộng headcount dự án", "updated_at": "01/10/2026 09:15"},
            {"step": 2, "role": "Trưởng phòng Nhân sự", "approver": "Nguyễn Thu Hà (HR Manager)", "status": "approved", "comment": "Chỉ tiêu headcount phòng ban còn trống, đồng ý tuyển", "updated_at": "01/10/2026 14:30"},
            {"step": 3, "role": "Ban Giám đốc Khối", "approver": "Lê Hoàng Nam (Tech Director)", "status": "approved", "comment": "Phê duyệt ngân sách lương dải 35 - 50 triệu", "updated_at": "02/10/2026 10:00"}
        ], ensure_ascii=False),
        "description": "Chịu trách nhiệm thiết kế, tự động hóa quy trình CI/CD và vận hành hạ tầng Cloud AWS/Kubernetes cho toàn bộ dịch vụ công ty.",
        "requirements": "Ít nhất 3 năm kinh nghiệm vận hành Docker, Kubernetes (EKS)\nThành thạo công cụ CI/CD (GitLab CI, GitHub Actions, ArgoCD)\nKinh nghiệm quản trị hạ tầng qua mã nguồn (Terraform)",
        "benefits": "Gói đãi ngộ cạnh tranh lên đến 50M + Thưởng hiệu quả\nBảo hiểm sức khỏe cao cấp VIP\nĐược cấp MacBook Pro M3 Max phục vụ công việc",
        "created_by": "Trần Quốc Bảo (Tech Manager)",
        "is_converted": False,
    },
    {
        "id": 2,
        "title": "Chuyên viên An toàn thông tin (SOC Analyst)",
        "department": "Khối Công nghệ",
        "salary_range": "25 - 40 Triệu VNĐ",
        "openings": 1,
        "experience_level": "Chuyên viên (2-3 năm)",
        "reason": "Tăng cường năng lực giám sát an ninh mạng và ứng cứu sự cố",
        "status": "pending_approval",
        "approval_chain": json.dumps([
            {"step": 1, "role": "Trưởng bộ phận Kỹ thuật", "approver": "Trần Quốc Bảo (Tech Manager)", "status": "approved", "comment": "Đã duyệt nhu cầu nhân sự", "updated_at": "03/10/2026 10:30"},
            {"step": 2, "role": "Trưởng phòng Nhân sự", "approver": "Nguyễn Thu Hà (HR Manager)", "status": "pending", "comment": "Đang đối soát ngân sách và thẩm định mô tả công việc", "updated_at": None},
            {"step": 3, "role": "Ban Giám đốc Khối", "approver": "Lê Hoàng Nam (Tech Director)", "status": "pending", "comment": "Chờ Cấp 2 duyệt", "updated_at": None}
        ], ensure_ascii=False),
        "description": "Giám sát các cảnh báo bảo mật từ hệ thống SIEM/EDR, điều tra và phối hợp xử lý sự cố an toàn thông tin.",
        "requirements": "Có 2 năm kinh nghiệm làm việc tại trung tâm điều hành an ninh mạng SOC\nHiểu biết sâu sắc về các kỹ thuật tấn công và phòng thủ mạng\nƯu tiên có chứng chỉ CEH, CompTIA Security+ hoặc tương đương",
        "benefits": "Được tài trợ 100% chi phí thi các chứng chỉ quốc tế uy tín (OSCP, CISSP)\nThưởng dự án và phụ cấp trực ca trực chiến",
        "created_by": "Trần Quốc Bảo (Tech Manager)",
        "is_converted": False,
    },
    {
        "id": 3,
        "title": "Thực tập sinh Marketing Nội bộ",
        "department": "Khối Nhân sự",
        "salary_range": "5 - 8 Triệu VNĐ",
        "openings": 2,
        "experience_level": "Thực tập sinh (Intern)",
        "reason": "Hỗ trợ dự án sự kiện văn hóa nội bộ cuối năm",
        "status": "draft",
        "approval_chain": json.dumps([
            {"step": 1, "role": "Trưởng bộ phận", "approver": "Nguyễn Thu Hà (HR Manager)", "status": "draft", "comment": "Bản nháp - Chưa gửi phê duyệt", "updated_at": None}
        ], ensure_ascii=False),
        "description": "Hỗ trợ sáng tạo ấn phẩm truyền thông nội bộ, điều phối sự kiện giao lưu và các hoạt động teambuilding nội bộ công ty.",
        "requirements": "Sinh viên năm 3-4 chuyên ngành Báo chí, Truyền thông hoặc Marketing\nNăng động, nhiệt huyết, giao tiếp tốt\nBiết sử dụng Canva hoặc Premiere là lợi thế",
        "benefits": "Phụ cấp thực tập hấp dẫn 5 - 8M\nCó dấu mộc thực tập và cơ hội lên nhân viên chính thức sau 3 tháng",
        "created_by": "Nguyễn Thu Hà (HR Manager)",
        "is_converted": False,
    },
    {
        "id": 4,
        "title": "Chuyên viên Phân tích Nghiệp vụ (Business Analyst)",
        "department": "Khối Sản phẩm",
        "salary_range": "22 - 32 Triệu VNĐ",
        "openings": 1,
        "experience_level": "Mid-level (2 năm)",
        "reason": "Triển khai luồng tính năng mới cho cổng tuyển dụng nội bộ",
        "status": "approved",
        "approval_chain": json.dumps([
            {"step": 1, "role": "Trưởng bộ phận Sản phẩm", "approver": "Hoàng Nam (Product Lead)", "status": "approved", "comment": "Cần gấp 1 BA phụ trách dự án portal nội bộ", "updated_at": "02/10/2026 11:00"},
            {"step": 2, "role": "Trưởng phòng Nhân sự", "approver": "Nguyễn Thu Hà (HR Manager)", "status": "approved", "comment": "Đồng ý đề xuất tuyển dụng", "updated_at": "02/10/2026 15:45"},
            {"step": 3, "role": "Ban Giám đốc Khối", "approver": "Phạm Minh (CPO)", "status": "approved", "comment": "Phê duyệt triển khai tuyển dụng ngay", "updated_at": "03/10/2026 09:00"}
        ], ensure_ascii=False),
        "description": "Làm việc với các bên liên quan (Stakeholders) để khảo sát, làm rõ và tài liệu hóa các yêu cầu nghiệp vụ hệ thống.",
        "requirements": "Có ít nhất 2 năm kinh nghiệm làm BA phần mềm\nThành thạo vẽ sơ đồ quy trình BPMN, viết User Story và Acceptance Criteria\nKỹ năng thuyết trình và đàm phán tốt",
        "benefits": "Được tham gia các dự án chuyển đổi số quy mô lớn của doanh nghiệp\nReview lương 2 lần/năm\nĐài thọ các khóa đào tạo CBAP quốc tế",
        "created_by": "Hoàng Nam (Product Lead)",
        "is_converted": False,
    },
]

SEED_JOBS = [
    {
        "id": 1,
        "title": "Senior Data Analyst",
        "department": "Khối Công nghệ",
        "location": "Hà Nội",
        "employment_type": "Toàn thời gian",
        "openings": 2,
        "salary_range": "28 - 40 Triệu VNĐ",
        "experience_level": "Senior (3+ năm)",
        "deadline": "30/11/2026",
        "status": "open",
        "approval_status": "approved",
        "description": "Chịu trách nhiệm phân tích dữ liệu kinh doanh, phát triển mô hình dự báo và xây dựng hệ thống báo cáo BI phục vụ ban điều hành.",
        "requirements": "Ít nhất 3 năm kinh nghiệm phân tích dữ liệu kinh doanh\nThành thạo SQL, Python, Power BI / Tableau\nTư duy phân tích số liệu nhạy bén và kỹ năng trình bày báo cáo",
        "benefits": "Thưởng hiệu quả quý và năm hấp dẫn\nBảo hiểm sức khỏe cao cấp VIP\nLộ trình thăng tiến Lead Data Analyst rõ ràng",
        "created_by": "Nguyễn Thu Hà (HR Recruiter)",
    },
    {
        "id": 2,
        "title": "Chuyên viên Truyền thông Nội bộ",
        "department": "Khối Nhân sự",
        "location": "TP. Hồ Chí Minh",
        "employment_type": "Toàn thời gian",
        "openings": 1,
        "salary_range": "18 - 25 Triệu VNĐ",
        "experience_level": "Mid-level (2 năm)",
        "deadline": "15/11/2026",
        "status": "open",
        "approval_status": "approved",
        "description": "Lập kế hoạch và triển khai các chiến dịch truyền thông gắn kết nhân sự, văn hóa doanh nghiệp và bản tin nội bộ định kỳ.",
        "requirements": "Có kinh nghiệm 2 năm trong mảng Internal Communications\nKỹ năng viết lách, sáng tạo nội dung và tổ chức sự kiện tốt\nSử dụng thành thạo Canva, Photoshop cơ bản là lợi thế",
        "benefits": "Môi trường trẻ trung, sáng tạo\nNgân sách tổ chức sự kiện phong phú\nPhụ cấp công tác và thiết bị làm việc",
        "created_by": "Nguyễn Thu Hà (HR Recruiter)",
    },
    {
        "id": 3,
        "title": "Product Specialist / Chuyên viên Sản phẩm",
        "department": "Khối Sản phẩm",
        "location": "Hà Nội",
        "employment_type": "Toàn thời gian",
        "openings": 2,
        "salary_range": "25 - 35 Triệu VNĐ",
        "experience_level": "Chuyên viên (2-3 năm)",
        "deadline": "20/10/2026",
        "status": "closingSoon",
        "approval_status": "approved",
        "description": "Nghiên cứu nhu cầu khách hàng, phối hợp cùng đội ngũ kỹ thuật và thiết kế UI/UX để tối ưu hóa tính năng sản phẩm công nghệ.",
        "requirements": "Hiểu biết sâu sắc về Product Lifecycle và phương pháp Agile/Scrum\nKhả năng phân tích yêu cầu nghiệp vụ (BA) và viết User Story rõ ràng\nGiao tiếp tốt liên phòng ban",
        "benefits": "Được trực tiếp tham gia định hình các sản phẩm cốt lõi\nChính sách thưởng dự án hàng quý\nTham gia các khóa đào tạo Product Owner quốc tế",
        "created_by": "Nguyễn Thu Hà (HR Recruiter)",
    },
    {
        "id": 4,
        "title": "Chuyên viên Kinh doanh Doanh nghiệp (B2B)",
        "department": "Khối Kinh doanh",
        "location": "Hà Nội",
        "employment_type": "Toàn thời gian",
        "openings": 3,
        "salary_range": "15 - 30 Triệu + Hoa hồng",
        "experience_level": "Chuyên viên (1-2 năm)",
        "deadline": "05/11/2026",
        "status": "open",
        "approval_status": "approved",
        "description": "Tìm kiếm, kết nối và tư vấn giải pháp chuyển đổi số cho các doanh nghiệp khách hàng đối tác.",
        "requirements": "Kỹ năng đàm phán, thuyết phục xuất sắc\nTác phong chuyên nghiệp, định hướng mục tiêu doanh số cao\nƯu tiên ứng viên có mạng lưới quan hệ khách hàng B2B",
        "benefits": "Thu nhập không giới hạn theo doanh số\nDu lịch hàng năm cùng công ty\nĐược đào tạo kỹ năng bán hàng B2B chuyên nghiệp",
        "created_by": "Nguyễn Thu Hà (HR Recruiter)",
    },
    {
        "id": 5,
        "title": "Trưởng nhóm Giải pháp Cloud (Cloud Solutions Lead)",
        "department": "Khối Công nghệ",
        "location": "Hà Nội",
        "employment_type": "Toàn thời gian",
        "openings": 1,
        "salary_range": "40 - 60 Triệu VNĐ",
        "experience_level": "Lead / Quản lý (5+ năm)",
        "deadline": "25/12/2026",
        "status": "open",
        "approval_status": "pending",
        "requisition_id": None,
        "description": "Chịu trách nhiệm thiết kế, triển khai và quản trị hạ tầng điện toán đám mây cho toàn bộ hệ thống lõi doanh nghiệp.",
        "requirements": "Ít nhất 5 năm kinh nghiệm về Cloud Architecture (AWS/Azure/GCP)\nChứng chỉ AWS Solutions Architect Professional hoặc tương đương\nKinh nghiệm quản lý và dẫn dắt đội ngũ kỹ thuật",
        "benefits": "Thu nhập cạnh tranh cùng gói cổ phần ESOP thưởng hàng năm\nGói bảo hiểm sức khỏe VIP cho cả gia đình\nNgân sách nghiên cứu và đào tạo công nghệ không giới hạn",
        "created_by": "Nguyễn Thu Hà (HR Manager)",
    },
    {
        "id": 6,
        "title": "Kỹ sư DevOps / Hạ tầng Cloud",
        "department": "Khối Công nghệ",
        "location": "Hà Nội",
        "employment_type": "Toàn thời gian",
        "openings": 2,
        "salary_range": "35 - 50 Triệu VNĐ",
        "experience_level": "Senior (3+ năm)",
        "deadline": "15/12/2026",
        "status": "open",
        "approval_status": "pending",
        "requisition_id": 1,
        "description": "Chịu trách nhiệm thiết kế, tự động hóa quy trình CI/CD và vận hành hạ tầng Cloud AWS/Kubernetes cho toàn bộ dịch vụ công ty.",
        "requirements": "Ít nhất 3 năm kinh nghiệm vận hành Docker, Kubernetes (EKS)\nThành thạo công cụ CI/CD (GitLab CI, GitHub Actions, ArgoCD)\nKinh nghiệm quản trị hạ tầng qua mã nguồn (Terraform)",
        "benefits": "Gói đãi ngộ cạnh tranh lên đến 50M + Thưởng hiệu quả\nBảo hiểm sức khỏe cao cấp VIP\nĐược cấp MacBook Pro M3 Max phục vụ công việc",
        "created_by": "Nguyễn Thu Hà (HR Manager)",
    },
]

SEED_AUDIT_LOGS = [
    {
        "actor_name": "System Administrator",
        "actor_email": "admin@company.com",
        "action": "user.approve",
        "target": "hr@company.com",
        "details": "Phê duyệt tài khoản Nhân sự hr@company.com",
        "ip_address": "127.0.0.1",
    },
    {
        "actor_name": "System Administrator",
        "actor_email": "admin@company.com",
        "action": "user.lock",
        "target": "skibidi@company.com",
        "details": "Khóa tài khoản skibidi@company.com - Lý do: Vi phạm chính sách bảo mật nội bộ doanh nghiệp",
        "ip_address": "127.0.0.1",
    },
    {
        "actor_name": "Nguyễn Thu Hà",
        "actor_email": "hr@company.com",
        "action": "job.create",
        "target": "Tin tuyển dụng #6",
        "details": "Tạo bài đăng 'Kỹ sư DevOps / Hạ tầng Cloud' gắn REQ #1 gửi Admin phê duyệt",
        "ip_address": "127.0.0.1",
    },
    {
        "actor_name": "System Administrator",
        "actor_email": "admin@company.com",
        "action": "system.settings_update",
        "target": "Cấu hình hệ thống",
        "details": "Cập nhật cấu hình bảo mật mật khẩu và thời gian hết hạn phiên làm việc",
        "ip_address": "127.0.0.1",
    },
]

SEED_APPLICATIONS = [
    {
        "id": 1,
        "job_id": 1,
        "candidate_name": "Phạm Hoàng Long",
        "candidate_email": "long.pham@company.com",
        "candidate_phone": "0912345678",
        "current_department": "Khối Vận hành",
        "is_internal": True,
        "referral_by": "Trần Quốc Bảo (Tech Manager)",
        "resume_filename": "CV_PhamHoangLong_DataAnalyst.pdf",
        "stage": "interview",
        "rating": 5,
        "hr_notes": "Kinh nghiệm SQL vững, đã trình bày case study tối ưu chi phí vận hành rất thuyết phục ở vòng 1.",
    },
    {
        "id": 2,
        "job_id": 1,
        "candidate_name": "Lê Mai Phương",
        "candidate_email": "phuong.le@company.com",
        "candidate_phone": "0987112233",
        "current_department": "Khối Tài chính",
        "is_internal": True,
        "referral_by": None,
        "resume_filename": "CV_LeMaiPhuong_SeniorDA.pdf",
        "stage": "screening",
        "rating": 4,
        "hr_notes": "Hồ sơ mạnh về tài chính và báo cáo Power BI, đang xếp lịch phỏng vấn chuyên môn cùng Technical Lead.",
    },
    {
        "id": 3,
        "job_id": 2,
        "candidate_name": "Vũ Thuỳ Linh",
        "candidate_email": "linh.vu@company.com",
        "candidate_phone": "0934556677",
        "current_department": "Khối Marketing",
        "is_internal": True,
        "referral_by": "Nguyễn Thu Hà (HR Recruiter)",
        "resume_filename": "Portfolio_VuThuyLinh_Comms.pdf",
        "stage": "offer",
        "rating": 5,
        "hr_notes": "Đã hoàn thành xuất sắc 2 vòng phỏng vấn. Đang chờ Giám đốc Khối ký phê duyệt mức offer.",
    },
    {
        "id": 4,
        "job_id": 3,
        "candidate_name": "Đặng Quốc Anh",
        "candidate_email": "quocanh.dang@gmail.com",
        "candidate_phone": "0977889900",
        "current_department": None,
        "is_internal": False,
        "referral_by": "Trần Thị B (Employee)",
        "resume_filename": "CV_DangQuocAnh_Product.pdf",
        "stage": "new",
        "rating": 4,
        "hr_notes": "Hồ sơ giới thiệu nhân sự nội bộ, có kinh nghiệm làm sản phẩm SaaS tại công ty cũ.",
    },
    {
        "id": 5,
        "job_id": 4,
        "candidate_name": "Hoàng Minh Tuấn",
        "candidate_email": "tuan.hoang@company.com",
        "candidate_phone": "0905123456",
        "current_department": "Khối Chăm sóc Khách hàng",
        "is_internal": True,
        "referral_by": None,
        "resume_filename": "CV_HoangMinhTuan_B2B.pdf",
        "stage": "hired",
        "rating": 5,
        "hr_notes": "Đã nhận việc thành công và chuyển bộ phận từ ngày 01/10/2026. Bàn giao công việc tốt.",
    },
    {
        "id": 6,
        "job_id": 3,
        "candidate_name": "Trương Bảo Ngọc",
        "candidate_email": "baongoc.truong@company.com",
        "candidate_phone": "0911223344",
        "current_department": "Khối Hỗ trợ",
        "is_internal": True,
        "referral_by": None,
        "resume_filename": "CV_TruongBaoNgoc.pdf",
        "stage": "rejected",
        "rating": 2,
        "hr_notes": "Chưa đáp ứng đủ kinh nghiệm quản trị vòng đời sản phẩm kỹ thuật số. Đã gửi email phản hồi động viên và lưu hồ sơ.",
    },
]

SEED_INTERVIEWS = [
    {
        "id": 1,
        "application_id": 1,
        "candidate_name": "Phạm Hoàng Long",
        "job_title": "Senior Data Analyst",
        "interview_date": "05/10/2026",
        "interview_time": "09:30 - 10:30",
        "format": "Trực tiếp",
        "location_or_link": "Phòng họp Tokyo (Tầng 8, Tòa nhà Hội sở)",
        "interviewer_names": "Nguyễn Thu Hà (HR), Trần Quốc Bảo (Tech Manager)",
        "round_name": "Vòng 2 - Đánh giá Case Study",
        "status": "scheduled",
        "feedback": "",
        "result": "pending",
    },
    {
        "id": 2,
        "application_id": 2,
        "candidate_name": "Lê Mai Phương",
        "job_title": "Senior Data Analyst",
        "interview_date": "06/10/2026",
        "interview_time": "14:00 - 15:00",
        "format": "Online",
        "location_or_link": "https://teams.microsoft.com/l/meetup-join/data-interview-102",
        "interviewer_names": "Nguyễn Thu Hà (HR Recruiter), Vũ Đức Anh (Data Lead)",
        "round_name": "Vòng 1 - Phỏng vấn Chuyên môn",
        "status": "scheduled",
        "feedback": "",
        "result": "pending",
    },
    {
        "id": 3,
        "application_id": 3,
        "candidate_name": "Vũ Thuỳ Linh",
        "job_title": "Chuyên viên Truyền thông Nội bộ",
        "interview_date": "01/10/2026",
        "interview_time": "10:00 - 11:00",
        "format": "Trực tiếp",
        "location_or_link": "Phòng họp Lotus (Tầng 5)",
        "interviewer_names": "Nguyễn Thu Hà (HR), Phạm Thanh Hương (HR Director)",
        "round_name": "Vòng 2 - Ban Giám Đốc",
        "status": "completed",
        "feedback": "Ứng viên thể hiện tầm nhìn và sự hiểu biết văn hóa công ty rất tốt. Đồng ý đề xuất tuyển dụng.",
        "result": "passed",
    },
]

SEED_REFERRALS = [
    {
        "id": 1,
        "referrer_name": "Trần Quốc Bảo",
        "referrer_email": "manager@company.com",
        "referrer_department": "Khối Công nghệ",
        "candidate_name": "Phạm Hoàng Long",
        "candidate_email": "long.pham@company.com",
        "candidate_phone": "0912345678",
        "job_title": "Senior Data Analyst",
        "relationship": "Cựu đồng nghiệp dự án BigData",
        "status": "interviewed",
        "bonus_amount": "10.000.000 VNĐ",
        "bonus_status": "pending",
        "notes": "Ứng viên đang tham gia phỏng vấn vòng 2, tiềm năng cao.",
    },
    {
        "id": 2,
        "referrer_name": "Trần Thị B",
        "referrer_email": "tranthib@company.com",
        "referrer_department": "Khối Vận hành",
        "candidate_name": "Đặng Quốc Anh",
        "candidate_email": "quocanh.dang@gmail.com",
        "candidate_phone": "0977889900",
        "job_title": "Product Specialist",
        "relationship": "Bạn học đại học",
        "status": "processing",
        "bonus_amount": "8.000.000 VNĐ",
        "bonus_status": "pending",
        "notes": "Hồ sơ mới chuyển tiếp sang phòng Nhân sự thẩm định.",
    },
    {
        "id": 3,
        "referrer_name": "Lê Văn Hùng",
        "referrer_email": "hung.le@company.com",
        "referrer_department": "Khối Kinh doanh",
        "candidate_name": "Hoàng Minh Tuấn",
        "candidate_email": "tuan.hoang@company.com",
        "candidate_phone": "0905123456",
        "job_title": "Chuyên viên Kinh doanh Doanh nghiệp",
        "relationship": "Đồng nghiệp cùng phòng",
        "status": "hired",
        "bonus_amount": "5.000.000 VNĐ",
        "bonus_status": "eligible",
        "notes": "Ứng viên đã nhận việc thành công. Đủ điều kiện nhận thưởng sau 60 ngày thử việc.",
    },
]

def seed():
    db = SessionLocal()
    try:
        print("Bắt đầu nạp dữ liệu mẫu hoàn chỉnh (Users & Recruitment Data)...")
        
        # 1. Users
        for u_data in SEED_USERS:
            user = db.query(User).filter(User.email == u_data["email"]).first()
            if not user:
                user = User(
                    email=u_data["email"],
                    hashed_password=hash_password(u_data["password"]),
                    full_name=u_data["full_name"],
                    role=u_data["role"],
                    phone=u_data["phone"],
                    account_status=u_data["account_status"],
                    is_active=u_data["is_active"],
                )
                db.add(user)
                print(f"[CREATED USER] {u_data['email']} ({u_data['role']})")
            else:
                user.hashed_password = hash_password(u_data["password"])
                user.full_name = u_data["full_name"]
                user.role = u_data["role"]
                user.phone = u_data["phone"]
                user.account_status = u_data["account_status"]
                user.is_active = u_data["is_active"]
                print(f"[UPDATED USER] {u_data['email']} ({u_data['role']})")

        # Đồng bộ mật khẩu DEFAULT_SEED_PASSWORD cho tất cả tài khoản trong hệ thống
        all_users = db.query(User).all()
        for u in all_users:
            u.hashed_password = hash_password(DEFAULT_SEED_PASSWORD)
            if u.account_status == "locked":
                u.is_active = False
            else:
                u.is_active = True
        print(f"[UNIFIED PASSWORD] Toàn bộ {len(all_users)} tài khoản trong hệ thống đã được đồng bộ mật khẩu '{DEFAULT_SEED_PASSWORD}'")

        # 2. Requisitions (Yêu cầu tuyển dụng & Chuỗi cấp duyệt mẫu)
        for r_data in SEED_REQUISITIONS:
            req = db.query(JobRequisition).filter(JobRequisition.id == r_data["id"]).first()
            if not req:
                req = JobRequisition(
                    id=r_data["id"],
                    title=r_data["title"],
                    department=r_data["department"],
                    salary_range=r_data["salary_range"],
                    openings=r_data["openings"],
                    experience_level=r_data["experience_level"],
                    reason=r_data["reason"],
                    status=r_data["status"],
                    approval_chain=r_data["approval_chain"],
                    description=r_data["description"],
                    requirements=r_data["requirements"],
                    benefits=r_data["benefits"],
                    created_by=r_data["created_by"],
                    is_converted=r_data["is_converted"],
                )
                db.add(req)
                print(f"[CREATED REQUISITION] #{r_data['id']}: {r_data['title']} (Status: {r_data['status']})")
            else:
                req.title = r_data["title"]
                req.department = r_data["department"]
                req.salary_range = r_data["salary_range"]
                req.openings = r_data["openings"]
                req.experience_level = r_data["experience_level"]
                req.reason = r_data["reason"]
                req.status = r_data["status"]
                req.approval_chain = r_data["approval_chain"]
                req.description = r_data["description"]
                req.requirements = r_data["requirements"]
                req.benefits = r_data["benefits"]
                print(f"[UPDATED REQUISITION] #{req.id}: {req.title} (Status: {req.status})")

        # 3. Jobs
        for j_data in SEED_JOBS:
            job = db.query(JobPosting).filter(JobPosting.id == j_data["id"]).first()
            if not job:
                job = JobPosting(
                    id=j_data["id"],
                    title=j_data["title"],
                    department=j_data["department"],
                    location=j_data["location"],
                    employment_type=j_data["employment_type"],
                    openings=j_data["openings"],
                    salary_range=j_data["salary_range"],
                    experience_level=j_data["experience_level"],
                    deadline=j_data["deadline"],
                    status=j_data["status"],
                    approval_status=j_data.get("approval_status", "approved"),
                    requisition_id=j_data.get("requisition_id"),
                    description=j_data["description"],
                    requirements=j_data["requirements"],
                    benefits=j_data["benefits"],
                    created_by=j_data["created_by"],
                )
                db.add(job)
                print(f"[CREATED JOB] {j_data['title']} (Approval: {j_data.get('approval_status', 'approved')})")
            else:
                job.title = j_data["title"]
                job.department = j_data["department"]
                job.status = j_data["status"]
                job.approval_status = j_data.get("approval_status", "approved")
                job.requisition_id = j_data.get("requisition_id")
                job.salary_range = j_data["salary_range"]
                job.deadline = j_data["deadline"]
                print(f"[UPDATED JOB] {j_data['title']} (Approval: {job.approval_status})")

        # 3. Applications
        for a_data in SEED_APPLICATIONS:
            app = db.query(Application).filter(Application.id == a_data["id"]).first()
            if not app:
                app = Application(
                    id=a_data["id"],
                    job_id=a_data["job_id"],
                    candidate_name=a_data["candidate_name"],
                    candidate_email=a_data["candidate_email"],
                    candidate_phone=a_data["candidate_phone"],
                    current_department=a_data["current_department"],
                    is_internal=a_data["is_internal"],
                    referral_by=a_data["referral_by"],
                    resume_filename=a_data["resume_filename"],
                    stage=a_data["stage"],
                    rating=a_data["rating"],
                    hr_notes=a_data["hr_notes"],
                )
                db.add(app)
                print(f"[CREATED CANDIDATE] {a_data['candidate_name']} ({a_data['stage']})")
            else:
                app.stage = a_data["stage"]
                app.rating = a_data["rating"]
                app.hr_notes = a_data["hr_notes"]

        # 4. Interviews
        for i_data in SEED_INTERVIEWS:
            interview = db.query(InterviewSchedule).filter(InterviewSchedule.id == i_data["id"]).first()
            if not interview:
                interview = InterviewSchedule(
                    id=i_data["id"],
                    application_id=i_data["application_id"],
                    candidate_name=i_data["candidate_name"],
                    job_title=i_data["job_title"],
                    interview_date=i_data["interview_date"],
                    interview_time=i_data["interview_time"],
                    format=i_data["format"],
                    location_or_link=i_data["location_or_link"],
                    interviewer_names=i_data["interviewer_names"],
                    round_name=i_data["round_name"],
                    status=i_data["status"],
                    feedback=i_data["feedback"],
                    result=i_data["result"],
                )
                db.add(interview)
                print(f"[CREATED INTERVIEW] {i_data['candidate_name']} - {i_data['interview_date']}")

        # 5. Referrals
        for r_data in SEED_REFERRALS:
            ref = db.query(ReferralRecord).filter(ReferralRecord.id == r_data["id"]).first()
            if not ref:
                ref = ReferralRecord(
                    id=r_data["id"],
                    referrer_name=r_data["referrer_name"],
                    referrer_email=r_data["referrer_email"],
                    referrer_department=r_data["referrer_department"],
                    candidate_name=r_data["candidate_name"],
                    candidate_email=r_data["candidate_email"],
                    candidate_phone=r_data["candidate_phone"],
                    job_title=r_data["job_title"],
                    relationship=r_data["relationship"],
                    status=r_data["status"],
                    bonus_amount=r_data["bonus_amount"],
                    bonus_status=r_data["bonus_status"],
                    notes=r_data["notes"],
                )
                db.add(ref)
                print(f"[CREATED REFERRAL] {r_data['candidate_name']} by {r_data['referrer_name']}")

        # 6. Audit Logs
        for a_log in SEED_AUDIT_LOGS:
            existing = db.query(AuditLog).filter(
                AuditLog.actor_email == a_log["actor_email"],
                AuditLog.action == a_log["action"],
                AuditLog.target == a_log["target"]
            ).first()
            if not existing:
                log_entry = AuditLog(
                    actor_name=a_log["actor_name"],
                    actor_email=a_log["actor_email"],
                    action=a_log["action"],
                    target=a_log["target"],
                    details=a_log["details"],
                    ip_address=a_log["ip_address"],
                )
                db.add(log_entry)
                print(f"[CREATED AUDIT LOG] {a_log['action']} by {a_log['actor_email']}")

        db.commit()
        print("\n Hoàn tất nạp toàn bộ seed data tuyển dụng thành công!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
