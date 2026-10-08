from typing import Optional
from fastapi import APIRouter, Header, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.db.session import get_db
from app.models.hr import Competency, Department, JobTitle, SharedCategory
from app.models.system import SystemSetting
from app.schemas.hr import CategoryCreate, CompanyContentUpdate, CompetencyCreate, DepartmentCreate, JobTitleCreate, ReorderCategories
from app.services.audit import write_audit_log

router = APIRouter()
HR_ROLES = {"hr_manager", "admin"}

def authorize(authorization: Optional[str], db: Session):
    return require_roles(authorization, db, HR_ROLES)

def get_or_create_settings(db: Session) -> SystemSetting:
    settings = db.query(SystemSetting).filter(SystemSetting.id == 1).first()
    if not settings:
        settings = SystemSetting(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def content_dict(settings: SystemSetting):
    return {"title": settings.landing_title, "body": settings.landing_body, "image": settings.landing_image}

@router.get("/company-content/public")
def get_public_company_content(db: Session = Depends(get_db)):
    return content_dict(get_or_create_settings(db))

@router.get("/company-content")
def get_company_content(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return content_dict(get_or_create_settings(db))

@router.put("/company-content")
def update_company_content(payload: CompanyContentUpdate, request: Request, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    current_user = authorize(authorization, db)
    settings = get_or_create_settings(db)
    settings.landing_title = payload.title.strip()
    settings.landing_body = payload.body.strip()
    settings.landing_image = payload.image
    db.commit()
    db.refresh(settings)
    write_audit_log(db, action="Cập nhật nội dung tuyển dụng", module="Nội dung", request=request, user=current_user, details=settings.landing_title)
    return content_dict(settings)

@router.get("/departments")
def list_departments(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return [item.to_dict() for item in db.query(Department).order_by(Department.sort_order, Department.name).all()]

@router.post("/departments", status_code=status.HTTP_201_CREATED)
def create_department(payload: DepartmentCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if db.query(Department).filter(Department.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Mã phòng ban đã tồn tại", headers={"X-Field-Error": "code"})
    if payload.parent_id and not db.query(Department).filter(Department.id == payload.parent_id).first():
        raise HTTPException(status_code=400, detail="Phòng ban cha không tồn tại")
    item = Department(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()

@router.put("/departments/{department_id}")
def update_department(department_id: int, payload: DepartmentCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(Department).filter(Department.id == department_id).first()
    if not item: raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")
    if payload.parent_id == department_id: raise HTTPException(status_code=400, detail="Phòng ban không thể là cha của chính nó")
    for key, value in payload.model_dump().items(): setattr(item, key, value)
    db.commit(); db.refresh(item)
    return item.to_dict()

@router.get("/job-titles")
def list_job_titles(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return [item.to_dict() for item in db.query(JobTitle).order_by(JobTitle.name).all()]

@router.post("/job-titles", status_code=status.HTTP_201_CREATED)
def create_job_title(payload: JobTitleCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if payload.department_id and not db.query(Department).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=400, detail="Phòng ban không tồn tại")
    item = JobTitle(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()

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

@router.get("/categories")
def list_categories(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return [item.to_dict() for item in db.query(SharedCategory).order_by(SharedCategory.category_type, SharedCategory.sort_order).all()]

@router.post("/categories", status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = SharedCategory(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()

@router.put("/categories/reorder")
def reorder_categories(payload: ReorderCategories, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    items = db.query(SharedCategory).filter(SharedCategory.id.in_(payload.ids)).all()
    by_id = {item.id: item for item in items}
    for index, item_id in enumerate(payload.ids):
        if item_id in by_id: by_id[item_id].sort_order = index
    db.commit()
    return [item.to_dict() for item in db.query(SharedCategory).order_by(SharedCategory.category_type, SharedCategory.sort_order).all()]

# Headcount Budgets APIs (S3-04)
@router.get("/headcounts")
def list_headcount_budgets(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    from app.models.hr import HeadcountBudget
    return [item.to_dict() for item in db.query(HeadcountBudget).order_by(HeadcountBudget.year.desc()).all()]

# Approval Flows APIs (S3-01)
@router.get("/approval-flows")
def list_approval_flows(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    from app.models.hr import ApprovalFlow
    return [item.to_dict() for item in db.query(ApprovalFlow).order_by(ApprovalFlow.id.asc()).all()]
