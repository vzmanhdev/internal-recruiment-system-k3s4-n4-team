"""Organisation & master data (EP-02) plus HR configuration used by EP-03/EP-05/EP-07.

Read access to active departments / job titles is open to every authenticated user (needed to create
requisitions); salary bands are only returned to HR (S2-05 AC3). All writes require HR Manager (or Admin).
"""
import json
import math
import re
from datetime import datetime
from typing import List, Optional, Union, Tuple

from fastapi import APIRouter, Header, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.api.deps import authenticate_bearer
from app.db.session import get_db
from app.models.user import User
from app.models.hr import ApprovalFlow, ApprovalFlowVersion, Competency, Department, HeadcountBudget, JobTitle, SharedCategory
from app.models.rbac import Role
from app.models.audit import AuditLog
from app.models.master_data import (
    CompetencyCriterion, CompetencyFramework, InterviewQuestion, OnboardingTemplate, SlaRule,
)
from app.models.requisition import JobRequisition
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.schemas.hr import CategoryCreate, CompetencyCreate, DepartmentCreate, JobTitleCreate, ReorderCategories
from app.services.access_scope import has_permission, require_any_permission
from app.services.headcount_service import headcount_status
from app.core.search import build_search_filter, build_search_score

router = APIRouter()
APPROVAL_STEPS = {"manager", "hr", "executive"}
PIPELINE_STAGES = {"submitted", "screening", "interviewing", "offered"}


def authorize(authorization: Optional[str], db: Session) -> User:
    """Master-data writes need the master_data:manage permission (admin: full allow)."""
    user = _authenticated(authorization, db)
    require_any_permission(db, user, "master_data:manage")
    return user


def _authenticated(authorization: Optional[str], db: Session) -> User:
    user, _ = authenticate_bearer(authorization, db)
    return user


def _is_hr(db: Session, user: User) -> bool:
    """May see inactive master data and salary bands (S2-05 AC3)."""
    return has_permission(db, user, "master_data:manage") or has_permission(db, user, "candidate:view_salary")


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
    rows = q.order_by(Department.sort_order, Department.name).all()
    # read-only context for the organisation tree: head's name, active members, open (published) postings
    heads = {u.id: u.full_name for u in db.query(User).filter(User.id.in_({d.head_user_id for d in rows if d.head_user_id} or {-1})).all()}
    out = []
    for d in rows:
        data = d.to_dict()
        data["head_name"] = heads.get(d.head_user_id)
        data["member_count"] = db.query(User.id).filter(User.department == d.name, User.account_status == "active").count()
        data["open_positions"] = db.query(JobPosting.id).filter(JobPosting.department_id == d.id, JobPosting.status == "published").count()
        out.append(data)
    return out


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
    category: Optional[str] = Field(default=None, max_length=60)
    benchmark_low: Optional[str] = None
    benchmark_mid: Optional[str] = None
    benchmark_high: Optional[str] = None


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
        db.add(CompetencyCriterion(framework_id=fw.id, **c.model_dump(exclude={"id"})))
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
            for field, value in c.model_dump(exclude={"id"}).items():
                setattr(row, field, value)
            keep.add(c.id)
        else:
            db.add(CompetencyCriterion(framework_id=fw.id, **c.model_dump(exclude={"id"})))
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
    if not (has_permission(db, user, "interview:view") or has_permission(db, user, "master_data:manage")):
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem ngân hàng câu hỏi.")
    q = db.query(InterviewQuestion).filter(InterviewQuestion.status == "active")
    if job_title:
        q = q.filter(InterviewQuestion.job_title.ilike(f"%{job_title}%"))
    if criteria_id:
        q = q.filter(InterviewQuestion.criteria_id == criteria_id)
    if difficulty:
        q = q.filter(InterviewQuestion.difficulty == difficulty)
    if search and search.strip():
        search_cols = [InterviewQuestion.content, InterviewQuestion.code, InterviewQuestion.job_title]
        q = q.filter(build_search_filter(search_cols, search.strip()))
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


def _canonical_approval_type(name: str) -> str:
    nl = name.lower()
    if "headcount" in nl or "ngân sách" in nl or "định biên" in nl:
        return "headcount"
    if "salary" in nl or "ngoại lệ" in nl or "lương" in nl:
        return "salary_exception"
    if "offer" in nl or "thư mời" in nl:
        return "offer"
    if "requisition" in nl or "tuyển dụng" in nl:
        return "job_requisition"
    return nl.replace(" ", "_")


def _category_in_use(db: Session, item: SharedCategory) -> bool:
    name = item.name
    # Check applications (source, rejection_reason)
    if db.query(JobApplication.id).filter(or_(JobApplication.source == name, JobApplication.rejection_reason == name)).first():
        return True
    # Check postings (location, type)
    if db.query(JobPosting.id).filter(or_(JobPosting.location == name, JobPosting.type == name)).first():
        return True
    # Check requisitions (work_location, employment_type)
    if db.query(JobRequisition.id).filter(or_(JobRequisition.work_location == name, JobRequisition.employment_type == name)).first():
        return True
    # Check approval flows (approval_type)
    if item.category_type == "approval_type":
        code = _canonical_approval_type(name)
        if db.query(ApprovalFlow.id).filter(or_(ApprovalFlow.approval_type == name, ApprovalFlow.approval_type == code)).first():
            return True
    return False


@router.get("/categories")
def list_categories(
    category_type: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    _authenticated(authorization, db)
    q = db.query(SharedCategory)
    if category_type:
        q = q.filter(SharedCategory.category_type == category_type)
    if search and search.strip():
        q = q.filter(SharedCategory.name.ilike(f"%{search.strip()}%"))
    if is_active is not None:
        q = q.filter(SharedCategory.is_active == is_active)

    # Sort order
    q = q.order_by(SharedCategory.category_type, SharedCategory.sort_order.asc(), SharedCategory.id.asc())

    is_paginated = (page is not None and page_size is not None)
    total = q.count() if is_paginated else 0

    if is_paginated:
        rows = q.offset((page - 1) * page_size).limit(page_size).all()
    else:
        rows = q.all()

    out = []
    for item in rows:
        data = item.to_dict()
        # Reference counting across applications, postings, requisitions, approval flows (S2-08 AC2)
        app_count = db.query(JobApplication.id).filter(
            or_(JobApplication.source == item.name, JobApplication.rejection_reason == item.name)).count()
        posting_count = db.query(JobPosting.id).filter(
            or_(JobPosting.location == item.name, JobPosting.type == item.name)).count()
        req_count = db.query(JobRequisition.id).filter(
            or_(JobRequisition.work_location == item.name, JobRequisition.employment_type == item.name)).count()
        flow_count = 0
        if item.category_type == "approval_type":
            code = _canonical_approval_type(item.name)
            flow_count = db.query(ApprovalFlow.id).filter(
                or_(ApprovalFlow.approval_type == item.name, ApprovalFlow.approval_type == code)
            ).count()

        total_usage = app_count + posting_count + req_count + flow_count
        data["usage_count"] = total_usage
        data["in_use"] = (total_usage > 0)
        out.append(data)

    if is_paginated:
        return {
            "items": out,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size and page_size > 0 else 1
        }
    return out


@router.post("/categories", status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Tên danh mục không được để trống")
    if db.query(SharedCategory.id).filter(
        SharedCategory.category_type == payload.category_type,
        func.lower(SharedCategory.name) == clean_name.lower()
    ).first():
        raise HTTPException(status_code=409, detail="Giá trị danh mục đã tồn tại trong nhóm này")

    sort_order = payload.sort_order
    if not sort_order:
        max_order = db.query(func.max(SharedCategory.sort_order)).filter(
            SharedCategory.category_type == payload.category_type
        ).scalar()
        sort_order = (max_order + 1) if max_order is not None else 1

    item = SharedCategory(
        category_type=payload.category_type,
        name=clean_name,
        sort_order=sort_order,
        is_active=payload.is_active
    )
    db.add(item); db.commit(); db.refresh(item)
    data = item.to_dict()
    data["usage_count"] = 0
    data["in_use"] = False
    return data


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
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Tên danh mục không được để trống")
    if clean_name != item.name:
        if _category_in_use(db, item):
            raise HTTPException(status_code=409, detail="Giá trị đang được tham chiếu, không đổi tên được — hãy tạo giá trị mới và ngừng áp dụng giá trị cũ.")
        if db.query(SharedCategory.id).filter(
            SharedCategory.id != category_id,
            SharedCategory.category_type == item.category_type,
            func.lower(SharedCategory.name) == clean_name.lower()
        ).first():
            raise HTTPException(status_code=409, detail="Tên danh mục đã tồn tại trong nhóm này")
    item.name = clean_name
    item.is_active = payload.is_active
    db.commit(); db.refresh(item)
    data = item.to_dict()
    data["in_use"] = _category_in_use(db, item)
    return data


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
    reason: Optional[str] = Field(default=None, max_length=1000)  # justification when the budget is raised (S3-04)


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
    actor = authorize(authorization, db)
    if not db.query(Department.id).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")
    item = db.query(HeadcountBudget).filter(HeadcountBudget.department_id == payload.department_id, HeadcountBudget.year == payload.year).first()
    if not item:
        item = HeadcountBudget(department_id=payload.department_id, year=payload.year, used_quantity=0, status="active")
        db.add(item)
    previous = item.budget_quantity
    item.budget_quantity = payload.budget_quantity
    if previous is not None and previous != payload.budget_quantity:
        from app.models.audit import AuditLog
        db.add(AuditLog(actor_id=getattr(actor, "id", None), actor_email=getattr(actor, "email", "") or "", action="HEADCOUNT_BUDGET_CHANGED",
                        target_entity="DEPARTMENT", target_id=str(payload.department_id),
                        payload_json=json.dumps({"year": payload.year, "from": previous, "to": payload.budget_quantity,
                                                 "reason": (payload.reason or "").strip()}, ensure_ascii=False)))
    db.commit(); db.refresh(item)
    return _headcount_out(db, item)


# ------------------------------------------------------------------ approval flows (S3-01 Dynamic Versioning)
class ApprovalFlowIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    department_id: Optional[int] = None
    approval_type: Optional[str] = "job_requisition"
    steps: List[Union[str, dict]] = Field(..., min_length=1)
    min_salary_threshold: float = Field(0, ge=0)
    max_salary_threshold: float = Field(100_000_000_000, ge=0)
    status: Optional[str] = "active"
    description: Optional[str] = None


def _parse_and_validate_steps(raw_steps: List[Union[str, dict]]) -> Tuple[List[dict], List[str]]:
    parsed = []
    canonical_codes = []
    
    role_label_map = {
        "hiring_manager": ("HIRING_MANAGER", "Trưởng phòng chuyên môn đề xuất & xác nhận nhu cầu tuyển dụng"),
        "manager": ("HIRING_MANAGER", "Trưởng phòng chuyên môn đề xuất & xác nhận nhu cầu tuyển dụng"),
        "hr_manager": ("HR_MANAGER", "Trưởng phòng Nhân sự thẩm định định biên, SLA và ngân sách"),
        "hr": ("HR_MANAGER", "Trưởng phòng Nhân sự thẩm định định biên, SLA và ngân sách"),
        "approver": ("EXECUTIVE", "Ban Giám Đốc phê duyệt cuối cùng"),
        "executive": ("EXECUTIVE", "Ban Giám Đốc phê duyệt cuối cùng"),
        "director": ("EXECUTIVE", "Ban Giám Đốc phê duyệt cuối cùng"),
        "cfo": ("EXECUTIVE", "Ban Giám Đốc phê duyệt cuối cùng"),
        "ceo": ("EXECUTIVE", "Ban Giám Đốc phê duyệt cuối cùng"),
        "recruiter": ("RECRUITER", "Chuyên viên Tuyển dụng điều phối"),
        "admin": ("SYSTEM_ADMIN", "Quản trị hệ thống phê duyệt"),
    }

    for i, item in enumerate(raw_steps):
        if isinstance(item, dict):
            role_raw = str(item.get("role", "HIRING_MANAGER")).strip()
            desc = str(item.get("description", "")).strip()
            step_num = item.get("step_num", i + 1)
        else:
            role_raw = str(item).strip()
            desc = ""
            step_num = i + 1

        lower_key = role_raw.lower()
        if lower_key in ("hiring_manager", "manager"):
            canon = "manager"
        elif lower_key in ("hr_manager", "hr"):
            canon = "hr"
        elif lower_key in ("approver", "executive", "director", "cfo", "ceo"):
            canon = "executive"
        else:
            canon = lower_key

        if canon not in APPROVAL_STEPS and lower_key not in ("recruiter", "admin"):
            raise HTTPException(status_code=422, detail=f"Cấp duyệt '{role_raw}' không hợp lệ (chỉ chấp nhận các vai trò thẩm quyền trong hệ thống).")

        default_role_code, default_desc = role_label_map.get(lower_key, (role_raw.upper(), f"Cấp phê duyệt số {i + 1}"))
        final_desc = desc if desc else default_desc

        parsed.append({
            "step_num": step_num,
            "role": default_role_code,
            "description": final_desc
        })
        canonical_codes.append(canon)

    if len(set(canonical_codes)) != len(canonical_codes):
        raise HTTPException(status_code=422, detail="Một cấp duyệt không được lặp lại trong chuỗi.")
    
    return parsed, canonical_codes


def _validate_flow(db: Session, payload: ApprovalFlowIn):
    if payload.max_salary_threshold <= payload.min_salary_threshold:
        raise HTTPException(status_code=422, detail="Ngưỡng lương tối đa phải lớn hơn ngưỡng tối thiểu.")
    if payload.department_id and not db.query(Department.id).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=422, detail="Phòng ban không tồn tại")


def _check_flow_conflict(
    db: Session,
    flow_id: Optional[int],
    department_id: Optional[int],
    approval_type: str,
    min_salary: float,
    max_salary: float,
    status: str
):
    """Checks whether an active flow overlaps with an existing active flow for the same scope."""
    if status != "active":
        return

    query = db.query(ApprovalFlow).filter(
        ApprovalFlow.is_deleted == False,
        ApprovalFlow.status == "active",
        ApprovalFlow.approval_type == approval_type,
        ApprovalFlow.department_id == department_id
    )
    if flow_id:
        query = query.filter(ApprovalFlow.id != flow_id)

    existing_flows = query.all()
    for f in existing_flows:
        f_min = f.min_salary_threshold or 0.0
        f_max = f.max_salary_threshold or float("inf")
        # Overlapping condition: min_salary < f_max and max_salary > f_min
        if min_salary < f_max and max_salary > f_min:
            f_min_str = f"{int(f_min):,}".replace(",", ".") + " ₫"
            f_max_str = f"{int(f_max):,}".replace(",", ".") + " ₫" if f_max < 1e12 else "Vô cực"
            raise HTTPException(
                status_code=422,
                detail=f"Xung đột quy tắc: Dải giá trị áp dụng bị giao nhau với luồng đang áp dụng '{f.name}' ({f_min_str} - {f_max_str}). Vui lòng điều chỉnh dải tiền hoặc ngừng áp dụng luồng cũ."
            )


@router.get("/approval-types")
def list_approval_types(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Dynamic approval types loaded from system categories."""
    _authenticated(authorization, db)
    cats = db.query(SharedCategory).filter(
        SharedCategory.category_type == "approval_type",
        SharedCategory.is_active == True
    ).order_by(SharedCategory.sort_order.asc(), SharedCategory.id.asc()).all()

    if not cats:
        defaults = [
            {"code": "job_requisition", "name": "Tuyển dụng (Job Requisition)", "description": "Quy trình phê duyệt yêu cầu tuyển dụng mới"},
            {"code": "offer", "name": "Offer thư mời nhận việc", "description": "Quy trình duyệt đề xuất và thư mời nhận việc"},
            {"code": "headcount", "name": "Ngân sách tuyển dụng (Headcount)", "description": "Quy trình duyệt vượt định biên hoặc ngân sách"},
            {"code": "salary_exception", "name": "Ngoại lệ lương (Salary Exception)", "description": "Quy trình phê duyệt mức lương ngoài dải chuẩn"},
        ]
        return defaults

    seen_codes = set()
    result = []
    for c in cats:
        code = _canonical_approval_type(c.name)
        if code not in seen_codes:
            seen_codes.add(code)
            result.append({"code": code, "name": c.name, "description": ""})
    return result


@router.get("/approval-roles")
def list_approval_roles(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """System roles available for workflow approval steps."""
    _authenticated(authorization, db)
    db_roles = db.query(Role).all()
    role_meta = {
        "hiring_manager": {
            "name": "HIRING_MANAGER (Trưởng phòng chuyên môn)",
            "description": "Đề xuất & xác nhận nhu cầu tuyển dụng"
        },
        "hr_manager": {
            "name": "HR_MANAGER (Trưởng phòng Nhân sự)",
            "description": "Thẩm định định biên, SLA và ngân sách"
        },
        "approver": {
            "name": "EXECUTIVE (Ban Giám Đốc)",
            "description": "Ban Giám Đốc phê duyệt cuối cùng"
        },
        "recruiter": {
            "name": "RECRUITER (Chuyên viên Tuyển dụng)",
            "description": "Quản lý tiếp nhận và điều phối quy trình"
        },
        "admin": {
            "name": "SYSTEM_ADMIN (Quản trị hệ thống)",
            "description": "Phê duyệt các trường hợp đặc biệt"
        }
    }
    results = []
    seen = set()
    for r in db_roles:
        code_key = r.code.lower()
        if code_key in role_meta:
            meta = role_meta[code_key]
            results.append({
                "code": r.code.upper(),
                "role_key": code_key,
                "name": meta["name"],
                "description": meta["description"]
            })
            seen.add(code_key)
        elif r.code not in ("candidate", "employee"):
            results.append({
                "code": r.code.upper(),
                "role_key": code_key,
                "name": f"{r.code.upper()} ({r.name})",
                "description": r.description or ""
            })
            seen.add(code_key)

    for k, meta in role_meta.items():
        if k not in seen:
            results.append({
                "code": k.upper(),
                "role_key": k,
                "name": meta["name"],
                "description": meta["description"]
            })
    return results


@router.get("/approval-flows")
def list_approval_flows(
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    approval_type: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "updated_desc",
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=100),
    response: Response = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    authorize(authorization, db)
    query = db.query(ApprovalFlow).filter(ApprovalFlow.is_deleted == False)

    search_score = None
    if search and search.strip():
        search_cols = [ApprovalFlow.name]
        query = query.filter(build_search_filter(search_cols, search.strip()))
        search_score = build_search_score(search_cols, search.strip())

    if department_id is not None:
        query = query.filter(ApprovalFlow.department_id == department_id)

    if approval_type and approval_type != "all":
        query = query.filter(ApprovalFlow.approval_type == approval_type)

    if status and status != "all":
        query = query.filter(ApprovalFlow.status == status)

    total_count = query.count()
    if response:
        response.headers["X-Total-Count"] = str(total_count)

    # Sorting
    if search_score is not None and not sort_by:
        query = query.order_by(search_score.desc(), ApprovalFlow.updated_at.desc(), ApprovalFlow.id.desc())
    elif sort_by == "name_asc":
        query = query.order_by(ApprovalFlow.name.asc())
    elif sort_by == "name_desc":
        query = query.order_by(ApprovalFlow.name.desc())
    elif sort_by == "updated_asc":
        query = query.order_by(ApprovalFlow.updated_at.asc(), ApprovalFlow.id.asc())
    elif sort_by == "threshold_asc":
        query = query.order_by(ApprovalFlow.min_salary_threshold.asc())
    elif sort_by == "threshold_desc":
        query = query.order_by(ApprovalFlow.max_salary_threshold.desc())
    else:
        query = query.order_by(ApprovalFlow.updated_at.desc(), ApprovalFlow.id.desc())

    if page is not None:
        ps = page_size or 10
        total_pages = max(1, (total_count + ps - 1) // ps)
        items = query.offset((page - 1) * ps).limit(ps).all()
        return {
            "items": [item.to_dict() for item in items],
            "total": total_count,
            "page": page,
            "page_size": ps,
            "total_pages": total_pages
        }

    if page_size is not None:
        query = query.limit(page_size)

    return [item.to_dict() for item in query.all()]


@router.post("/approval-flows", status_code=201)
def create_approval_flow(payload: ApprovalFlowIn, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    current_user = authorize(authorization, db)
    _validate_flow(db, payload)
    parsed_steps, canonical_codes = _parse_and_validate_steps(payload.steps)

    flow_status = payload.status or "active"
    app_type = payload.approval_type or "job_requisition"

    # Conflict detection
    _check_flow_conflict(db, None, payload.department_id, app_type, payload.min_salary_threshold, payload.max_salary_threshold, flow_status)

    now = datetime.utcnow()
    item = ApprovalFlow(
        name=payload.name,
        department_id=payload.department_id,
        approval_type=app_type,
        version="v1.0",
        max_levels=len(parsed_steps),
        min_salary_threshold=payload.min_salary_threshold,
        max_salary_threshold=payload.max_salary_threshold,
        steps_json=json.dumps(parsed_steps),
        status=flow_status,
        is_active=(flow_status == "active"),
        description=payload.description or "",
        updated_by_id=current_user.id,
        updated_at=now,
        created_at=now
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Initial version record
    v_rec = ApprovalFlowVersion(
        flow_id=item.id,
        version="v1.0",
        snapshot_json=json.dumps(item.to_dict()),
        created_by_id=current_user.id,
        change_reason="Khởi tạo luồng phê duyệt",
        created_at=now
    )
    db.add(v_rec)

    # Audit log
    audit = AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="CREATE_APPROVAL_FLOW",
        target_entity="approval_flow",
        target_id=str(item.id),
        payload_json=json.dumps({
            "name": item.name,
            "version": item.version,
            "status": item.status,
            "approval_type": item.approval_type,
            "actor_name": current_user.full_name
        }),
        created_at=now
    )
    db.add(audit)
    db.commit()
    db.refresh(item)
    return item.to_dict()


@router.put("/approval-flows/{flow_id}")
def update_approval_flow(flow_id: int, payload: ApprovalFlowIn, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Running requisitions keep the chain snapshot taken at submission (S3-01 AC4)."""
    current_user = authorize(authorization, db)
    item = db.query(ApprovalFlow).filter(ApprovalFlow.id == flow_id, ApprovalFlow.is_deleted == False).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy luồng duyệt")

    _validate_flow(db, payload)
    parsed_steps, canonical_codes = _parse_and_validate_steps(payload.steps)

    target_status = payload.status or item.status
    app_type = payload.approval_type or item.approval_type

    # Conflict detection
    _check_flow_conflict(db, item.id, payload.department_id, app_type, payload.min_salary_threshold, payload.max_salary_threshold, target_status)

    now = datetime.utcnow()

    # Save snapshot of previous state to versions table
    v_prev = ApprovalFlowVersion(
        flow_id=item.id,
        version=item.version or "v1.0",
        snapshot_json=json.dumps(item.to_dict()),
        created_by_id=current_user.id,
        change_reason=f"Chỉnh sửa từ phiên bản {item.version}",
        created_at=now
    )
    db.add(v_prev)

    # Increment version if flow was active
    new_version = item.version or "v1.0"
    if item.status == "active":
        try:
            curr_str = new_version.lstrip("v")
            parts = curr_str.split(".")
            major = int(parts[0])
            minor = int(parts[1]) if len(parts) > 1 else 0
            if len(parsed_steps) != item.max_levels:
                new_version = f"v{major + 1}.0"
            else:
                new_version = f"v{major}.{minor + 1}"
        except Exception:
            new_version = "v1.1"

    item.name = payload.name
    item.department_id = payload.department_id
    item.approval_type = app_type
    item.version = new_version
    item.steps_json = json.dumps(parsed_steps)
    item.max_levels = len(parsed_steps)
    item.min_salary_threshold = payload.min_salary_threshold
    item.max_salary_threshold = payload.max_salary_threshold
    item.status = target_status
    item.is_active = (target_status == "active")
    item.description = payload.description or ""
    item.updated_by_id = current_user.id
    item.updated_at = now

    audit = AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="UPDATE_APPROVAL_FLOW",
        target_entity="approval_flow",
        target_id=str(item.id),
        payload_json=json.dumps({
            "name": item.name,
            "version": item.version,
            "status": item.status,
            "actor_name": current_user.full_name
        }),
        created_at=now
    )
    db.add(audit)
    db.commit()
    db.refresh(item)
    return item.to_dict()


@router.post("/approval-flows/{flow_id}/deactivate")
def deactivate_approval_flow(flow_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Soft deactivation: sets status to inactive and logs audit, no hard delete."""
    current_user = authorize(authorization, db)
    item = db.query(ApprovalFlow).filter(ApprovalFlow.id == flow_id, ApprovalFlow.is_deleted == False).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy luồng duyệt")
    now = datetime.utcnow()
    item.status = "inactive"
    item.is_active = False
    item.updated_by_id = current_user.id
    item.updated_at = now

    audit = AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="DEACTIVATE_APPROVAL_FLOW",
        target_entity="approval_flow",
        target_id=str(item.id),
        payload_json=json.dumps({"name": item.name, "status": "inactive", "actor_name": current_user.full_name}),
        created_at=now
    )
    db.add(audit)
    db.commit()
    db.refresh(item)
    return item.to_dict()


@router.post("/approval-flows/{flow_id}/activate")
def activate_approval_flow(flow_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Re-activates a flow after checking rule conflict with existing active flows."""
    current_user = authorize(authorization, db)
    item = db.query(ApprovalFlow).filter(ApprovalFlow.id == flow_id, ApprovalFlow.is_deleted == False).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy luồng duyệt")

    _check_flow_conflict(db, item.id, item.department_id, item.approval_type, item.min_salary_threshold, item.max_salary_threshold, "active")

    now = datetime.utcnow()
    item.status = "active"
    item.is_active = True
    item.updated_by_id = current_user.id
    item.updated_at = now

    audit = AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="ACTIVATE_APPROVAL_FLOW",
        target_entity="approval_flow",
        target_id=str(item.id),
        payload_json=json.dumps({"name": item.name, "status": "active", "actor_name": current_user.full_name}),
        created_at=now
    )
    db.add(audit)
    db.commit()
    db.refresh(item)
    return item.to_dict()


@router.get("/approval-flows/{flow_id}/versions")
def list_approval_flow_versions(flow_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    versions = db.query(ApprovalFlowVersion).filter(ApprovalFlowVersion.flow_id == flow_id).order_by(ApprovalFlowVersion.created_at.desc()).all()
    return [v.to_dict() for v in versions]


@router.delete("/approval-flows/{flow_id}")
def delete_approval_flow(flow_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """PHASE 5: Safely delete or archive an approval flow.
    - Active flows cannot be deleted if in use or active; user must deactivate first.
    - Referenced by active requisitions in approval: blocked with 409.
    - Soft-deletes: is_deleted=True, is_active=False, records audit log and preserves version snapshots.
    """
    current_user = authorize(authorization, db)
    item = db.query(ApprovalFlow).filter(ApprovalFlow.id == flow_id, ApprovalFlow.is_deleted == False).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy luồng phê duyệt hoặc luồng đã bị xóa")

    if item.status == "active":
        raise HTTPException(
            status_code=409,
            detail="Không thể xóa luồng phê duyệt đang áp dụng. Vui lòng chuyển trạng thái sang 'Ngừng áp dụng' trước khi thực hiện xóa."
        )

    # Check if any requisition is currently active/pending approval in this department or scope
    active_reqs = db.query(JobRequisition.id).filter(
        JobRequisition.status.in_(["pending_manager", "pending_hr", "pending_executive"])
    )
    if item.department_id is not None:
        active_reqs = active_reqs.filter(JobRequisition.department_id == item.department_id)
    if active_reqs.first():
        raise HTTPException(
            status_code=409,
            detail="Không thể xóa luồng phê duyệt vì có yêu cầu tuyển dụng đang trong quá trình phê duyệt liên kết với luồng này."
        )

    now = datetime.utcnow()
    item.is_deleted = True
    item.is_active = False
    item.status = "deleted"
    item.deleted_at = now
    item.deleted_by_id = current_user.id
    item.updated_at = now
    item.updated_by_id = current_user.id

    audit = AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="DELETE_APPROVAL_FLOW",
        target_entity="approval_flow",
        target_id=str(item.id),
        payload_json=json.dumps({
            "name": item.name,
            "version": item.version,
            "approval_type": item.approval_type,
            "status": "deleted",
            "actor_name": current_user.full_name
        }),
        created_at=now
    )
    db.add(audit)
    db.commit()
    return {"success": True, "message": f"Đã xóa luồng phê duyệt '{item.name}' thành công", "id": item.id}



# ------------------------------------------------------------------ onboarding templates (S7-08)
class OnboardingItemIn(BaseModel):
    task_name: str = Field(..., min_length=2)
    assigned_role: str = Field("HR")
    days_before_start: int = Field(0, ge=-30, le=60)
    # template-editor details (kept in the template JSON; checklists only use the three fields above)
    phase: Optional[str] = Field(default=None, max_length=60)
    is_mandatory: bool = True
    description: Optional[str] = Field(default=None, max_length=1000)
    sla_note: Optional[str] = Field(default=None, max_length=120)


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


# ------------------------------------------------------------------ public career page content
def sanitize_text_content(val: Optional[str]) -> str:
    if not val:
        return ""
    # Strip dangerous HTML tags (TC-S2-09-X01)
    clean = re.sub(r"(?is)<script.*?>.*?</script>", "", val)
    clean = re.sub(r"(?is)<style.*?>.*?</style>", "", clean)
    clean = re.sub(r"(?is)<iframe.*?>.*?</iframe>", "", clean)
    clean = re.sub(r"(?is)<object.*?>.*?</object>", "", clean)
    clean = re.sub(r"(?is)<embed.*?>.*?</embed>", "", clean)
    # Strip javascript: URLs
    clean = re.sub(r"(?i)javascript:", "", clean)
    # Strip inline event handlers (onerror=, onclick=, onload=...)
    clean = re.sub(r"(?i)\s+on\w+\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)", "", clean)
    return clean.strip()


class CareerBenefit(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    description: str = Field("", max_length=500)
    icon: str = Field("Award", max_length=40)


class CareerPageIn(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=150)
    slogan: str = Field("", max_length=300)
    contact_email: str = Field("", max_length=150)
    contact_phone: str = Field("", max_length=50)
    address: str = Field("", max_length=300)
    website: str = Field("", max_length=255)
    logo_url: str = Field("", max_length=500)
    banner_url: str = Field("", max_length=1000)
    about_us: str = Field("", max_length=10000)
    benefits: List[CareerBenefit] = Field(default_factory=list, max_length=20)

    @field_validator("logo_url", "banner_url")
    @classmethod
    def safe_url(cls, v: str) -> str:
        v = (v or "").strip()
        if v and not (v.startswith("https://") or v.startswith("/") or v.startswith("http://")):
            raise ValueError("Đường dẫn ảnh phải bắt đầu bằng https://, http:// hoặc là đường dẫn nội bộ (/...).")
        return v


@router.get("/career-page")
def get_career_page_admin(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Returns current career page configuration with author/timestamp metadata for HR management."""
    from app.models.master_data import CareerPageSettings
    from app.api.v1.public import DEFAULT_CAREER_DATA
    authorize(authorization, db)
    row = db.query(CareerPageSettings).filter(CareerPageSettings.id == 1).first()
    if row and row.data():
        d = row.data()
        updater = db.query(User).filter(User.id == row.updated_by_id).first() if row.updated_by_id else None
        return {
            **DEFAULT_CAREER_DATA,
            **d,
            "configured": True,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            "updated_by_name": updater.full_name if updater else None,
            "updated_by_email": updater.email if updater else None,
        }
    return {**DEFAULT_CAREER_DATA, "configured": False}


@router.put("/career-page")
def save_career_page(payload: CareerPageIn, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    from app.models.master_data import CareerPageSettings
    from app.api.v1.admin import record_audit_log
    user = authorize(authorization, db)

    # Sanitize inputs (TC-S2-09-X01)
    clean_company_name = sanitize_text_content(payload.company_name)
    clean_slogan = sanitize_text_content(payload.slogan)
    clean_about_us = sanitize_text_content(payload.about_us)
    clean_address = sanitize_text_content(payload.address)
    clean_benefits = [
        {
            "title": sanitize_text_content(b.title),
            "description": sanitize_text_content(b.description),
            "icon": (b.icon or "Award").strip(),
        }
        for b in payload.benefits
    ]

    saved_dict = {
        "company_name": clean_company_name,
        "slogan": clean_slogan,
        "contact_email": payload.contact_email.strip(),
        "contact_phone": payload.contact_phone.strip(),
        "address": clean_address,
        "website": payload.website.strip(),
        "logo_url": payload.logo_url.strip(),
        "banner_url": payload.banner_url.strip(),
        "about_us": clean_about_us,
        "benefits": clean_benefits,
    }

    row = db.query(CareerPageSettings).filter(CareerPageSettings.id == 1).first()
    if not row:
        row = CareerPageSettings(id=1)
        db.add(row)
    row.data_json = json.dumps(saved_dict, ensure_ascii=False)
    row.updated_by_id = user.id
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)

    record_audit_log(
        db,
        user.email,
        "UPDATE_CAREER_PAGE",
        "CareerPageSettings",
        "1",
        f"Cập nhật trang giới thiệu công ty: {clean_company_name}",
    )

    return row.data() | {
        "configured": True,
        "updated_at": row.updated_at.isoformat(),
        "updated_by_name": user.full_name,
    }


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
    if not any(has_permission(db, user, c) for c in ("master_data:manage", "requisition:assign", "interview:schedule", "requisition:create", "offer:create")):
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem danh bạ nhân sự.")
    if role not in {"interviewer", "recruiter", "hiring_manager", "approver", "hr_manager"}:
        raise HTTPException(status_code=422, detail="Vai trò không hợp lệ.")
    rows = (db.query(User).join(UserRole, UserRole.user_id == User.id).join(Role, Role.id == UserRole.role_id)
            .filter(Role.code == role, User.account_status == "active").order_by(User.full_name).all())
    return [{"id": u.id, "full_name": u.full_name, "email": u.email, "job_title": u.job_title} for u in rows]
