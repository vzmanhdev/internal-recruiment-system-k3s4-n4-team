from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.job import JobPosting
from app.models.requisition import JobRequisition
from app.models.application import JobApplication
from app.models.hr import ApprovalFlow
from app.core.search import build_search_filter, build_search_score

router = APIRouter(prefix="/search", tags=["search"])


class SuggestionItem(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    category: str
    category_label: str
    score: int
    badge: str
    action_url: Optional[str] = None


@router.get("/suggestions", response_model=List[SuggestionItem])
def get_search_suggestions(
    q: str = Query(..., min_length=1),
    scope: str = Query("global"),
    limit: int = Query(8, ge=1, le=20),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    query_str = q.strip()
    if not query_str:
        return []

    suggestions: List[SuggestionItem] = []

    # 1. Users scope
    if scope in ("global", "users"):
        user_cols = [User.full_name, User.email, User.employee_code, User.department]
        score_expr = build_search_score(user_cols, query_str)
        users = (
            db.query(User, score_expr.label("score"))
            .filter(build_search_filter(user_cols, query_str))
            .order_by(score_expr.desc())
            .limit(limit)
            .all()
        )
        for u, sc in users:
            dept_part = f" • {u.department}" if u.department else ""
            badge = "Khớp chính xác" if sc >= 80 else "Khớp gần đúng"
            suggestions.append(
                SuggestionItem(
                    id=f"user-{u.id}",
                    title=u.full_name or u.email,
                    subtitle=f"{u.email} ({u.employee_code or 'N/A'}){dept_part}",
                    category="user",
                    category_label="Tài khoản",
                    score=sc,
                    badge=badge,
                    action_url=f"/admin/users?search={u.full_name or u.email}",
                )
            )

    # 2. Requisitions scope
    if scope in ("global", "requisitions"):
        req_cols = [JobRequisition.title, JobRequisition.code]
        score_expr = build_search_score(req_cols, query_str)
        reqs = (
            db.query(JobRequisition, score_expr.label("score"))
            .filter(build_search_filter(req_cols, query_str))
            .order_by(score_expr.desc())
            .limit(limit)
            .all()
        )
        for r, sc in reqs:
            badge = "Khớp chính xác" if sc >= 80 else "Khớp gần đúng"
            suggestions.append(
                SuggestionItem(
                    id=f"req-{r.id}",
                    title=r.title,
                    subtitle=f"Mã: {r.code} • Số lượng: {r.quantity}",
                    category="requisition",
                    category_label="Tờ trình",
                    score=sc,
                    badge=badge,
                    action_url=f"/hr/requisitions?search={r.code}",
                )
            )

    # 3. Candidates scope
    if scope in ("global", "candidates"):
        cand_cols = [JobApplication.full_name, JobApplication.email, JobApplication.phone]
        score_expr = build_search_score(cand_cols, query_str)
        cands = (
            db.query(JobApplication, score_expr.label("score"))
            .filter(build_search_filter(cand_cols, query_str))
            .order_by(score_expr.desc())
            .limit(limit)
            .all()
        )
        for c, sc in cands:
            badge = "Khớp chính xác" if sc >= 80 else "Khớp gần đúng"
            suggestions.append(
                SuggestionItem(
                    id=f"cand-{c.id}",
                    title=c.full_name,
                    subtitle=f"{c.email} • {c.phone or 'Chưa có SĐT'}",
                    category="candidate",
                    category_label="Ứng viên",
                    score=sc,
                    badge=badge,
                    action_url=f"/recruiter/candidates?search={c.full_name}",
                )
            )

    # 4. Jobs scope
    if scope in ("global", "jobs"):
        job_cols = [JobPosting.title, JobPosting.description]
        score_expr = build_search_score(job_cols, query_str)
        jobs = (
            db.query(JobPosting, score_expr.label("score"))
            .filter(build_search_filter(job_cols, query_str))
            .order_by(score_expr.desc())
            .limit(limit)
            .all()
        )
        for j, sc in jobs:
            badge = "Khớp chính xác" if sc >= 80 else "Khớp gần đúng"
            suggestions.append(
                SuggestionItem(
                    id=f"job-{j.id}",
                    title=j.title,
                    subtitle=f"{j.department_name or 'Toàn doanh nghiệp'} • {j.location or 'Hà Nội'}",
                    category="job",
                    category_label="Việc làm",
                    score=sc,
                    badge=badge,
                    action_url=f"/jobs?search={j.title}",
                )
            )

    # 5. Approval flows scope
    if scope in ("global", "approval_flows"):
        flow_cols = [ApprovalFlow.name]
        score_expr = build_search_score(flow_cols, query_str)
        flows = (
            db.query(ApprovalFlow, score_expr.label("score"))
            .filter(ApprovalFlow.is_deleted == False, build_search_filter(flow_cols, query_str))
            .order_by(score_expr.desc())
            .limit(limit)
            .all()
        )
        for f, sc in flows:
            badge = "Khớp chính xác" if sc >= 80 else "Khớp gần đúng"
            suggestions.append(
                SuggestionItem(
                    id=f"flow-{f.id}",
                    title=f.name,
                    subtitle=f"Loại: {f.approval_type or 'Mặc định'} • Các bước: {len(f.steps())}",
                    category="approval_flow",
                    category_label="Luồng duyệt",
                    score=sc,
                    badge=badge,
                    action_url=f"/hr/master-data/approval-flows?search={f.name}",
                )
            )

    # Sort all aggregated suggestions by score descending
    suggestions.sort(key=lambda item: item.score, reverse=True)
    return suggestions[:limit]
