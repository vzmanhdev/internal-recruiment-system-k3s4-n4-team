from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.models.candidate import Candidate, Application

router = APIRouter()

class CandidateCreate(BaseModel):
    fullName: str
    email: str
    phone: Optional[str] = None
    avatarUrl: Optional[str] = None
    cvUrl: Optional[str] = None
    source: Optional[str] = "Internal Referral"
    status: Optional[str] = "Applied"
    talentPool: Optional[bool] = False

class ApplicationCreate(BaseModel):
    jobId: str
    candidateId: str
    stage: Optional[str] = "Applied"
    referrerName: Optional[str] = None
    notes: Optional[str] = None

@router.get("", response_model=List[dict])
def get_candidates(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).all()
    return [c.to_dict() for c in candidates]

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_candidate(cand_in: CandidateCreate, db: Session = Depends(get_db)):
    existing = db.query(Candidate).filter(Candidate.email == cand_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email ứng viên đã tồn tại")
    cand_id = f"cand-{int(db.query(Candidate).count()) + 1}"
    new_cand = Candidate(
        id=cand_id,
        full_name=cand_in.fullName,
        email=cand_in.email,
        phone=cand_in.phone,
        avatar_url=cand_in.avatarUrl,
        cv_url=cand_in.cvUrl,
        source=cand_in.source or "Internal Referral",
        status=cand_in.status or "Applied",
        talent_pool=cand_in.talentPool or False
    )
    db.add(new_cand)
    db.commit()
    db.refresh(new_cand)
    return new_cand.to_dict()

@router.get("/applications", response_model=List[dict])
def get_applications(db: Session = Depends(get_db)):
    apps = db.query(Application).all()
    return [a.to_dict() for a in apps]

@router.post("/applications", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_application(app_in: ApplicationCreate, db: Session = Depends(get_db)):
    app_id = f"app-{int(db.query(Application).count()) + 1}"
    new_app = Application(
        id=app_id,
        job_id=app_in.jobId,
        candidate_id=app_in.candidateId,
        stage=app_in.stage or "Applied",
        referrer_name=app_in.referrerName,
        notes=app_in.notes
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app.to_dict()

@router.patch("/applications/{app_id}/stage")
def update_application_stage(app_id: str, stage: str, db: Session = Depends(get_db)):
    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    app_obj.stage = stage
    db.commit()
    return app_obj.to_dict()
