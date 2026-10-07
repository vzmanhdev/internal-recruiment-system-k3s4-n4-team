from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.job import JobPosting
from app.models.candidate import Candidate
from app.models.requisition import Requisition

router = APIRouter()

@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db)):
    open_jobs_count = db.query(JobPosting).filter(JobPosting.status == "open").count()
    new_cvs_count = db.query(Candidate).count()
    
    return {
        "openJobs": {"count": open_jobs_count or 14, "growth": 16.7, "period": "so với tháng trước"},
        "newCvs": {"count": new_cvs_count or 48, "growth": 12.5, "period": "so với tuần trước"},
        "upcomingInterviews": {"count": 12, "growth": 8.3, "period": "so với tuần trước"},
        "pendingOffers": {"count": 5, "growth": -2.1, "period": "so với tuần trước"}
    }

@router.get("/weekly-cv-closed")
def get_weekly_cv_closed(db: Session = Depends(get_db)):
    return [
        {"week": "Tuần 36", "newCv": 24, "closedPositions": 2},
        {"week": "Tuần 37", "newCv": 32, "closedPositions": 3},
        {"week": "Tuần 38", "newCv": 28, "closedPositions": 1},
        {"week": "Tuần 39", "newCv": 42, "closedPositions": 4},
        {"week": "Tuần 40", "newCv": 39, "closedPositions": 2},
        {"week": "Tuần 41 (Hiện tại)", "newCv": 48, "closedPositions": 5},
    ]

@router.get("/funnel")
def get_funnel_stages(db: Session = Depends(get_db)):
    return [
        {"stage": "1. Ứng tuyển (CV nộp)", "count": 320, "conversionRate": 100, "dropOffRate": 0, "fillColor": "#4285F4"},
        {"stage": "2. Sàng lọc hồ sơ (Screening)", "count": 148, "conversionRate": 46.2, "dropOffRate": 53.8, "fillColor": "#3B82F6"},
        {"stage": "3. Phỏng vấn Chuyên môn (Vòng 1)", "count": 72, "conversionRate": 48.6, "dropOffRate": 51.4, "fillColor": "#60A5FA"},
        {"stage": "4. Phỏng vấn Trưởng BP (Vòng 2)", "count": 28, "conversionRate": 38.9, "dropOffRate": 61.1, "fillColor": "#93C5FD"},
        {"stage": "5. Soạn & Duyệt Offer", "count": 16, "conversionRate": 57.1, "dropOffRate": 42.9, "fillColor": "#10B981"},
        {"stage": "6. Nhận việc (Onboarded)", "count": 14, "conversionRate": 87.5, "dropOffRate": 12.5, "fillColor": "#059669"},
    ]
