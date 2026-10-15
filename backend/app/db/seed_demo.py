"""Development demo data — explicit, idempotent, never run automatically.

Usage (development / test databases only):

    set DEMO_SEED_PASSWORD=<a password of your choice, min 10 characters>
    python -m app.db.seed_demo            # create what is missing
    python -m app.db.seed_demo --dry-run  # only report what would be created

What it does
  * Every record is identified by a stable natural key (e-mail, code, slug, tracking code), so running the command
    again creates nothing new and changes nothing.
  * Existing rows are never modified or deleted — a demo account whose e-mail already exists is left untouched
    (its password is NOT reset).
  * Demo accounts use the reserved domain ``demo.example.com`` (RFC 2606): no real person can receive their mail.
    Rows are inserted directly; no e-mail is queued and no notification e-mail is sent.
  * No password is stored in the code: the demo accounts get DEMO_SEED_PASSWORD. The password is never printed.
  * Refuses to run when APP_ENV is production, and does not create tables (run the normal migration first).
"""
import argparse
import json
import os
import sys
from datetime import date, datetime, timedelta

from sqlalchemy import inspect

from app.core.config import settings
from app.core.security import hash_password
from app.db.rbac_catalog import ROLES_DATA, ensure_permission_catalog
from app.db.session import SessionLocal, engine
import app.models  # noqa: F401  (register every model)
from app.models.application import ApplicationLog, JobApplication
from app.models.hr import Department, HeadcountBudget, JobTitle, RecruiterAssignment
from app.models.interview import InterviewInterviewer, InterviewSchedule
from app.models.job import JobPosting
from app.models.master_data import TalentPoolEntry
from app.models.notification import Notification
from app.models.offer_onboarding import JobOffer, OfferApprovalLog
from app.models.rbac import Role, UserRole
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.user import User

DOMAIN = "demo.example.com"
REQUIRED_TABLES = {"users", "roles", "user_roles", "departments", "job_titles", "job_requisitions", "job_postings",
                   "job_applications", "interview_schedules", "job_offers", "notifications", "talent_pool_entries"}

# e-mail local part -> (full name, job title, department, roles). Several accounts hold more than one role.
DEMO_USERS = {
    "hr.manager": ("Demo HR Manager", "Trưởng phòng Nhân sự", "Nhân sự", ["hr_manager", "approver", "employee"]),
    "recruiter": ("Demo Recruiter", "Chuyên viên tuyển dụng", "Nhân sự", ["recruiter", "employee"]),
    "recruiter2": ("Demo Recruiter 2", "Chuyên viên tuyển dụng", "Nhân sự", ["recruiter", "interviewer", "employee"]),
    "hiring.manager": ("Demo Hiring Manager", "Trưởng nhóm Backend", "Khối Công Nghệ (Demo)", ["hiring_manager", "interviewer", "employee"]),
    "interviewer": ("Demo Interviewer", "Kỹ sư Backend cấp cao", "Khối Công Nghệ (Demo)", ["interviewer", "employee"]),
    "approver": ("Demo Approver", "Giám đốc Khối", "Ban Giám Đốc", ["approver", "employee"]),
    "employee": ("Demo Employee", "Kỹ sư Backend", "Khối Công Nghệ (Demo)", ["employee"]),
    "candidate": ("Demo Candidate", "", "", ["candidate"]),
}


class Seeder:
    def __init__(self, db, dry_run: bool):
        self.db, self.dry_run = db, dry_run
        self.created, self.kept = [], []

    def _add(self, label: str, obj):
        self.created.append(label)
        if not self.dry_run:
            self.db.add(obj)
            self.db.flush()
        return obj

    def _keep(self, label: str, obj):
        self.kept.append(label)
        return obj

    # ------------------------------------------------------------------ people
    def roles(self) -> dict:
        roles = {r.code: r for r in self.db.query(Role).all()}
        for data in ROLES_DATA:
            if data["code"] not in roles:
                roles[data["code"]] = self._add(f"role {data['code']}", Role(code=data["code"], name=data["name"], description=data["description"]))
        if not self.dry_run:
            ensure_permission_catalog(self.db.connection())  # additive: only missing codes / grants
        return roles

    def users(self, roles: dict, password: str) -> dict:
        out = {}
        for key, (name, title, dept, codes) in DEMO_USERS.items():
            email = f"{key}@{DOMAIN}"
            user = self.db.query(User).filter(User.email == email).first()
            if user:
                out[key] = self._keep(f"user {email} (đã có — giữ nguyên)", user)
                continue
            user = self._add(f"user {email} ({', '.join(codes)})", User(
                email=email, full_name=name, hashed_password=hash_password(password), role=codes[0], is_active=True,
                account_status="active", job_title=title or None, department=dept or None, security_version=1))
            if not self.dry_run:
                for code in codes:
                    self.db.add(UserRole(user_id=user.id, role_id=roles[code].id))
            out[key] = user
        return out

    # ------------------------------------------------------------------ organisation & recruitment
    def organisation(self):
        dept = self.db.query(Department).filter(Department.code == "DEMO-TECH").first() or self._add(
            "department DEMO-TECH", Department(name="Khối Công Nghệ (Demo)", code="DEMO-TECH", sort_order=99, is_active=True))
        title = self.db.query(JobTitle).filter(JobTitle.name == "Kỹ sư Backend (Demo)").first() or self._add(
            "job title Kỹ sư Backend (Demo)", JobTitle(name="Kỹ sư Backend (Demo)", department_id=getattr(dept, "id", None), level="Senior",
                                                       min_salary=25_000_000, max_salary=40_000_000, description="[DEMO-BE]", is_active=True))
        year = date.today().year
        if getattr(dept, "id", None) and not self.db.query(HeadcountBudget).filter(HeadcountBudget.department_id == dept.id, HeadcountBudget.year == year).first():
            self._add(f"headcount {year} DEMO-TECH", HeadcountBudget(department_id=dept.id, year=year, budget_quantity=6, used_quantity=0, status="active"))
        return dept, title

    def requisitions(self, dept, title, u: dict):
        def req(code, status, step_index, **extra):
            row = self.db.query(JobRequisition).filter(JobRequisition.code == code).first()
            if row:
                return self._keep(f"requisition {code}", row)
            return self._add(f"requisition {code} ({status})", JobRequisition(
                code=code, title="Kỹ sư Backend (Demo)", department_id=getattr(dept, "id", 0), job_title_id=getattr(title, "id", None),
                job_title_name="Kỹ sư Backend (Demo)", quantity=2, reason="expansion", priority="high", employment_type="Full-time",
                work_location="Hà Nội", min_salary=25_000_000, max_salary=40_000_000,
                target_onboard_date=(date.today() + timedelta(days=45)).isoformat(),
                job_description="Phát triển API tuyển dụng nội bộ (dữ liệu demo).", requirements="- Python, FastAPI\n- SQL",
                benefits="- Theo chính sách công ty", status=status, current_approval_step="completed" if status == "approved" else "hr",
                approval_chain_json=json.dumps(["manager", "hr"]), approval_step_index=step_index,
                created_by_id=getattr(u["hiring.manager"], "id", 0), **extra))

        approved = req("REQ-DEMO-01", "approved", 2)
        pending = req("REQ-DEMO-02", "pending_hr", 1)
        if not self.dry_run and "requisition REQ-DEMO-01 (approved)" in self.created:
            self.db.add(RequisitionApprovalLog(requisition_id=approved.id, approver_id=u["hiring.manager"].id, step_name="Trưởng Khối Duyệt",
                                               action="approved", comment="Dữ liệu demo"))
            self.db.add(RequisitionApprovalLog(requisition_id=approved.id, approver_id=u["hr.manager"].id, step_name="HR Manager Phê Duyệt",
                                               action="approved", comment="Dữ liệu demo"))
            self.db.add(RecruiterAssignment(requisition_id=approved.id, recruiter_id=u["recruiter"].id, assignment_type="primary"))
        if not self.dry_run and "requisition REQ-DEMO-02 (pending_hr)" in self.created:
            self.db.add(RequisitionApprovalLog(requisition_id=pending.id, approver_id=u["hiring.manager"].id, step_name="Trưởng Khối Duyệt",
                                               action="approved", comment="Dữ liệu demo"))
        return approved

    def posting(self, req, dept, u: dict):
        row = self.db.query(JobPosting).filter(JobPosting.slug == "demo-ky-su-backend").first()
        if row:
            return self._keep("job posting demo-ky-su-backend", row)
        return self._add("job posting demo-ky-su-backend (published)", JobPosting(
            slug="demo-ky-su-backend", title="Kỹ sư Backend (Demo)", requisition_id=getattr(req, "id", None),
            department_id=getattr(dept, "id", 0), department_name="Khối Công Nghệ (Demo)", location="Hà Nội", type="Full-time",
            level="Senior", salary_range="25 - 40 Triệu", deadline=(date.today() + timedelta(days=30)).isoformat(),
            description="Tin tuyển dụng dữ liệu demo — xây dựng API cho hệ thống tuyển dụng nội bộ.",
            requirements="- 3 năm kinh nghiệm Python\n- FastAPI, SQL", benefits="- Theo chính sách công ty",
            status="published", created_by_id=getattr(u["recruiter"], "id", 0), published_by_id=getattr(u["hr.manager"], "id", None),
            published_at=datetime.utcnow(), min_years_experience=3, required_skills_json=json.dumps(["python", "fastapi"])))

    def applications(self, posting, u: dict):
        now = datetime.utcnow()
        plan = [  # tracking code, name, local part, status, days ago, candidate account?
            ("DEMO-0001", "Ứng viên Demo Một", "ungvien1", "submitted", 1, None),
            ("DEMO-0002", "Ứng viên Demo Hai", "ungvien2", "screening", 4, None),
            ("DEMO-0003", "Ứng viên Demo Ba", "ungvien3", "interviewing", 6, None),
            ("DEMO-0004", "Ứng viên Demo Bốn", "ungvien4", "offered", 12, None),
            ("DEMO-0005", "Ứng viên Demo Năm", "ungvien5", "rejected", 20, None),
            ("DEMO-0006", "Demo Candidate", "candidate", "interviewing", 8, "candidate"),
        ]
        apps = {}
        for code, name, local, status, ago, account in plan:
            row = self.db.query(JobApplication).filter(JobApplication.tracking_code == code).first()
            if row:
                apps[code] = self._keep(f"application {code}", row)
                continue
            email = f"{local}@{DOMAIN}"
            apps[code] = self._add(f"application {code} ({status})", JobApplication(
                job_posting_id=getattr(posting, "id", 0), candidate_id=getattr(u.get(account), "id", None) if account else None,
                full_name=name, email=email, phone="0900000000", current_position="Python developer", years_of_experience=4,
                status=status, tracking_code=code, source="Cổng tuyển dụng", person_key=email, rating=4 if status != "rejected" else 2,
                rejection_reason="Chưa phù hợp thời điểm (demo)" if status == "rejected" else None,
                match_score=80, meets_requirements=True, created_at=now - timedelta(days=ago), stage_entered_at=now - timedelta(days=min(ago, 3))))
            if not self.dry_run:
                self.db.add(ApplicationLog(application_id=apps[code].id, changed_by_id=u["recruiter"].id, from_status=None,
                                           to_status=status, comment="Dữ liệu demo"))
        return apps

    def interviews_offers_pool(self, apps: dict, u: dict):
        when = datetime.now().replace(minute=0, second=0, microsecond=0) + timedelta(days=2, hours=1)
        for code, round_name, shift in (("DEMO-0003", "Vòng 1: Phỏng vấn chuyên môn (Demo)", 0), ("DEMO-0006", "Vòng 1: Phỏng vấn chuyên môn (Demo)", 2)):
            app = apps[code]
            exists = getattr(app, "id", None) and self.db.query(InterviewSchedule).filter(InterviewSchedule.application_id == app.id).first()
            if exists:
                self._keep(f"interview for {code}", exists)
                continue
            iv = self._add(f"interview for {code}", InterviewSchedule(
                application_id=getattr(app, "id", 0), round_number=1, round_name=round_name, scheduled_time=when + timedelta(hours=shift),
                duration_minutes=60, location="Phòng họp Demo", status="scheduled", created_by_id=getattr(u["recruiter"], "id", 0)))
            if not self.dry_run:
                self.db.add(InterviewInterviewer(interview_id=iv.id, interviewer_id=u["interviewer"].id))
                self.db.add(InterviewInterviewer(interview_id=iv.id, interviewer_id=u["hiring.manager"].id, role_in_interview="Người phỏng vấn phụ"))

        offered = apps["DEMO-0004"]
        offer = getattr(offered, "id", None) and self.db.query(JobOffer).filter(JobOffer.application_id == offered.id).first()
        if offer:
            self._keep("offer for DEMO-0004", offer)
        else:
            offer = self._add("offer for DEMO-0004 (pending_approval)", JobOffer(
                application_id=getattr(offered, "id", 0), offered_salary=32_000_000, start_date=(date.today() + timedelta(days=30)).isoformat(),
                work_location="Hà Nội", status="pending_approval", approval_level="hr_manager",
                response_deadline=(date.today() + timedelta(days=10)).isoformat(), created_by_id=getattr(u["recruiter"], "id", 0)))
            if not self.dry_run:
                self.db.add(OfferApprovalLog(offer_id=offer.id, actor_id=u["recruiter"].id, action="submitted", comment="Dữ liệu demo"))

        rejected = apps["DEMO-0005"]
        if not self.db.query(TalentPoolEntry).filter(TalentPoolEntry.person_key == f"ungvien5@{DOMAIN}").first():
            self._add("talent pool entry ungvien5", TalentPoolEntry(
                person_key=f"ungvien5@{DOMAIN}", application_id=getattr(rejected, "id", None), full_name="Ứng viên Demo Năm",
                email=f"ungvien5@{DOMAIN}", phone="0900000000", interested_title="Kỹ sư Backend", skills="Python, SQL",
                reason="Ứng viên tốt, giữ liên lạc (demo)", added_by_id=getattr(u["recruiter"], "id", None)))

    def notifications(self, u: dict):
        samples = [
            ("hr.manager", "approval_pending", "Tờ trình REQ-DEMO-02 chờ bạn duyệt", "/hr/requisitions"),
            ("interviewer", "interview_invited", "Lời mời phỏng vấn: Ứng viên Demo Ba", "/interviewer"),
            ("recruiter", "recruiter_assigned", "Bạn được phân công REQ-DEMO-01", "/recruiter/jobs"),
        ]
        for key, ntype, title, link in samples:
            user = u[key]
            if getattr(user, "id", None) and self.db.query(Notification).filter(Notification.recipient_id == user.id, Notification.title == title).first():
                continue
            self._add(f"notification '{title}'", Notification(recipient_id=getattr(user, "id", 0), type=ntype, title=title,
                                                             message="Thông báo dữ liệu demo", link=link))


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Seed development demo data (idempotent).")
    parser.add_argument("--dry-run", action="store_true", help="only report what would be created")
    args = parser.parse_args(argv)
    for stream in (sys.stdout, sys.stderr):  # Vietnamese messages on a Windows console
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")

    if settings.is_production or settings.APP_ENV.strip().lower() not in {"development", "dev", "test", "local"}:
        print(f"[seed_demo] Từ chối chạy: APP_ENV='{settings.APP_ENV}'. Chỉ dùng cho môi trường development/test.")
        return 2
    missing = REQUIRED_TABLES - set(inspect(engine).get_table_names())
    if missing:
        print(f"[seed_demo] Thiếu bảng {sorted(missing)} — hãy chạy migration (alembic upgrade head) trước.")
        return 2
    password = os.environ.get("DEMO_SEED_PASSWORD", "")
    if not args.dry_run and len(password) < 10:
        print("[seed_demo] Hãy đặt biến môi trường DEMO_SEED_PASSWORD (tối thiểu 10 ký tự) cho các tài khoản demo.")
        return 2

    db = SessionLocal()
    try:
        s = Seeder(db, args.dry_run)
        roles = s.roles()
        users = s.users(roles, password)
        dept, title = s.organisation()
        req = s.requisitions(dept, title, users)
        posting = s.posting(req, dept, users)
        apps = s.applications(posting, users)
        s.interviews_offers_pool(apps, users)
        s.notifications(users)
        if args.dry_run:
            db.rollback()
        else:
            db.commit()
        print(f"[seed_demo] {'(dry-run) sẽ tạo' if args.dry_run else 'Đã tạo'} {len(s.created)} bản ghi; giữ nguyên {len(s.kept)} bản ghi đã có.")
        for line in s.created:
            print(f"  + {line}")
        for line in s.kept:
            print(f"  = {line}")
        print(f"[seed_demo] Tài khoản demo: <vai trò>@{DOMAIN} — mật khẩu là giá trị DEMO_SEED_PASSWORD bạn đã đặt (không in ra).")
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
