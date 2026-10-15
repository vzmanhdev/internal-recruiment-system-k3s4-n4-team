from typing import List, Optional
from pydantic import BaseModel

class AnalyticsOverview(BaseModel):
    total_requisitions: int
    total_jobs: int
    active_jobs: int
    total_applications: int
    hired_applications: int
    conversion_rate_pct: float
    total_referrals: int
    total_bonus_paid_vnd: float

class FunnelStageCount(BaseModel):
    stage: str
    stage_label: str
    count: int
    percentage: float

class DepartmentStat(BaseModel):
    department_id: int
    department_name: str
    job_count: int
    application_count: int
    hired_count: int

class TopReferrer(BaseModel):
    user_id: int
    full_name: str
    email: str
    total_referrals: int
    hired_referrals: int
    total_bonus_vnd: float

class ReferralAnalytics(BaseModel):
    total_referrals: int
    pending_referrals: int
    hired_referrals: int
    total_bonus_paid_vnd: float
    top_referrers: List[TopReferrer] = []
