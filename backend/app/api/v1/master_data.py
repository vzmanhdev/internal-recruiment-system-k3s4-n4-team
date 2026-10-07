from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import time

from app.db.session import get_db
from app.models.master_data import Department, SalaryBand
from app.models.audit_log import AuditLog
from app.models.user import User
from app.core.dependencies import get_current_user, require_roles
from app.schemas.master_data import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    SalaryBandCreate,
    SalaryBandUpdate,
    SalaryBandResponse
)

router = APIRouter()

# =========================================================================
# 1. DEPARTMENTS HIERARCHY & CRUD API
# =========================================================================
@router.get("/departments")
def get_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách tất cả phòng ban từ CSDL thực tế.
    """
    depts = db.query(Department).all()
    return [d.to_dict() for d in depts]

@router.post("/departments", status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    """
    Thêm mới phòng ban / đơn vị con vào CSDL.
    """
    code_upper = dept_in.code.upper().strip()
    existing = db.query(Department).filter(Department.code == code_upper).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã phòng ban '{code_upper}' đã tồn tại trong hệ thống (Đơn vị: {existing.name}). Vui lòng nhập mã khác."
        )

    dept_id = f"dept-{int(time.time() * 1000)}"
    dept = Department(
        id=dept_id,
        code=code_upper,
        name=dept_in.name.strip(),
        manager_name=dept_in.managerName.strip() if dept_in.managerName else "Chưa bổ nhiệm",
        manager_title=dept_in.managerTitle.strip() if dept_in.managerTitle else "Trưởng Đơn Vị",
        headcount_current=dept_in.headcountCurrent or 0,
        headcount_budget=dept_in.headcountBudget or 5,
        active_jobs=dept_in.active_jobs or 0,
        status=dept_in.status or "active",
        parent_id=dept_in.parentId
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept.to_dict()

@router.put("/departments/{dept_id}")
def update_department(
    dept_id: str,
    dept_in: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    """
    Cập nhật thông tin / trạng thái phòng ban trong CSDL.
    """
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban.")
    
    data = dept_in.model_dump(exclude_unset=True)
    if "code" in data and data["code"]:
        new_code = data["code"].upper().strip()
        if new_code != dept.code:
            existing = db.query(Department).filter(Department.code == new_code).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Mã phòng ban '{new_code}' đã tồn tại trong hệ thống."
                )
            dept.code = new_code

    if "managerName" in data and data["managerName"] is not None:
        dept.manager_name = data["managerName"]
    if "managerTitle" in data and data["managerTitle"] is not None:
        dept.manager_title = data["managerTitle"]
    if "headcountCurrent" in data and data["headcountCurrent"] is not None:
        dept.headcount_current = data["headcountCurrent"]
    if "headcountBudget" in data and data["headcountBudget"] is not None:
        dept.headcount_budget = data["headcountBudget"]
    if "parentId" in data:
        dept.parent_id = data["parentId"]
    if "name" in data and data["name"] is not None:
        dept.name = data["name"]
    if "status" in data and data["status"] is not None:
        dept.status = data["status"]

    db.commit()
    db.refresh(dept)
    return dept.to_dict()

@router.delete("/departments/{dept_id}")
def delete_department(
    dept_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    """
    Xóa phòng ban khỏi CSDL.
    """
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban.")
    
    if dept.active_jobs > 0:
        raise HTTPException(status_code=400, detail="Không thể xóa phòng ban đang có vị trí tuyển dụng mở.")

    db.delete(dept)
    db.commit()
    return {"message": "Xóa phòng ban thành công", "id": dept_id}


# =========================================================================
# 2. SALARY BANDS CATALOGUE & CRUD API
# =========================================================================
@router.get("/salary-bands")
def get_salary_bands(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách tất cả chức danh & dải lương từ CSDL thực tế.
    """
    bands = db.query(SalaryBand).all()
    return [b.to_dict() for b in bands]

@router.post("/salary-bands", status_code=status.HTTP_201_CREATED)
def create_salary_band(
    band_in: SalaryBandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    """
    Thêm mới chức danh & khung dải lương vào CSDL thực tế.
    """
    code_upper = band_in.code.upper().strip()
    existing = db.query(SalaryBand).filter(SalaryBand.code == code_upper).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã chức danh '{code_upper}' đã tồn tại trong hệ thống (Chức danh: {existing.title}). Vui lòng nhập mã khác."
        )

    band_id = f"band-{int(time.time() * 1000)}"
    band = SalaryBand(
        id=band_id,
        code=code_upper,
        title=band_in.title.strip(),
        level=band_in.level,
        min_salary=band_in.minSalary,
        max_salary=band_in.maxSalary,
        department=band_in.department.strip(),
        status=band_in.status or "active"
    )
    db.add(band)
    db.commit()
    db.refresh(band)
    return band.to_dict()

@router.put("/salary-bands/{band_id}")
def update_salary_band(
    band_id: str,
    band_in: SalaryBandUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    """
    Chỉnh sửa dải lương chức danh trong CSDL thực tế.
    """
    band = db.query(SalaryBand).filter(SalaryBand.id == band_id).first()
    if not band:
        raise HTTPException(status_code=404, detail="Không tìm thấy chức danh dải lương.")

    data = band_in.model_dump(exclude_unset=True)
    if "code" in data and data["code"]:
        new_code = data["code"].upper().strip()
        if new_code != band.code:
            existing = db.query(SalaryBand).filter(SalaryBand.code == new_code).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Mã chức danh '{new_code}' đã tồn tại trong hệ thống."
                )
            band.code = new_code

    if "title" in data and data["title"] is not None:
        band.title = data["title"]
    if "level" in data and data["level"] is not None:
        band.level = data["level"]
    if "minSalary" in data and data["minSalary"] is not None:
        band.min_salary = data["minSalary"]
    if "maxSalary" in data and data["maxSalary"] is not None:
        band.max_salary = data["maxSalary"]
    if "department" in data and data["department"] is not None:
        band.department = data["department"]
    if "status" in data and data["status"] is not None:
        band.status = data["status"]

    db.commit()
    db.refresh(band)
    return band.to_dict()

@router.delete("/salary-bands/{band_id}")
def delete_salary_band(
    band_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    """
    Xóa chức danh & dải lương khỏi CSDL.
    """
    band = db.query(SalaryBand).filter(SalaryBand.id == band_id).first()
    if not band:
        raise HTTPException(status_code=404, detail="Không tìm thấy chức danh dải lương.")

    db.delete(band)
    db.commit()
    return {"message": "Xóa chức danh dải lương thành công", "id": band_id}


# =========================================================================
# 3. COMPETENCY FRAMEWORK API
# =========================================================================
@router.get("/competencies")
def get_competency_framework(db: Session = Depends(get_db)):
    return {
        "version": "v1.0 (Lưu ngày 15/08/2026)",
        "criteria": [
            {
                "id": "crit-1",
                "category": "Khung Năng Lực Chuyên Môn Kỹ Thuật & Tư Duy Hệ Thống",
                "weight": "60%",
                "items": [
                    {
                        "id": "c-101",
                        "title": "Kiến thức Chuyên môn Kỹ thuật & Tư duy Kiến trúc",
                        "description": "Nắm vững nguyên lý Clean Code, Design Patterns và xử lý bài toán hiệu năng cao.",
                        "score": 4.5,
                    },
                    {
                        "id": "c-102",
                        "title": "Kỹ năng Lập trình Thực chiến & Tối ưu Codebase",
                        "description": "Khả năng viết unit test, refactor code cũ và làm chủ frameworks.",
                        "score": 4.2,
                    }
                ]
            },
            {
                "id": "crit-2",
                "category": "Khung Năng Lực Văn Hóa & Kỹ Năng Mềm",
                "weight": "40%",
                "items": [
                    {
                        "id": "c-201",
                        "title": "Kỹ năng Giao tiếp & Làm việc nhóm",
                        "description": "Truyền đạt rõ ràng, lắng nghe và hợp tác tốt với các bên.",
                        "score": 4.8,
                    },
                    {
                        "id": "c-202",
                        "title": "Tư duy Giải quyết Vấn đề & Chủ động trong công việc",
                        "description": "Tự chủ giải quyết sự cố và đề xuất cải tiến liên tục.",
                        "score": 4.6,
                    }
                ]
            }
        ]
    }
