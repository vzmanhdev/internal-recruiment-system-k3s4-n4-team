from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import time

from app.db.session import get_db
from app.models.competency import CompetencyFramework, CompetencyCriteria, InterviewQuestion
from app.models.user import User
from app.core.dependencies import get_current_user, require_roles

router = APIRouter()

# =========================================================================
# PYDANTIC SCHEMAS
# =========================================================================

class CriteriaSchema(BaseModel):
    id: Optional[str] = None
    code: str
    name: str
    description: Optional[str] = ""
    weight: int

class FrameworkCreate(BaseModel):
    code: str
    name: str
    department: str
    appliedJobTitles: List[str] = []
    criteriaList: List[CriteriaSchema] = []
    status: Optional[str] = "active"

class FrameworkUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    appliedJobTitles: Optional[List[str]] = None
    criteriaList: Optional[List[CriteriaSchema]] = None
    status: Optional[str] = None

class QuestionCreate(BaseModel):
    code: str
    content: str
    criteriaId: Optional[str] = ""
    criteriaName: str
    jobTitle: str
    difficulty: Optional[str] = "medium"
    suggestedAnswer: Optional[str] = ""

class QuestionUpdate(BaseModel):
    content: Optional[str] = None
    criteriaName: Optional[str] = None
    jobTitle: Optional[str] = None
    difficulty: Optional[str] = None
    suggestedAnswer: Optional[str] = None
    status: Optional[str] = None

# =========================================================================
# COMPETENCY FRAMEWORKS ENDPOINTS
# =========================================================================

@router.get("/frameworks", response_model=List[dict])
def get_frameworks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    frameworks = db.query(CompetencyFramework).all()
    return [f.to_dict() for f in frameworks]

@router.post("/frameworks", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_framework(
    fw_in: FrameworkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    # Validate duplicate code
    existing = db.query(CompetencyFramework).filter(CompetencyFramework.code == fw_in.code.upper()).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Mã khung năng lực '{fw_in.code}' đã tồn tại trong CSDL. Vui lòng chọn mã khác."
        )

    # Validate weight sum == 100%
    total_weight = sum(c.weight for c in fw_in.criteriaList)
    if total_weight != 100:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể lưu: Tổng trọng số các tiêu chí phải đúng bằng 100% (Hiện tại: {total_weight}%)."
        )

    fw_id = f"cf-{int(time.time() * 1000)}"
    new_fw = CompetencyFramework(
        id=fw_id,
        code=fw_in.code.upper(),
        name=fw_in.name,
        department=fw_in.department,
        status=fw_in.status or "active",
        updated_at="Vừa tạo"
    )
    new_fw.set_applied_job_titles(fw_in.appliedJobTitles)
    db.add(new_fw)
    db.commit()

    # Create nested criteria
    for idx, c in enumerate(fw_in.criteriaList):
        c_id = f"c-{fw_id}-{idx + 1}"
        new_c = CompetencyCriteria(
            id=c_id,
            framework_id=fw_id,
            code=c.code,
            name=c.name,
            description=c.description or "",
            weight=c.weight
        )
        db.add(new_c)

    db.commit()
    db.refresh(new_fw)
    return new_fw.to_dict()

@router.put("/frameworks/{framework_id}", response_model=dict)
def update_framework(
    framework_id: str,
    fw_in: FrameworkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    fw = db.query(CompetencyFramework).filter(CompetencyFramework.id == framework_id).first()
    if not fw:
        raise HTTPException(status_code=404, detail="Khung năng lực không tồn tại.")

    if fw_in.name is not None:
        fw.name = fw_in.name
    if fw_in.department is not None:
        fw.department = fw_in.department
    if fw_in.appliedJobTitles is not None:
        fw.set_applied_job_titles(fw_in.appliedJobTitles)
    if fw_in.status is not None:
        fw.status = fw_in.status
    
    fw.updated_at = "Vừa cập nhật"

    # If updating criteria list, validate total weight == 100%
    if fw_in.criteriaList is not None:
        total_weight = sum(c.weight for c in fw_in.criteriaList)
        if total_weight != 100:
            raise HTTPException(
                status_code=400,
                detail=f"Không thể lưu: Tổng trọng số các tiêu chí phải đúng bằng 100% (Hiện tại: {total_weight}%)."
            )

        # Delete existing criteria and recreate
        db.query(CompetencyCriteria).filter(CompetencyCriteria.framework_id == framework_id).delete()
        for idx, c in enumerate(fw_in.criteriaList):
            c_id = c.id if c.id and not c.id.startswith("crit-") else f"c-{framework_id}-{idx + 1}"
            new_c = CompetencyCriteria(
                id=c_id,
                framework_id=framework_id,
                code=c.code,
                name=c.name,
                description=c.description or "",
                weight=c.weight
            )
            db.add(new_c)

    db.commit()
    db.refresh(fw)
    return fw.to_dict()

@router.delete("/frameworks/{framework_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_framework(
    framework_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    fw = db.query(CompetencyFramework).filter(CompetencyFramework.id == framework_id).first()
    if not fw:
        raise HTTPException(status_code=404, detail="Khung năng lực không tồn tại.")
    
    db.delete(fw)
    db.commit()
    return None

# =========================================================================
# INTERVIEW QUESTIONS ENDPOINTS
# =========================================================================

@router.get("/questions", response_model=List[dict])
def get_questions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    questions = db.query(InterviewQuestion).all()
    return [q.to_dict() for q in questions]

@router.post("/questions", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_question(
    q_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    existing = db.query(InterviewQuestion).filter(InterviewQuestion.code == q_in.code.upper()).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Mã câu hỏi '{q_in.code}' đã tồn tại trong ngân hàng câu hỏi."
        )

    q_id = f"q-{int(time.time() * 1000)}"
    new_q = InterviewQuestion(
        id=q_id,
        code=q_in.code.upper(),
        content=q_in.content,
        criteria_id=q_in.criteriaId,
        criteria_name=q_in.criteriaName,
        job_title=q_in.jobTitle,
        difficulty=q_in.difficulty or "medium",
        suggested_answer=q_in.suggestedAnswer or "",
        is_referenced=False,
        status="active",
        times_used=0
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q.to_dict()

@router.put("/questions/{question_id}", response_model=dict)
def update_question(
    question_id: str,
    q_in: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    q = db.query(InterviewQuestion).filter(InterviewQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Câu hỏi không tồn tại.")

    if q_in.content is not None:
        q.content = q_in.content
    if q_in.criteriaName is not None:
        q.criteria_name = q_in.criteriaName
    if q_in.jobTitle is not None:
        q.job_title = q_in.jobTitle
    if q_in.difficulty is not None:
        q.difficulty = q_in.difficulty
    if q_in.suggestedAnswer is not None:
        q.suggested_answer = q_in.suggestedAnswer
    if q_in.status is not None:
        q.status = q_in.status

    db.commit()
    db.refresh(q)
    return q.to_dict()

@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    q = db.query(InterviewQuestion).filter(InterviewQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Câu hỏi không tồn tại.")

    if q.is_referenced:
        raise HTTPException(
            status_code=400,
            detail=f"Câu hỏi '{q.code}' đã được sử dụng trong phỏng vấn. Không thể xóa để đảm bảo lịch sử đánh giá."
        )

    db.delete(q)
    db.commit()
    return None
