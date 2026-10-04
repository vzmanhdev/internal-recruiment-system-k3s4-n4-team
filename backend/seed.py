from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal, Base
from app.core.security import hash_password
from app.models.user import User
from app.models.hr import Department
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.job import JobPosting
from app.models.application import JobApplication, ApplicationLog
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.offer_onboarding import JobOffer, OnboardingChecklist
from app.models.referral_eval import InternalReferral

def seed_data():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        print("[INFO] Seeding Database with Bcrypt Encrypted Passwords and Data...")

        # 1. Departments
        depts_data = [
            ("Cong Nghe Thong Tin", "IT"),
            ("Nhan Su & Dao Tao", "HR"),
            ("Kinh Doanh & Phat Trien Thi Truong", "SALES"),
            ("Tai Chinh & Ke Toan", "FINANCE"),
            ("Marketing & Truyien Thong", "MKT")
        ]
        dept_objs = {}
        for name, code in depts_data:
            dept = db.query(Department).filter(Department.code == code).first()
            if not dept:
                dept = Department(name=name, code=code)
                db.add(dept)
                db.commit()
                db.refresh(dept)
            dept_objs[code] = dept

        # 2. Users with Bcrypt Hashed Passwords
        default_pwd = hash_password("admin123")
        users_seed = [
            {"email": "admin@company.com", "full_name": "Quan Tri Vien He Thong", "role": "admin", "phone": "0901234567"},
            {"email": "hrmanager@company.com", "full_name": "Nguyen Van Truong HR", "role": "hr_manager", "phone": "0912345678"},
            {"email": "truongbophan@company.com", "full_name": "Le Truong Nhom Tech", "role": "manager", "phone": "0923456789"},
            {"email": "employee@company.com", "full_name": "Pham Van Nhan Vien", "role": "employee", "phone": "0934567890"},
        ]

        user_objs = {}
        for u in users_seed:
            user = db.query(User).filter(User.email == u["email"]).first()
            if not user:
                user = User(
                    email=u["email"],
                    hashed_password=default_pwd,
                    full_name=u["full_name"],
                    phone=u["phone"],
                    role=u["role"],
                    is_active=True,
                    account_status="active"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            user_objs[u["role"]] = user

        # 3. Job Requisition
        req = db.query(JobRequisition).filter(JobRequisition.code == "REQ-2026-001").first()
        if not req:
            req = JobRequisition(
                code="REQ-2026-001",
                title="Ky Su Backend Senior (Python/FastAPI)",
                department_id=dept_objs["IT"].id,
                quantity=2,
                reason="expansion",
                reason_detail="Mo rong du an Tuyen dung Noi bo K3S4",
                priority="high",
                employment_type="Full-time",
                work_location="Ha Noi",
                min_salary=25000000,
                max_salary=35000000,
                is_salary_negotiable=False,
                target_onboard_date="2026-11-01",
                job_description="Xay dung va phat trien API FastAPI backend, thiet ke co so du lieu PostgreSQL.",
                requirements="Toi thieu 3 nam kinh nghiem Python, FastAPI, PostgreSQL, Docker.",
                benefits="Bao hiem PVI, Thuong KPI quy, Laptop Macbook Pro.",
                status="approved",
                current_approval_step="completed",
                created_by_id=user_objs["manager"].id
            )
            db.add(req)
            db.commit()
            db.refresh(req)

        # 4. Job Postings
        jobs_seed = [
            {
                "slug": "senior-python-backend-engineer",
                "title": "Senior Python Backend Engineer",
                "req_id": req.id if req else None,
                "dept_id": dept_objs["IT"].id,
                "dept_name": dept_objs["IT"].name,
                "salary": "25 - 35 Thieu",
                "type": "Full-time",
                "level": "Senior",
                "desc": "Tham gia thiet ke kien truc Backend he thong Microservices & FastAPI.",
                "reqs": "Thanh thao Python, SQLAlchemy, PostgreSQL, Docker.",
                "benefits": "Luong thang 13, Thuong du an, Du lich hang nam."
            },
            {
                "slug": "chuyen-vien-tuyen-dung-cao-cap-hr",
                "title": "Chuyen Vien Tuyen Dung Cao Cap (HR Specialist)",
                "req_id": None,
                "dept_id": dept_objs["HR"].id,
                "dept_name": dept_objs["HR"].name,
                "salary": "18 - 25 Thieu",
                "type": "Full-time",
                "level": "Mid-Level",
                "desc": "Chieu trach nhiem toan bo quy trinh tuyen dung nhan su Cong nghe & Khoi van hanh.",
                "reqs": "Co 2+ nam kinh nghiem tuyen dung Tech, giao tiep xuat sac.",
                "benefits": "Moi truong tre trung, co hoi thang tien Truong nhom."
            }
        ]

        job_objs = []
        for j in jobs_seed:
            job = db.query(JobPosting).filter(JobPosting.slug == j["slug"]).first()
            if not job:
                job = JobPosting(
                    slug=j["slug"],
                    title=j["title"],
                    requisition_id=j["req_id"],
                    department_id=j["dept_id"],
                    department_name=j["dept_name"],
                    salary_range=j["salary"],
                    type=j["type"],
                    level=j["level"],
                    description=j["desc"],
                    requirements=j["reqs"],
                    benefits=j["benefits"],
                    status="published",
                    created_by_id=user_objs["hr_manager"].id
                )
                db.add(job)
                db.commit()
                db.refresh(job)
            job_objs.append(job)

        # 5. Job Applications
        apps_seed = [
            {
                "job_id": job_objs[0].id,
                "full_name": "Nguyen Minh Hoang",
                "email": "hoang.nguyen@gmail.com",
                "phone": "0987654321",
                "company": "FPT Software",
                "position": "Backend Developer",
                "exp": 4,
                "status": "interviewing",
                "score": 85
            },
            {
                "job_id": job_objs[0].id,
                "full_name": "Tran Thi Mai",
                "email": "mai.tran@gmail.com",
                "phone": "0976543210",
                "company": "VNG Corporation",
                "position": "Software Engineer",
                "exp": 3,
                "status": "offered",
                "score": 90
            }
        ]

        for a in apps_seed:
            app = db.query(JobApplication).filter(JobApplication.email == a["email"]).first()
            if not app:
                app = JobApplication(
                    job_posting_id=a["job_id"],
                    full_name=a["full_name"],
                    email=a["email"],
                    phone=a["phone"],
                    current_company=a["company"],
                    current_position=a["position"],
                    years_of_experience=a["exp"],
                    status=a["status"],
                    score=a["score"]
                )
                db.add(app)
                db.commit()
                db.refresh(app)

        print("[SUCCESS] Database Seeding Completed Successfully! All passwords hashed with Bcrypt.")

    except Exception as e:
        print(f"[ERROR] Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
