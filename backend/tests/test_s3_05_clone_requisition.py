"""
Test suite for SCRUM-73 / S3-05:
'Là Trưởng bộ phận, tôi muốn sao chép một yêu cầu tuyển dụng đã có để tạo yêu cầu mới,
để tuyển thêm vị trí giống lần trước mà không phải viết lại mô tả công việc.'

Acceptance Criteria & Test Cases:
- TC-S3-05-01 (S3-05-AC01): Sao chép toàn bộ mô tả công việc và yêu cầu ứng viên:
  job_description, requirements, benefits, min_salary, max_salary, is_salary_negotiable,
  department_id, job_title_id, work_location, priority, employment_type.
- TC-S3-05-02 (S3-05-AC02): Bản sao luôn bắt đầu ở trạng thái Nháp ('draft'),
  không kế thừa lịch sử duyệt (approval_logs rỗng), sinh mã tờ trình mới độc nhất (code),
  không kế thừa chuyên viên tuyển dụng phụ trách (recruiter_assignments rỗng).
- TC-S3-05-X01: Không thừa hưởng token duyệt hoặc phê duyệt cũ, bảo mật phân quyền phòng ban:
  Trưởng bộ phận không thể sao chép tờ trình của bộ phận khác mà mình không có quyền xem (403 Forbidden).
"""

from datetime import date, timedelta, datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.main import app
from app.db.session import Base, get_db
from app.db.seed_rbac import ROLES_DATA, PERMISSIONS_DATA, DEFAULT_GRANTED_MATRIX
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.audit import Permission, RolePermission, AuditLog
from app.models.hr import Department, JobTitle, RecruiterAssignment
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.notification import Notification
from app.core.security import hash_password
from tests.conftest import session_token

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed Roles
    roles = {}
    for r in ROLES_DATA:
        existing = db.query(Role).filter(Role.code == r["code"]).first()
        if not existing:
            existing = Role(code=r["code"], name=r["name"])
            db.add(existing)
            db.commit()
            db.refresh(existing)
        roles[r["code"]] = existing

    # Seed Permissions
    seen_p = set()
    for p in PERMISSIONS_DATA:
        if p["code"] not in seen_p:
            existing_p = db.query(Permission).filter(Permission.code == p["code"]).first()
            if not existing_p:
                existing_p = Permission(code=p["code"], name=p["name"], module=p["module"])
                db.add(existing_p)
            seen_p.add(p["code"])
    db.commit()

    for role_code, granted in DEFAULT_GRANTED_MATRIX.items():
        for p_code in seen_p:
            existing_rp = db.query(RolePermission).filter(
                RolePermission.role_code == role_code,
                RolePermission.permission_code == p_code
            ).first()
            if not existing_rp:
                db.add(RolePermission(role_code=role_code, permission_code=p_code, is_granted=p_code in granted))
    db.commit()

    # Seed test users
    user_specs = [
        ("hm", "hiring_manager", "Trưởng Bộ Phận IT"),
        ("hm_other", "hiring_manager", "Trưởng Bộ Phận Marketing"),
        ("hrm", "hr_manager", "HR Manager"),
        ("recruiter", "recruiter", "Chuyên Viên Tuyển Dụng"),
        ("candidate", "candidate", "Ứng Viên"),
    ]
    for key, role, name in user_specs:
        u = db.query(User).filter(User.email == f"{key}@test.com").first()
        if not u:
            u = User(
                email=f"{key}@test.com",
                full_name=name,
                hashed_password=hash_password("Password123"),
                role=role,
                is_active=True,
                account_status="active",
                security_version=1,
            )
            db.add(u)
            db.flush()
            db.add(UserRole(user_id=u.id, role_id=roles[role].id))
            db.commit()

    # Seed test departments
    dept_it = db.query(Department).filter(Department.code == "IT").first()
    if not dept_it:
        dept_it = Department(code="IT", name="Phòng Công Nghệ Thông Tin", is_active=True)
        db.add(dept_it)
    dept_mkt = db.query(Department).filter(Department.code == "MKT").first()
    if not dept_mkt:
        dept_mkt = Department(code="MKT", name="Phòng Marketing", is_active=True)
        db.add(dept_mkt)
    db.commit()

    # Seed test job title
    title = db.query(JobTitle).filter(JobTitle.name == "Senior Backend Engineer").first()
    if not title:
        title = JobTitle(
            name="Senior Backend Engineer",
            department_id=dept_it.id,
            min_salary=20000000,
            max_salary=45000000,
            level="Senior",
            is_active=True
        )
        db.add(title)
        db.commit()

    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


def test_tc_s3_05_01_and_02_clone_requisition_success():
    """
    TC-S3-05-01 & TC-S3-05-02:
    - Sao chép toàn bộ mô tả công việc (job_description), yêu cầu ứng viên (requirements),
      quyền lợi (benefits), dải lương, vị trí, chức danh chuẩn.
    - Bản sao luôn bắt đầu ở trạng thái Nháp ('draft'), mã code mới, lịch sử duyệt rỗng,
      không kế thừa recruiter phụ trách.
    """
    db = TestingSessionLocal()
    hm = db.query(User).filter(User.email == "hm@test.com").first()
    rec = db.query(User).filter(User.email == "recruiter@test.com").first()
    dept = db.query(Department).filter(Department.code == "IT").first()
    title = db.query(JobTitle).filter(JobTitle.name == "Senior Backend Engineer").first()

    # Tạo một yêu cầu gốc đã được duyệt và có đầy đủ JD, tiêu chuẩn, recruiter, log duyệt
    source_req = JobRequisition(
        code="REQ-2026-001",
        title="Senior Python Backend Developer",
        department_id=dept.id,
        job_title_id=title.id,
        job_title_name=title.name,
        quantity=3,
        reason="expansion",
        reason_detail="Mở rộng dự án ATS Q2/2026",
        priority="high",
        employment_type="Full-time",
        work_location="Tầng 5, Tòa Nhà Keangnam, Hà Nội",
        min_salary=25000000,
        max_salary=40000000,
        is_salary_negotiable=True,
        target_onboard_date=(date.today() + timedelta(days=45)).isoformat(),
        job_description="Phát triển hệ thống microservices ATS bằng FastAPI, PostgreSQL và Redis.",
        requirements="Tối thiểu 3 năm kinh nghiệm Python, thành thạo Docker và CI/CD.",
        benefits="Thưởng dự án, bảo hiểm sức khỏe PTI, 15 ngày phép/năm, phụ cấp ăn trưa.",
        salary_justification="Dải lương chuẩn theo vị trí Senior",
        status="approved",
        current_approval_step="approved",
        approval_chain_json='["manager", "hr"]',
        approval_step_index=2,
        created_by_id=hm.id,
    )
    db.add(source_req)
    db.commit()
    db.refresh(source_req)

    # Thêm lịch sử duyệt cho yêu cầu gốc
    db.add(RequisitionApprovalLog(
        requisition_id=source_req.id,
        approver_id=hm.id,
        step_code="manager",
        step_name="Trưởng bộ phận duyệt",
        action="approved",
        comment="Đồng ý đề xuất tuyển dụng.",
    ))
    # Phân công chuyên viên tuyển dụng cho yêu cầu gốc
    db.add(RecruiterAssignment(
        requisition_id=source_req.id,
        recruiter_id=rec.id,
        assignment_type="primary"
    ))
    db.commit()

    token = session_token(db, hm)

    # 1. Gọi endpoint clone: POST /api/v1/requisitions/{source_id}/clone
    res = client.post(
        f"/api/v1/requisitions/{source_req.id}/clone",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Senior Python Backend Developer (Đợt 2)",
            "quantity": 2
        }
    )

    assert res.status_code == 201, f"Expected 201 Created, got {res.status_code}: {res.text}"
    data = res.json()

    # Xác thực AC1 (TC-S3-05-01): Sao chép toàn bộ mô tả công việc, yêu cầu, quyền lợi, lương
    assert data["job_description"] == source_req.job_description
    assert data["requirements"] == source_req.requirements
    assert data["benefits"] == source_req.benefits
    assert data["min_salary"] == source_req.min_salary
    assert data["max_salary"] == source_req.max_salary
    assert data["is_salary_negotiable"] == source_req.is_salary_negotiable
    assert data["department_id"] == source_req.department_id
    assert data["job_title_id"] == source_req.job_title_id
    assert data["job_title_name"] == source_req.job_title_name
    assert data["work_location"] == source_req.work_location
    assert data["priority"] == source_req.priority
    assert data["employment_type"] == source_req.employment_type
    assert data["title"] == "Senior Python Backend Developer (Đợt 2)"
    assert data["quantity"] == 2

    # Xác thực AC2 (TC-S3-05-02):
    # - Mã tờ trình mới khác biệt mã gốc
    assert data["code"] != source_req.code
    assert data["code"].startswith("REQ-")
    # - Bản sao luôn bắt đầu ở trạng thái Nháp (draft)
    assert data["status"] == "draft"
    assert data["current_approval_step"] == "draft"
    assert data["approval_step_index"] == 0
    assert data["created_by_id"] == hm.id

    # - Kiểm tra tầng Database: Lịch sử duyệt rỗng & Không thừa hưởng phân công recruiter
    cloned_db = db.query(JobRequisition).filter(JobRequisition.id == data["id"]).first()
    assert cloned_db is not None
    logs_count = db.query(RequisitionApprovalLog).filter(RequisitionApprovalLog.requisition_id == cloned_db.id).count()
    assert logs_count == 0, f"Expected 0 approval logs for cloned draft, found {logs_count}"

    recruiters_count = db.query(RecruiterAssignment).filter(RecruiterAssignment.requisition_id == cloned_db.id).count()
    assert recruiters_count == 0, f"Expected 0 recruiter assignments for cloned draft, found {recruiters_count}"

    # - Kiểm tra AuditLog được ghi lại
    audit = db.query(AuditLog).filter(
        AuditLog.action == "REQUISITION_CLONE",
        AuditLog.target_id == str(cloned_db.id)
    ).first()
    assert audit is not None, "AuditLog for REQUISITION_CLONE must be recorded"

    # - Kiểm tra Notification thông báo cho người thực hiện
    notif = db.query(Notification).filter(
        Notification.recipient_id == hm.id,
        Notification.entity_id == cloned_db.id
    ).first()
    assert notif is not None, "Notification must be sent to the creator"
    assert source_req.code in notif.title

    db.close()


def test_tc_s3_05_copy_alias_endpoint():
    """
    Kiểm tra tính tương thích: Endpoint /copy hoạt động tương đương endpoint /clone
    mà không cần truyền payload (sao chép 100% dữ liệu gốc kèm hậu tố '(Bản sao)').
    """
    db = TestingSessionLocal()
    hm = db.query(User).filter(User.email == "hm@test.com").first()
    dept = db.query(Department).filter(Department.code == "IT").first()

    source_req = JobRequisition(
        code="REQ-2026-002",
        title="DevOps Engineer",
        department_id=dept.id,
        quantity=1,
        reason="replacement",
        min_salary=20000000,
        max_salary=35000000,
        job_description="Quản trị cụm Kubernetes và Terraform.",
        requirements="Chứng chỉ CKA, 2 năm kinh nghiệm GCP/AWS.",
        benefits="Lương tháng 13, cấp Macbook Pro M3.",
        status="approved",
        created_by_id=hm.id,
    )
    db.add(source_req)
    db.commit()

    token = session_token(db, hm)

    res = client.post(
        f"/api/v1/requisitions/{source_req.id}/copy",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "DevOps Engineer (Bản sao)"
    assert data["job_description"] == source_req.job_description
    assert data["requirements"] == source_req.requirements
    assert data["status"] == "draft"

    db.close()


def test_tc_s3_05_x01_security_unauthorized_department_scoping():
    """
    TC-S3-05-X01:
    - Bảo mật phân quyền: Người dùng không có quyền xem tờ trình của người khác/phòng ban khác
      sẽ bị chặn 403 Forbidden khi cố sao chép.
    - Ứng viên không có quyền requisition:create bị chặn 403.
    """
    db = TestingSessionLocal()
    hm_it = db.query(User).filter(User.email == "hm@test.com").first()
    hm_mkt = db.query(User).filter(User.email == "hm_other@test.com").first()
    candidate = db.query(User).filter(User.email == "candidate@test.com").first()
    dept_it = db.query(Department).filter(Department.code == "IT").first()

    # Tờ trình mật của phòng IT do hm_it tạo
    private_req = JobRequisition(
        code="REQ-2026-SECRET",
        title="Security Analyst Lead",
        department_id=dept_it.id,
        quantity=1,
        status="approved",
        created_by_id=hm_it.id,
    )
    db.add(private_req)
    db.commit()

    token_mkt = session_token(db, hm_mkt)
    token_candidate = session_token(db, candidate)

    # 1. hm_mkt (không sở hữu tờ trình và không phụ trách) cố tình clone -> 403 Forbidden
    res_mkt = client.post(
        f"/api/v1/requisitions/{private_req.id}/clone",
        headers={"Authorization": f"Bearer {token_mkt}"}
    )
    assert res_mkt.status_code == 403, f"Expected 403 Forbidden for unauthorized user, got {res_mkt.status_code}"

    # 2. Ứng viên cố tình gọi API clone -> 403 Forbidden
    res_cand = client.post(
        f"/api/v1/requisitions/{private_req.id}/clone",
        headers={"Authorization": f"Bearer {token_candidate}"}
    )
    assert res_cand.status_code == 403

    # 3. Yêu cầu không tồn tại -> 404 Not Found
    token_it = session_token(db, hm_it)
    res_404 = client.post(
        "/api/v1/requisitions/99999/clone",
        headers={"Authorization": f"Bearer {token_it}"}
    )
    assert res_404.status_code == 404

    db.close()


def test_tc_s3_05_date_validation_in_past_rejected():
    """
    Kiểm tra validation khi sao chép: Nếu người dùng truyền ngày cần người ở quá khứ,
    hệ thống từ chối với lỗi 422.
    """
    db = TestingSessionLocal()
    hm = db.query(User).filter(User.email == "hm@test.com").first()
    dept = db.query(Department).filter(Department.code == "IT").first()

    source_req = JobRequisition(
        code="REQ-2026-VAL",
        title="Frontend Developer",
        department_id=dept.id,
        quantity=1,
        status="draft",
        created_by_id=hm.id,
    )
    db.add(source_req)
    db.commit()

    token = session_token(db, hm)

    # Truyền target_onboard_date ở quá khứ
    past_date = (date.today() - timedelta(days=10)).isoformat()
    res = client.post(
        f"/api/v1/requisitions/{source_req.id}/clone",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_onboard_date": past_date}
    )
    assert res.status_code == 422
    assert "quá khứ" in res.text

    db.close()
