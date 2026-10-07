from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.models.master_data import Department, SalaryBand
from app.models.audit_log import AuditLog

router = APIRouter()

# 1. DEPARTMENTS HIERARCHY API
@router.get("/departments")
def get_department_tree(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    if not depts:
        return [
            {
                "id": "dept-1",
                "code": "BGD",
                "name": "Ban Giám Đốc & Khối Điều Hành",
                "leader": "Trần Việt Long (Tổng Giám Đốc)",
                "approvedHeadcount": 5,
                "currentHeadcount": 5,
                "remainingHeadcount": 0,
                "children": [
                    {
                        "id": "dept-tech",
                        "code": "TECH",
                        "name": "Khối Công Nghệ & Sản Phẩm",
                        "leader": "Đỗ Văn Lâm (CTO)",
                        "approvedHeadcount": 35,
                        "currentHeadcount": 28,
                        "remainingHeadcount": 7,
                        "children": [
                            {
                                "id": "dept-dev",
                                "code": "DEV",
                                "name": "Trung Tâm Phát Triển Phần Mềm (Software Center)",
                                "leader": "Lê Trường Nhân",
                                "approvedHeadcount": 22,
                                "currentHeadcount": 18,
                                "remainingHeadcount": 4,
                            },
                            {
                                "id": "dept-cloud",
                                "code": "INFRA",
                                "name": "Phòng Hạ Tầng & Bảo Mật Đám Mây",
                                "leader": "Hoàng Minh Tuấn",
                                "approvedHeadcount": 8,
                                "currentHeadcount": 6,
                                "remainingHeadcount": 2,
                            }
                        ]
                    }
                ]
            }
        ]
    return [d.to_dict() for d in depts]

# 2. SALARY BANDS CATALOGUE API
@router.get("/salary-bands")
def get_salary_bands(db: Session = Depends(get_db)):
    return [
        {
            "id": "sb-1",
            "title": "Kỹ Sư Phần Mềm Junior (Frontend / Backend)",
            "code": "DEV-JR",
            "level": "Junior",
            "department": "Trung Tâm Phát Triển Phần Mềm",
            "minSalary": 12000000,
            "maxSalary": 18000000,
            "spread": "+6 Triệu",
        },
        {
            "id": "sb-2",
            "title": "Chuyên Viên Phát Triển Phần Mềm Middle",
            "code": "DEV-MID",
            "level": "Middle",
            "department": "Trung Tâm Phát Triển Phần Mềm",
            "minSalary": 20000000,
            "maxSalary": 32000000,
            "spread": "+12 Triệu",
        },
        {
            "id": "sb-3",
            "title": "Kỹ Sư Phần Mềm Cao Cấp (Senior Engineer)",
            "code": "DEV-SR",
            "level": "Senior",
            "department": "Trung Tâm Phát Triển Phần Mềm",
            "minSalary": 35000000,
            "maxSalary": 52000000,
            "spread": "+17 Triệu",
        },
        {
            "id": "sb-4",
            "title": "Trưởng Nhóm Kỹ Thuật (Tech Lead / Architect)",
            "code": "TECH-LEAD",
            "level": "Lead",
            "department": "Khối Công Nghệ & Sản Phẩm",
            "minSalary": 48000000,
            "maxSalary": 68000000,
            "spread": "+20 Triệu",
        }
    ]

# 3. COMPETENCY FRAMEWORK API
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
