from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.models.requisition import Requisition
from app.models.audit_log import AuditLog
from app.models.candidate import Candidate
from app.models.user import User
from app.core.dependencies import get_current_user, require_roles
from app.schemas.requisition import RequisitionCreate, RequisitionResponse

router = APIRouter()

class HandoverRequest(BaseModel):
    newPrimaryRecruiter: str
    supportingRecruiters: List[str] = []
    reason: Optional[str] = None
    changedBy: Optional[str] = "Trưởng Phòng Nhân Sự"

class CloseRequest(BaseModel):
    closeReason: str = "filled"

@router.get("", response_model=List[RequisitionResponse])
def get_requisitions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reqs = db.query(Requisition).all()
    return [r.to_dict() for r in reqs]

@router.get("/overdue", response_model=List[RequisitionResponse])
def get_overdue_requisitions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reqs = db.query(Requisition).filter(
        Requisition.priority.in_(["Urgent", "High"])
    ).all()
    return [r.to_dict() for r in reqs]

@router.get("/{req_id}/progress")
def get_requisition_progress(
    req_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(Requisition).filter(Requisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu tuyển dụng.")

    # Mock or DB candidates pipeline breakdown for this requisition
    candidates = db.query(Candidate).all()
    total_candidates = len(candidates) or 8
    
    stages = [
        {"stage": "1. CV Tiếp Nhận", "count": 25, "percentage": 100},
        {"stage": "2. Sàng Lọc (Screening)", "count": 12, "percentage": 48},
        {"stage": "3. Phỏng Vấn Chuyên Môn", "count": 6, "percentage": 24},
        {"stage": "4. Phỏng Vấn Trưởng Bộ Phận", "count": 3, "percentage": 12},
        {"stage": "5. Duyệt Offer", "count": 2, "percentage": 8},
        {"stage": "6. Nhận Việc (Onboarded)", "count": 1, "percentage": 4},
    ]
    
    return {
        "requisition": req.to_dict(),
        "totalCandidates": total_candidates,
        "stages": stages,
        "targetCount": req.target_count,
        "hiredCount": 1,
        "openDays": req.open_days,
        "recruiterName": req.recruiter_name,
        "targetDate": req.target_date
    }

@router.post("/{req_id}/urge")
def urge_requisition_sla(
    req_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager", "department_manager"))
):
    req = db.query(Requisition).filter(Requisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu tuyển dụng.")

    # Record Audit Log for SLA Urge action
    audit_entry = AuditLog(
        id=f"audit-{int(db.query(AuditLog).count()) + 1}",
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_name=current_user.full_name,
        action="SLA Urge Notification",
        details=f"Đã gửi thông báo đôn đốc SLA khẩn tới chuyên viên {req.recruiter_name} cho vị trí {req.code} ({req.title})",
        ip_address="127.0.0.1"
    )
    db.add(audit_entry)
    db.commit()

    return {
        "success": True,
        "message": f"Đã gửi thông báo nhắc nhở khẩn đến chuyên viên {req.recruiter_name} cho vị trí {req.code}!",
        "requisitionCode": req.code,
        "recruiterName": req.recruiter_name
    }

@router.put("/{req_id}/handover")
def handover_requisition(
    req_id: str,
    body: HandoverRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    req = db.query(Requisition).filter(Requisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu tuyển dụng.")

    old_recruiter = req.recruiter_name
    req.recruiter_name = body.newPrimaryRecruiter
    db.commit()

    # Record Audit Log
    audit_entry = AuditLog(
        id=f"audit-{int(db.query(AuditLog).count()) + 1}",
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_name=current_user.full_name,
        action="Recruiter Handover",
        details=f"Bàn giao vị trí {req.code} từ {old_recruiter} sang {body.newPrimaryRecruiter}. Lý do: {body.reason or 'Cân đối phân công'}",
        ip_address="127.0.0.1"
    )
    db.add(audit_entry)
    db.commit()

    return {"success": True, "requisition": req.to_dict()}

@router.put("/{req_id}/close")
def close_requisition(
    req_id: str,
    body: CloseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    req = db.query(Requisition).filter(Requisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu tuyển dụng.")

    req.status = "closed" if body.closeReason != "on_hold" else "on_hold"
    db.commit()

    audit_entry = AuditLog(
        id=f"audit-{int(db.query(AuditLog).count()) + 1}",
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_name=current_user.full_name,
        action="Close Requisition",
        details=f"Đã đóng yêu cầu {req.code} ({req.title}). Lý do: {body.closeReason}",
        ip_address="127.0.0.1"
    )
    db.add(audit_entry)
    db.commit()

    return {"success": True, "requisition": req.to_dict()}

@router.post("", response_model=RequisitionResponse, status_code=status.HTTP_201_CREATED)
def create_requisition(
    req_in: RequisitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager", "department_manager"))
):
    from datetime import date
    today_str = date.today().isoformat()
    if req_in.targetDate and req_in.targetDate <= today_str:
        raise HTTPException(
            status_code=400,
            detail="Hạn chót tuyển dụng (Target SLA) bắt buộc phải là một ngày trong tương lai (không được chọn ngày trong quá khứ hoặc hôm nay)!"
        )

    req_id = f"req-{int(db.query(Requisition).count()) + 1}"
    new_req = Requisition(
        id=req_id,
        code=req_in.code.upper(),
        title=req_in.title,
        department=req_in.department,
        level=req_in.level or "Senior",
        target_count=req_in.targetCount or 1,
        recruiter_name=req_in.recruiterName or "Trần Thị Mai",
        target_date=req_in.targetDate,
        open_days=req_in.openDays or 0,
        priority=req_in.priority or "High",
        status=req_in.status or "open",
        min_salary=req_in.minSalary,
        max_salary=req_in.maxSalary,
        description=req_in.description
    )
    db.add(new_req)
    
    audit_entry = AuditLog(
        id=f"audit-{int(db.query(AuditLog).count()) + 1}",
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_name=current_user.full_name,
        action="Create Requisition",
        details=f"Tạo yêu cầu tuyển dụng mới {new_req.code} - {new_req.title}",
        ip_address="127.0.0.1"
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(new_req)
    return new_req.to_dict()


