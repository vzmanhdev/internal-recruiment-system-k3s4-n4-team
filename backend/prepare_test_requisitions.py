# encoding: utf-8
import sys
from app.db.session import SessionLocal
from app.models.requisition import JobRequisition, RequisitionApprovalLog

db = SessionLocal()

test_items = [
    {
        "code": "REQ-TEST-01",
        "title": "Chuyên Viên QA Automation (Kiểm Thử Duyệt)",
        "status": "pending_manager",
        "current_approval_step": "manager",
    },
    {
        "code": "REQ-TEST-02",
        "title": "Kỹ Sư DevOps Cloud (Kiểm Thử Bổ Sung)",
        "status": "pending_manager",
        "current_approval_step": "manager",
    },
    {
        "code": "REQ-TEST-03",
        "title": "Chuyên Viên UI/UX Designer (Kiểm Thử Từ Chối)",
        "status": "pending_manager",
        "current_approval_step": "manager",
    },
]

for item in test_items:
    existing = db.query(JobRequisition).filter_by(code=item["code"]).first()
    if not existing:
        existing = JobRequisition(
            code=item["code"],
            title=item["title"],
            department_id=1,
            quantity=1,
            min_salary=18000000,
            max_salary=28000000,
            reason="expansion",
            reason_detail="Tăng cường quy mô nhóm dự án quý này",
            priority="urgent",
            employment_type="Full-time",
            work_location="Hà Nội",
            target_onboard_date="2026-11-30",
            job_description="Phụ trách xây dựng và thực thi các kịch bản kiểm thử tự động, tích hợp CI/CD.",
            requirements="Thành thạo TypeScript, Python, Playwright/Selenium và có tư duy logic tốt.",
            benefits="Lương thưởng hấp dẫn, bảo hiểm sức khỏe toàn diện, cơ hội thăng tiến rõ ràng.",
            status=item["status"],
            current_approval_step=item["current_approval_step"],
            approval_chain_json='["manager", "hr"]',
            approval_step_index=0,
            created_by_id=1,
        )
        db.add(existing)
        print(f"Created {item['code']}")
    else:
        existing.title = item["title"]
        existing.status = item["status"]
        existing.current_approval_step = item["current_approval_step"]
        existing.approval_step_index = 0
        existing.reject_reason = None
        # Clean old logs for clean testing
        db.query(RequisitionApprovalLog).filter_by(requisition_id=existing.id).delete()
        print(f"Reset {item['code']}")

db.commit()
print("All 3 test requisitions ready in pending_manager status.")
db.close()
