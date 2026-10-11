"""Organisation & master data (EP-02) plus HR configuration used by EP-03/EP-05/EP-07.

Read access to active departments / job titles is open to every authenticated user (needed to create
requisitions); salary bands are only returned to HR (S2-05 AC3). All writes require HR Manager (or Admin).
"""
import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Header, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.api.deps import authenticate_bearer
from app.db.session import get_db
from app.models.user import User
from app.models.hr import ApprovalFlow, Competency, Department, HeadcountBudget, JobTitle, SharedCategory
from app.models.master_data import (
    CompetencyCriterion, CompetencyFramework, InterviewQuestion, OnboardingTemplate, SlaRule,
)
from app.models.requisition import JobRequisition
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.schemas.hr import CategoryCreate, CompetencyCreate, DepartmentCreate, JobTitleCreate, ReorderCategories
from app.services.access_scope import role_codes
from app.services.headcount_service import headcount_status

router = APIRouter()
HR_ROLES = {"hr_manager", "admin"}
APPROVAL_STEPS = {"manager", "hr", "executive"}
PIPELINE_STAGES = {"submitted", "screening", "interviewing", "offered"}


def authorize(authorization: Optional[str], db: Session) -> User:
    return require_roles(authorization, db, HR_ROLES)


def _authenticated(authorization: Optional[str], db: Session) -> User:
    user, _ = authenticate_bearer(authorization, db)
    return user


def _is_hr(db: Session, user: User) -> bool:
    return bool(role_codes(db, user) & HR_ROLES)


def _now_label() -> str:
    return datetime.utcnow().strftime("%d/%m/%Y %H:%M")


# ------------------------------------------------------------------ departments (S2-04)
class DepartmentUpdate(DepartmentCreate):
    head_user_id: Optional[int] = None


@router.get("/departments")
def list_departments(include_inactive: bool = False, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = _authenticated(authorization, db)
    q = db.query(Department)
    if not (include_inactive and _is_hr(db, user)):
        q = q.filter(Department.is_active == True)  # noqa: E712
    return [item.to_dict() for item in q.order_by(Department.sort_order, Department.name).all()]


def _validate_department(db: Session, payload, department_id: Optional[int] = None):
    if payload.parent_id:
        if payload.parent_id == department_id:
            raise HTTPException(status_code=400, detail="Phòng ban không thể là cha của chính nó")
        parent = db.query(Department).filter(Department.id == payload.parent_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Phòng ban cha không tồn tại")
        # prevent cycles in the tree
        seen, cur = {department_id}, parent
        while cur is not None and cur.parent_id:
            if cur.parent_id in seen:
                raise HTTPException(status_code=400, detail="Cấu trúc phòng ban bị vòng lặp")
            seen.add(cur.id)
            cur = db.query(Department).filter(Department.id == cur.parent_id).first()
    head = getattr(payload, "head_user_id", None)
    if head and not db.query(User.id).filter(User.id == head, User.account_status == "active").first():
        raise HTTPException(status_code=422, detail="Người phụ trách không tồn tại hoặc không hoạt động")


@router.post("/departments", status_code=status.HTTP_201_CREATED)
def create_department(payload: DepartmentUpdate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if db.query(Department).filter(Department.code == payload.code).first():
        raise HTTPException(status_code=409, detail="Mã phòng ban đã tồn tại", headers={"X-Field-Error": "code"})
    _validate_department(db, payload)
    item = Department(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()


@router.put("/departments/{department_id}")
def update_department(department_id: int, payload: DepartmentUpdate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(Department).filter(Department.id == department_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")
    dup = db.query(Department).filter(Department.code == payload.code, Department.id != department_id).first()
    if dup:
        raise HTTPException(status_code=409, detail="Mã phòng ban đã tồn tại")
    _validate_department(db, payload, department_id)
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit(); db.refresh(item)
    return item.to_dict()


@router.post("/departments/{department_id}/deactivate")
def deactivate_department(department_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(Department).filter(Department.id == department_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")
    item.is_active = False
    db.commit(); db.refresh(item)
    return item.to_dict()


@router.post("/departments/{department_id}/activate")
def activate_department(department_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(Department).filter(Department.id == department_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")
    item.is_active = True
    db.commit(); db.refresh(item)
    return item.to_dict()


@router.delete("/departments/{department_id}")
def delete_department(department_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """S2-04 AC3: a department referenced by requisitions/postings/children cannot be deleted — only deactivated."""
    authorize(authorization, db)
    item = db.query(Department).filter(Department.id == department_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")
    referenced = (
        db.query(JobRequisition.id).filter(JobRequisition.department_id == department_id).first()
        or db.query(JobPosting.id).filter(JobPosting.department_id == department_id).first()
        or db.query(Department.id).filter(Department.parent_id == department_id).first()
        or db.query(JobTitle.id).filter(JobTitle.department_id == department_id).first()
    )
    if referenced:
        raise HTTPException(status_code=409, detail="Phòng ban đang được tham chiếu (yêu cầu tuyển dụng, tin đăng, chức danh hoặc phòng ban con) — chỉ có thể ngừng áp dụng.")
    db.delete(item); db.commit()
    return {"success": True}


# ------------------------------------------------------------------ job titles & salary bands (S2-05)
@router.get("/job-titles")
def list_job_titles(department_id: Optional[int] = None, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = _authenticated(authorization, db)
    hr = _is_hr(db, user)
    q = db.query(JobTitle)
    if not hr:
        q = q.filter(JobTitle.is_active == True)  # noqa: E712
    if department_id:
        q = q.filter(JobTitle.department_id == department_id)
    items = []
    for item in q.order_by(JobTitle.name).all():
        data = item.to_dict()
        if not hr:  # salary bands are confidential to HR (S2-05 AC3)
            data.pop("min_salary", None)
            data.pop("max_salary", None)
        items.append(data)
    return items


@router.post("/job-titles", status_code=status.HTTP_201_CREATED)
def create_job_title(payload: JobTitleCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if payload.department_id and not db.query(Department).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=400, detail="Phòng ban không tồn tại")
    item = JobTitle(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()


@router.put("/job-titles/{title_id}")
def update_job_title(title_id: int, payload: JobTitleCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(JobTitle).filter(JobTitle.id == title_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy chức danh")
    if payload.department_id and not db.query(Department).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=400, detail="Phòng ban không tồn tại")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit(); db.refresh(item)
    return item.to_dict()


@router.post("/job-titles/{title_id}/deactivate")
def deactivate_job_title(title_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(JobTitle).filter(JobTitle.id == title_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy chức danh")
    item.is_active = False
    db.commit(); db.refresh(item)
    return item.to_dict()


# ------------------------------------------------------------------ legacy flat competency list
@router.get("/competencies")
def list_competencies(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return [item.to_dict() for item in db.query(Competency).order_by(Competency.category, Competency.sort_order).all()]


@router.post("/competencies", status_code=status.HTTP_201_CREATED)
def create_competency(payload: CompetencyCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = Competency(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()


# ------------------------------------------------------------------ competency frameworks (S2-06)
class CriterionIn(BaseModel):
    id: Optional[str] = None
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    weight: int = Field(..., ge=1, le=100)


class FrameworkIn(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    department: Optional[str] = None
    applied_job_titles: List[str] = Field(default_factory=list)
    criteria: List[CriterionIn] = Field(..., min_length=1)

    @field_validator("criteria")
    @classmethod
    def weights_sum_to_100(cls, criteria):
        total = sum(c.weight for c in criteria)
        if total != 100:
            raise ValueError(f"Tổng trọng số các tiêu chí phải bằng 100% (hiện tại {total}%).")
        codes = [c.code for c in criteria]
        if len(set(codes)) != len(codes):
            raise ValueError("Mã tiêu chí bị trùng trong cùng khung năng lực.")
        return criteria


def _framework_out(db: Session, fw: CompetencyFramework):
    criteria = db.query(CompetencyCriterion).filter(CompetencyCriterion.framework_id == fw.id).order_by(CompetencyCriterion.code).all()
    return fw.to_dict(criteria)


@router.get("/competency-frameworks")
def list_frameworks(job_title: Optional[str] = None, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    _authenticated(authorization, db)
    items = db.query(CompetencyFramework).order_by(CompetencyFramework.code).all()
    if job_title:
        items = [f for f in items if job_title in f.job_titles()]
    return [_framework_out(db, f) for f in items]


@router.post("/competency-frameworks", status_code=201)
def create_framework(payload: FrameworkIn, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if db.query(CompetencyFramework).filter(CompetencyFramework.code == payload.code).first():
        raise HTTPException(status_code=409, detail="Mã khung năng lực đã tồn tại")
    fw = CompetencyFramework(code=payload.code, name=payload.name, department=payload.department,
                             applied_job_titles_json=json.dumps(payload.applied_job_titles, ensure_ascii=False),
                             status="active", updated_at=_now_label())
    db.add(fw); db.flush()
    for c in payload.criteria:
        db.add(CompetencyCriterion(framework_id=fw.id, code=c.code, name=c.name, description=c.description, weight=c.weight))
    db.commit()
    return _framework_out(db, fw)


@router.put("/competency-frameworks/{framework_id}")
def update_framework(framework_id: str, payload: FrameworkIn, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Criteria are replaced; evaluations already submitted keep their own snapshot (S6-07 AC4)."""
    authorize(authorization, db)
    fw = db.query(CompetencyFramework).filter(CompetencyFramework.id == framework_id).first()
    if not fw:
        raise HTTPException(status_code=404, detail="Không tìm thấy khung năng lực")
    fw.code, fw.name, fw.department = payload.code, payload.name, payload.department
    fw.applied_job_titles_json = json.dumps(payload.applied_job_titles, ensure_ascii=False)
    fw.updated_at = _now_label()
    existing = {c.id: c for c in db.query(CompetencyCriterion).filter(CompetencyCriterion.framework_id == fw.id).all()}
    keep = set()
    for c in payload.criteria:
        if c.id and c.id in existing:
            row = existing[c.id]
            row.code, row.name, row.description, row.weight = c.code, c.name, c.description, c.weight
            keep.add(c.id)
        else:
            db.add(CompetencyCriterion(framework_id=fw.id, code=c.code, name=c.name, description=c.description, weight=c.weight))
    for cid, row in existing.items():
        if cid not in keep:
            if db.query(InterviewQuestion.id).filter(InterviewQuestion.criteria_id == cid).first():
                raise HTTPException(status_code=409, detail=f"Tiêu chí '{row.name}' đang được câu hỏi phỏng vấn tham chiếu, không xoá được.")
            db.delete(row)
    db.commit()
    return _framework_out(db, fw)


@router.post("/competency-frameworks/{framework_id}/deactivate")
def deactivate_framework(framework_id: str, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    fw = db.query(CompetencyFramework).filter(CompetencyFramework.id == framework_id).first()
    if not fw:
        raise HTTPException(status_code=404, detail="Không tìm thấy khung năng lực")
    fw.status = "inactive"
    fw.updated_at = _now_label()
    db.commit()
    return _framework_out(db, fw)


# ------------------------------------------------------------------ question bank (S2-07)
class QuestionIn(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    content: str = Field(..., min_length=5)
    criteria_id: str
    job_title: Optional[str] = None
    difficulty: str = Field("medium")
    suggested_answer: Optional[str] = None

    @field_validator("difficulty")
    @classmethod
    def difficulty_value(cls, v):
        if v not in {"easy", "medium", "hard"}:
            raise ValueError("Mức độ khó chỉ nhận easy, medium hoặc hard.")
        return v


@router.get("/interview-questions")
def list_questions(job_title: Optional[str] = None, criteria_id: Optional[str] = None, difficulty: Optional[str] = None,
                   search: Optional[str] = None, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = _authenticated(authorization, db)
    if not role_codes(db, user) & (HR_ROLES | {"recruiter", "interviewer", "hiring_manager"}):
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem ngân hàng câu hỏi.")
    q = db.query(InterviewQuestion).filter(InterviewQuestion.status == "active")
    if job_title:
        q = q.filter(InterviewQuestion.job_title.ilike(f"%{job_title}%"))
    if criteria_id:
        q = q.filter(InterviewQuestion.criteria_id == criteria_id)
    if difficulty:
        q = q.filter(InterviewQuestion.difficulty == difficulty)
    if search:
        q = q.filter(or_(InterviewQuestion.content.ilike(f"%{search}%"), InterviewQuestion.code.ilike(f"%{search}%")))
    return [x.to_dict() for x in q.order_by(InterviewQuestion.code).all()]


def _apply_question(db: Session, item: InterviewQuestion, payload: QuestionIn):
    crit = db.query(CompetencyCriterion).filter(CompetencyCriterion.id == payload.criteria_id).first()
    if not crit:
        raise HTTPException(status_code=422, detail="Câu hỏi phải gắn với một tiêu chí trong khung năng lực.")
    item.code, item.content, item.criteria_id, item.criteria_name = payload.code, payload.content, crit.id, crit.name
    item.job_title, item.difficulty, item.suggested_answer = payload.job_title, payload.difficulty, payload.suggested_answer


@router.post("/interview-questions", status_code=201)
def create_question(payload: QuestionIn, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = InterviewQuestion(code=payload.code, content=payload.content, status="active", times_used=0)
    _apply_question(db, item, payload)
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()


@router.put("/interview-questions/{question_id}")
def update_question(question_id: str, payload: QuestionIn, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(InterviewQuestion).filter(InterviewQuestion.id == question_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")
    _apply_question(db, item, payload)
    db.commit(); db.refresh(item)
    return item.to_dict()


@router.post("/interview-questions/{question_id}/deactivate")
def deactivate_question(question_id: str, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(InterviewQuestion).filter(InterviewQuestion.id == question_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")
    item.status = "inactive"
    db.commit(); db.refresh(item)
    return item.to_dict()


# ------------------------------------------------------------------ shared lookups (S2-08)
class CategoryUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    is_active: bool = True


@router.get("/categories")
def list_categories(category_type: Optional[str] = None, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    _authenticated(authorization, db)
    q = db.query(SharedCategory)
    if category_type:
        q = q.filter(SharedCategory.category_type == category_type)
    return [item.to_dict() for item in q.order_by(SharedCategory.category_type, SharedCategory.sort_order).all()]


@router.post("/categories", status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if db.query(SharedCategory.id).filter(SharedCategory.category_type == payload.category_type, SharedCategory.name == payload.name).first():
        raise HTTPException(status_code=409, detail="Giá trị danh mục đã tồn tại")
    item = SharedCategory(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()


def _category_in_use(db: Session, item: SharedCategory) -> bool:
    name = item.name
    return bool(
        db.query(JobApplication.id).filter(or_(JobApplication.source == name, JobApplication.rejection_reason == name)).first()
        or db.query(JobPosting.id).filter(or_(JobPosting.location == name, JobPosting.type == name)).first()
        or db.query(JobRequisition.id).filter(or_(JobRequisition.work_location == name, JobRequisition.employment_type == name)).first()
    )


@router.put("/categories/reorder")
def reorder_categories(payload: ReorderCategories, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    items = db.query(SharedCategory).filter(SharedCategory.id.in_(payload.ids)).all()
    by_id = {item.id: item for item in items}
    for index, item_id in enumerate(payload.ids):
        if item_id in by_id:
            by_id[item_id].sort_order = index
    db.commit()
    return [item.to_dict() for item in db.query(SharedCategory).order_by(SharedCategory.category_type, SharedCategory.sort_order).all()]


@router.put("/categories/{category_id}")
def update_category(category_id: int, payload: CategoryUpdate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(SharedCategory).filter(SharedCategory.id == category_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy giá trị danh mục")
    if payload.name != item.name and _category_in_use(db, item):
        raise HTTPException(status_code=409, detail="Giá trị đang được tham chiếu, không đổi tên được — hãy tạo giá trị mới và ngừng áp dụng giá trị cũ.")
    item.name, item.is_active = payload.name, payload.is_active
    db.commit(); db.refresh(item)
    return item.to_dict()


@router.delete("/categories/{category_id}")
def delete_category(category_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(SharedCategory).filter(SharedCategory.id == category_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy giá trị danh mục")
    if _category_in_use(db, item):
        raise HTTPException(status_code=409, detail="Giá trị đang được tham chiếu nên không xoá được (S2-08); có thể ngừng áp dụng.")
    db.delete(item); db.commit()
    return {"success": True}


# ------------------------------------------------------------------ headcount budgets (S3-04)
class HeadcountIn(BaseModel):
    department_id: int
    year: int = Field(..., ge=2000, le=2100)
    budget_quantity: int = Field(..., ge=0)


def _headcount_out(db: Session, item: HeadcountBudget):
    data = item.to_dict()
    st = headcount_status(db, item.department_id, item.year)
    data.update({"committed_quantity": st["committed"], "remaining_quantity": st["remaining"]})
    return data


@router.get("/headcounts")
def list_headcount_budgets(year: Optional[int] = None, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    q = db.query(HeadcountBudget)
    if year:
        q = q.filter(HeadcountBudget.year == year)
    return [_headcount_out(db, item) for item in q.order_by(HeadcountBudget.year.desc()).all()]


@router.get("/headcounts/status")
def get_headcount_status(department_id: int, year: Optional[int] = None, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """S3-04 AC2: shown on the new-requisition form (any authenticated user)."""
    _authenticated(authorization, db)
    return headcount_status(db, department_id, year)


@router.post("/headcounts", status_code=201)
def upsert_headcount(payload: HeadcountIn, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if not db.query(Department.id).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")
    item = db.query(HeadcountBudget).filter(HeadcountBudget.department_id == payload.department_id, HeadcountBudget.year == payload.year).first()
    if not item:
        item = HeadcountBudget(department_id=payload.department_id, year=payload.year, used_quantity=0, status="active")
        db.add(item)
    item.budget_quantity = payload.budget_quantity
    db.commit(); db.refresh(item)
    return _headcount_out(db, item)


# ------------------------------------------------------------------ approval flows (S3-01)
class ApprovalFlowIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    department_id: Optional[int] = None
    steps: List[str] = Field(..., min_length=1)
    min_salary_threshold: float = Field(0, ge=0)
    max_salary_threshold: float = Field(100_000_000_000, ge=0)

    @field_validator("steps")
    @classmethod
    def valid_steps(cls, steps):
        bad = [s for s in steps if s not in APPROVAL_STEPS]
        if bad:
            raise ValueError(f"Cấp duyệt không hợp lệ: {', '.join(bad)} (chỉ chấp nhận manager, hr, executive).")
        if len(set(steps)) != len(steps):
            raise ValueError("Một cấp duyệt không được lặp lại trong chuỗi.")
        return steps


def _validate_flow(db: Session, payload: ApprovalFlowIn):
    if payload.max_salary_threshold <= payload.min_salary_threshold:
        raise HTTPException(status_code=422, detail="Ngưỡng lương tối đa phải lớn hơn ngưỡng tối thiểu.")
    if payload.department_id and not db.query(Department.id).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=422, detail="Phòng ban không tồn tại")


@router.get("/approval-flows")
def list_approval_flows(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return [item.to_dict() for item in db.query(ApprovalFlow).order_by(ApprovalFlow.id.asc()).all()]


@router.post("/approval-flows", status_code=201)
def create_approval_flow(payload: ApprovalFlowIn, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    _validate_flow(db, payload)
    item = ApprovalFlow(name=payload.name, department_id=payload.department_id, max_levels=len(payload.steps),
                        min_salary_threshold=payload.min_salary_threshold, max_salary_threshold=payload.max_salary_threshold,
                        steps_json=json.dumps(payload.steps), status="active")
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()


@router.put("/approval-flows/{flow_id}")
def update_approval_flow(flow_id: int, payload: ApprovalFlowIn, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Running requisitions keep the chain snapshot taken at submission (S3-01 AC4)."""
    authorize(authorization, db)
    item = db.query(ApprovalFlow).filter(ApprovalFlow.id == flow_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy luồng duyệt")
    _validate_flow(db, payload)
    item.name, item.department_id = payload.name, payload.department_id
    item.steps_json, item.max_levels = json.dumps(payload.steps), len(payload.steps)
    item.min_salary_threshold, item.max_salary_threshold = payload.min_salary_threshold, payload.max_salary_threshold
    db.commit(); db.refresh(item)
    return item.to_dict()


@router.post("/approval-flows/{flow_id}/deactivate")
def deactivate_approval_flow(flow_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(ApprovalFlow).filter(ApprovalFlow.id == flow_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy luồng duyệt")
    item.status = "inactive"
    db.commit(); db.refresh(item)
    return item.to_dict()


# ------------------------------------------------------------------ onboarding templates (S7-08)
class OnboardingItemIn(BaseModel):
    task_name: str = Field(..., min_length=2)
    assigned_role: str = Field("HR")
    days_before_start: int = Field(0, ge=-30, le=60)


class OnboardingTemplateIn(BaseModel):
    name: str = Field(..., min_length=2)
    department_id: Optional[int] = None
    items: List[OnboardingItemIn] = Field(..., min_length=1)


@router.get("/onboarding-templates")
def list_onboarding_templates(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return [t.to_dict() for t in db.query(OnboardingTemplate).order_by(OnboardingTemplate.id).all()]


@router.post("/onboarding-templates", status_code=201)
def create_onboarding_template(payload: OnboardingTemplateIn, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if payload.department_id and not db.query(Department.id).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=422, detail="Phòng ban không tồn tại")
    db.query(OnboardingTemplate).filter(OnboardingTemplate.department_id == payload.department_id).update({"is_active": False})
    item = OnboardingTemplate(name=payload.name, department_id=payload.department_id,
                              items_json=json.dumps([i.model_dump() for i in payload.items], ensure_ascii=False), is_active=True)
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()


# ------------------------------------------------------------------ SLA thresholds (S5-10)
class SlaRuleIn(BaseModel):
    stage: str
    max_days: int = Field(..., ge=1, le=90)


@router.get("/sla-rules")
def list_sla_rules(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return [r.to_dict() for r in db.query(SlaRule).order_by(SlaRule.stage).all()]


@router.post("/sla-rules", status_code=201)
def upsert_sla_rule(payload: SlaRuleIn, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if payload.stage not in PIPELINE_STAGES:
        raise HTTPException(status_code=422, detail=f"Giai đoạn không hợp lệ (chỉ nhận {', '.join(sorted(PIPELINE_STAGES))}).")
    rule = db.query(SlaRule).filter(SlaRule.stage == payload.stage).first() or SlaRule(stage=payload.stage)
    rule.max_days, rule.is_active = payload.max_days, True
    db.add(rule); db.commit(); db.refresh(rule)
    return rule.to_dict()


@router.get("/people")
def list_people(role: str, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Minimal directory (id, name, email) used to pick interviewers / recruiters / onboarding owners.
    Only recruitment staff may call it and only active users are returned."""
    from app.models.rbac import Role, UserRole
    user = _authenticated(authorization, db)
    if not role_codes(db, user) & (HR_ROLES | {"recruiter", "hiring_manager", "manager"}):
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem danh bạ nhân sự.")
    if role not in {"interviewer", "recruiter", "hiring_manager", "approver", "hr_manager"}:
        raise HTTPException(status_code=422, detail="Vai trò không hợp lệ.")
    rows = (db.query(User).join(UserRole, UserRole.user_id == User.id).join(Role, Role.id == UserRole.role_id)
            .filter(Role.code == role, User.account_status == "active").order_by(User.full_name).all())
    return [{"id": u.id, "full_name": u.full_name, "email": u.email, "job_title": u.job_title} for u in rows]
