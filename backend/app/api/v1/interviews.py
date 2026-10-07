from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from pydantic import BaseModel

from app.db.session import get_db
from app.models.interview import InterviewSchedule, EvaluationScorecard

router = APIRouter()

class InterviewCreate(BaseModel):
    applicationId: str
    candidateName: str
    jobTitle: str
    interviewers: List[str] = []
    startTime: str
    endTime: Optional[str] = None
    location: Optional[str] = "Google Meet / Phòng Hộp A"

class ScorecardCreate(BaseModel):
    applicationId: str
    interviewerName: str
    overallRecommendation: Optional[str] = "Strong Pass"
    ratings: Dict[str, int] = {}
    comments: Optional[str] = None

@router.get("", response_model=List[dict])
def get_interviews(db: Session = Depends(get_db)):
    interviews = db.query(InterviewSchedule).all()
    return [i.to_dict() for i in interviews]

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_interview(int_in: InterviewCreate, db: Session = Depends(get_db)):
    int_id = f"int-{int(db.query(InterviewSchedule).count()) + 1}"
    new_int = InterviewSchedule(
        id=int_id,
        application_id=int_in.applicationId,
        candidate_name=int_in.candidateName,
        job_title=int_in.jobTitle,
        start_time=int_in.startTime,
        end_time=int_in.endTime,
        location=int_in.location or "Google Meet / Phòng Hộp A"
    )
    new_int.set_interviewers(int_in.interviewers)
    db.add(new_int)
    db.commit()
    db.refresh(new_int)
    return new_int.to_dict()

@router.get("/scorecards/{application_id}", response_model=List[dict])
def get_scorecards(application_id: str, db: Session = Depends(get_db)):
    scorecards = db.query(EvaluationScorecard).filter(EvaluationScorecard.application_id == application_id).all()
    return [s.to_dict() for s in scorecards]

@router.post("/scorecards", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_scorecard(sc_in: ScorecardCreate, db: Session = Depends(get_db)):
    sc_id = f"sc-{int(db.query(EvaluationScorecard).count()) + 1}"
    new_sc = EvaluationScorecard(
        id=sc_id,
        application_id=sc_in.applicationId,
        interviewer_name=sc_in.interviewerName,
        overall_recommendation=sc_in.overallRecommendation or "Strong Pass",
        comments=sc_in.comments
    )
    new_sc.set_ratings(sc_in.ratings)
    db.add(new_sc)
    db.commit()
    db.refresh(new_sc)
    return new_sc.to_dict()
