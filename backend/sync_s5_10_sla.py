import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.db.session import SessionLocal
from app.models.master_data import SlaRule
from app.models.hr import RecruiterAssignment
from app.models.user import User
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.models.requisition import JobRequisition

def sync_sla_data():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        print("=== 1. SYNC SLA RULES ===")
        sla_rules_data = [
            ("submitted", 3),
            ("screening", 5),
            ("interviewing", 7),
            ("offered", 3),
        ]
        for stage, max_days in sla_rules_data:
            rule = db.query(SlaRule).filter(SlaRule.stage == stage).first()
            if not rule:
                rule = SlaRule(stage=stage, max_days=max_days, is_active=True)
                db.add(rule)
                print(f"Created SLA rule: {stage} -> {max_days} days")
            else:
                rule.max_days = max_days
                rule.is_active = True
                print(f"Updated SLA rule: {stage} -> {max_days} days")
        db.commit()

        print("\n=== 2. SYNC RECRUITER ASSIGNMENT ===")
        recruiter = db.query(User).filter(User.email == "recruiter@company.com").first()
        hr_manager = db.query(User).filter(User.email == "hrmanager@company.com").first()
        req = db.query(JobRequisition).first()
        
        if recruiter and req:
            assign = db.query(RecruiterAssignment).filter(
                RecruiterAssignment.requisition_id == req.id,
                RecruiterAssignment.recruiter_id == recruiter.id
            ).first()
            if not assign:
                assign = RecruiterAssignment(
                    requisition_id=req.id,
                    recruiter_id=recruiter.id,
                    assignment_type="primary"
                )
                db.add(assign)
                db.commit()
                print(f"Assigned recruiter {recruiter.email} to Requisition #{req.id}")
            else:
                print(f"Recruiter {recruiter.email} already assigned to Requisition #{req.id}")

        print("\n=== 3. SYNC REALISTIC TEST APPLICATIONS ===")
        job = db.query(JobPosting).filter(JobPosting.status == "published").first()
        if not job:
            job = db.query(JobPosting).first()

        if not job:
            print("No job posting found!")
            return

        print(f"Using JobPosting #{job.id} ({job.title})")

        apps_to_sync = [
            {
                "full_name": "Đặng Văn Long",
                "email": "long.dang@gmail.com",
                "phone": "0911223344",
                "current_company": "MISA JSC",
                "current_position": "Junior Python Developer",
                "years_of_experience": 2,
                "status": "submitted",
                "days_in_stage": 4,  # Overdue: 4 > 3
                "score": 79,
            },
            {
                "full_name": "Lê Thu Trang",
                "email": "trang.le@outlook.com",
                "phone": "0922334455",
                "current_company": "VNPT IT",
                "current_position": "Data Analyst",
                "years_of_experience": 3,
                "status": "submitted",
                "days_in_stage": 1,  # On time: 1 <= 3
                "score": 85,
            },
            {
                "full_name": "Trần Quốc Bảo",
                "email": "bao.tran@yahoo.com",
                "phone": "0933445566",
                "current_company": "Viettel Telecom",
                "current_position": "DevOps Specialist",
                "years_of_experience": 4,
                "status": "screening",
                "days_in_stage": 6,  # Overdue: 6 > 5
                "score": 83,
            },
            {
                "full_name": "Phạm Văn Nhân Viên",
                "email": "candidate@company.com",
                "phone": "0967891234",
                "current_company": "Tập đoàn FPT",
                "current_position": "Kỹ sư Phần mềm",
                "years_of_experience": 4,
                "status": "interviewing",
                "days_in_stage": 2,  # On time: 2 <= 7
                "score": 88,
            },
            {
                "full_name": "Vũ Minh Quân",
                "email": "quan.vu@techcorp.vn",
                "phone": "0977889900",
                "current_company": "Tech Corp",
                "current_position": "Senior Developer",
                "years_of_experience": 5,
                "status": "offered",
                "days_in_stage": 4,  # Overdue: 4 > 3
                "score": 90,
            },
        ]

        rules_map = {r.stage: r.max_days for r in db.query(SlaRule).filter(SlaRule.is_active == True).all()}

        for a_data in apps_to_sync:
            app = db.query(JobApplication).filter(JobApplication.email == a_data["email"]).first()
            stage_days = a_data["days_in_stage"]
            entered_at = now - timedelta(days=stage_days)
            is_overdue = stage_days > rules_map.get(a_data["status"], 3)

            if not app:
                app = JobApplication(
                    job_posting_id=job.id,
                    full_name=a_data["full_name"],
                    email=a_data["email"],
                    phone=a_data["phone"],
                    current_company=a_data["current_company"],
                    current_position=a_data["current_position"],
                    years_of_experience=a_data["years_of_experience"],
                    status=a_data["status"],
                    score=a_data["score"],
                    stage_entered_at=entered_at,
                    is_overdue=is_overdue,
                    created_at=entered_at,
                )
                db.add(app)
                print(f"Created Application: {app.full_name} ({app.status}, {stage_days} days, is_overdue={is_overdue})")
            else:
                app.job_posting_id = job.id
                app.status = a_data["status"]
                app.stage_entered_at = entered_at
                app.is_overdue = is_overdue
                print(f"Updated Application: {app.full_name} ({app.status}, {stage_days} days, is_overdue={is_overdue})")

        db.commit()
        print("\n[SUCCESS] Sync completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    sync_sla_data()
