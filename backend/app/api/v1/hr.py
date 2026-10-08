from typing import Optional
from fastapi import APIRouter, Header, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.db.session import get_db
from app.models.hr import Competency, Department, JobTitle, SharedCategory
from app.schemas.hr import CategoryCreate, CompetencyCreate, DepartmentCreate, JobTitleCreate, ReorderCategories

router = APIRouter()
HR_ROLES = {"hr_manager"}

def authorize(authorization: Optional[str], db: Session):
    return require_roles(authorization, db, HR_ROLES)

@router.get("/departments")
def list_departments(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    # Authenticated internal staff can view department list
    require_roles(authorization, db, allowed_roles={"admin", "hr_manager", "recruiter", "hiring_manager", "interviewer", "approver", "employee"})
    return [item.to_dict() for item in db.query(Department).filter(Department.is_active.is_(True)).order_by(Department.sort_order, Department.name).all()]

@router.get("/departments/tree")
def get_department_tree(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    # S2-04 AC: Sơ đồ tổ chức nhiều cấp dạng cây
    require_roles(authorization, db, allowed_roles={"admin", "hr_manager", "recruiter", "hiring_manager", "interviewer", "approver", "employee"})
    all_depts = db.query(Department).filter(Department.is_active.is_(True)).order_by(Department.sort_order, Department.name).all()
    
    from app.models.user import User
    user_ids = [d.manager_id for d in all_depts if d.manager_id]
    managers = {u.id: u.full_name for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}

    dept_map = {}
    for d in all_depts:
        node = d.to_dict()
        node["manager_name"] = managers.get(d.manager_id)
        node["children"] = []
        dept_map[d.id] = node

    root_nodes = []
    for d in all_depts:
        if d.parent_id and d.parent_id in dept_map:
            dept_map[d.parent_id]["children"].append(dept_map[d.id])
        else:
            root_nodes.append(dept_map[d.id])
    return root_nodes

@router.post("/departments", status_code=status.HTTP_201_CREATED)
def create_department(payload: DepartmentCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if db.query(Department).filter(Department.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Mã phòng ban đã tồn tại", headers={"X-Field-Error": "code"})
    if payload.parent_id and not db.query(Department).filter(Department.id == payload.parent_id, Department.is_active.is_(True)).first():
        raise HTTPException(status_code=400, detail="Phòng ban cha không tồn tại")
    
    from app.models.user import User
    if payload.manager_id and not db.query(User).filter(User.id == payload.manager_id).first():
        raise HTTPException(status_code=400, detail="Người phụ trách phòng ban không tồn tại")

    item = Department(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()

@router.put("/departments/{department_id}")
def update_department(department_id: int, payload: DepartmentCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(Department).filter(Department.id == department_id).first()
    if not item: raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")
    if payload.parent_id == department_id:
        raise HTTPException(status_code=400, detail="Department cannot be its own parent")
    if payload.parent_id:
        parent = db.query(Department).filter(Department.id == payload.parent_id, Department.is_active.is_(True)).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent department does not exist or is inactive")
        ancestor_id = parent.parent_id
        while ancestor_id is not None:
            if ancestor_id == department_id:
                raise HTTPException(status_code=400, detail="Department hierarchy cannot contain a cycle")
            ancestor = db.query(Department).filter(Department.id == ancestor_id).first()
            ancestor_id = ancestor.parent_id if ancestor else None
    duplicate_code = db.query(Department).filter(Department.code == payload.code, Department.id != department_id).first()
    if duplicate_code:
        raise HTTPException(status_code=400, detail="Department code already exists")

    from app.models.user import User
    if payload.manager_id and not db.query(User).filter(User.id == payload.manager_id).first():
        raise HTTPException(status_code=400, detail="Người phụ trách phòng ban không tồn tại")

    for key, value in payload.model_dump().items(): setattr(item, key, value)
    db.commit(); db.refresh(item)
    return item.to_dict()

# S2-04 AC: Phòng ban đang có yêu cầu tuyển dụng mở thì không xoá được, chỉ ngừng áp dụng
@router.delete("/departments/{department_id}")
def delete_department(department_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(Department).filter(Department.id == department_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")

    # Kiểm tra ràng buộc yêu cầu tuyển dụng mở
    from app.models.requisition import JobRequisition
    open_req = db.query(JobRequisition).filter(
        JobRequisition.department_id == department_id,
        JobRequisition.status.in_(["draft", "pending_manager", "pending_hr", "pending_approval", "approved", "open", "in_progress"])
    ).first()
    if open_req:
        raise HTTPException(
            status_code=400,
            detail=f"Phòng ban đang có yêu cầu tuyển dụng đang mở ('{open_req.code}'), không thể xóa. Chỉ được phép ngừng áp dụng."
        )

    # Preserve historical references; the AC says to stop applying a department.
    item.is_active = False
    db.commit()
    return {"message": "Đã ngừng áp dụng phòng ban thành công.", "deleted_id": department_id, "is_active": False}

# S2-05 AC: Chỉ Trưởng phòng Nhân sự và Quản trị viên xem được dải lương
@router.get("/job-titles")
def list_job_titles(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = require_roles(authorization, db, allowed_roles={"admin", "hr_manager", "recruiter", "hiring_manager", "interviewer", "approver", "employee"})
    user_roles = set([r.strip().lower() for r in (user.role or "").split(",") if r.strip()])
    can_view_salary = bool(user_roles.intersection({"hr_manager", "admin"}))
    titles = db.query(JobTitle).order_by(JobTitle.name).all()
    return [item.to_dict(include_salary=can_view_salary) for item in titles]

@router.post("/job-titles", status_code=status.HTTP_201_CREATED)
def create_job_title(payload: JobTitleCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if payload.department_id and not db.query(Department).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=400, detail="Phòng ban không tồn tại")
    if payload.code and db.query(JobTitle).filter(JobTitle.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Mã chức danh đã tồn tại")
    item = JobTitle(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict(include_salary=True)

@router.put("/job-titles/{title_id}")
def update_job_title(title_id: int, payload: JobTitleCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(JobTitle).filter(JobTitle.id == title_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Job title not found")
    if payload.department_id and not db.query(Department).filter(Department.id == payload.department_id, Department.is_active.is_(True)).first():
        raise HTTPException(status_code=400, detail="Department does not exist or is inactive")
    if payload.code and db.query(JobTitle).filter(JobTitle.code == payload.code, JobTitle.id != title_id).first():
        raise HTTPException(status_code=400, detail="Job title code already exists")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item.to_dict(include_salary=True)


@router.delete("/job-titles/{title_id}")
def delete_job_title(title_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(JobTitle).filter(JobTitle.id == title_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy chức danh")
    
    from app.models.requisition import JobRequisition
    from app.models.job import JobPosting
    has_req = db.query(JobRequisition).filter(JobRequisition.title.ilike(item.name)).first()
    has_job = db.query(JobPosting).filter(JobPosting.title.ilike(item.name)).first()
    if has_req or has_job:
        raise HTTPException(
            status_code=400,
            detail="Chức danh đang được liên kết với tin tuyển dụng hoặc tờ trình, không thể xóa. Chỉ có thể ngừng áp dụng."
        )
    db.delete(item)
    db.commit()
    return {"message": "Xóa chức danh thành công", "deleted_id": title_id}

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
