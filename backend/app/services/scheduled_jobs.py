"""Daily jobs: SLA reminders (S5-10) and auto-hiding expired postings (S4-08), plus the outbox worker loop."""
import logging
import threading
import time
from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models.application import JobApplication
from app.models.hr import RecruiterAssignment
from app.models.job import JobPosting
from app.models.master_data import SlaRule
from app.models.notification import Notification
from app.services.notification_service import notify

logger = logging.getLogger("scheduled_jobs")


def expire_postings(db: Session, today: Optional[date] = None) -> int:
    today = today or date.today()
    closed = 0
    for job in db.query(JobPosting).filter(JobPosting.status == "published", JobPosting.deadline.isnot(None)).all():
        try:
            if date.fromisoformat(job.deadline[:10]) < today:
                job.status = "closed"
                closed += 1
        except ValueError:
            continue
    db.commit()
    return closed


def run_sla_check(db: Session, now: Optional[datetime] = None) -> dict:
    """Flag applications that stayed too long in a stage and remind the assigned recruiters once per day."""
    now = now or datetime.utcnow()
    rules = {r.stage: r.max_days for r in db.query(SlaRule).filter(SlaRule.is_active == True).all()}  # noqa: E712
    flagged, reminded = 0, 0
    today_key = now.strftime("%Y-%m-%d")
    for app in db.query(JobApplication).filter(JobApplication.status.in_(list(rules))).all():
        entered = app.stage_entered_at or app.created_at
        overdue = entered is not None and now - entered > timedelta(days=rules[app.status])
        if overdue != bool(app.is_overdue):
            app.is_overdue = overdue
        if not overdue:
            continue
        flagged += 1
        req_id = app.job_posting.requisition_id if app.job_posting else None
        recruiters = [r[0] for r in db.query(RecruiterAssignment.recruiter_id).filter(RecruiterAssignment.requisition_id == req_id).all()] if req_id else []
        for rid in recruiters:
            key = f"sla:{app.id}:{rid}:{today_key}"
            if db.query(Notification.id).filter(Notification.dedupe_key == key).first():
                continue  # no duplicate reminder on the same day
            created = notify(db, [rid], "sla_overdue", f"Hồ sơ quá hạn SLA: {app.full_name}",
                             f"Giai đoạn '{app.status}' quá {rules[app.status]} ngày", link=f"/hr/candidates?application={app.id}",
                             entity_type="APPLICATION", entity_id=app.id)
            if created:
                db.flush()
                last = db.query(Notification).filter(Notification.recipient_id == rid).order_by(Notification.id.desc()).first()
                last.dedupe_key = key
                reminded += 1
    db.commit()
    return {"flagged": flagged, "reminded": reminded}


_worker_started = False


def start_background_worker(session_factory, poll_seconds: int = 15) -> None:
    """Single in-process worker: delivers queued emails continuously and runs the daily jobs once per day."""
    global _worker_started
    if _worker_started:
        return
    _worker_started = True

    def loop():
        from app.services.email_dispatch import process_email_outbox
        last_daily = None
        while True:
            db = session_factory()
            try:
                process_email_outbox(db)
                if last_daily != date.today():
                    expire_postings(db)
                    run_sla_check(db)
                    last_daily = date.today()
            except Exception:
                logger.exception("background worker iteration failed")
                db.rollback()
            finally:
                db.close()
            time.sleep(poll_seconds)

    threading.Thread(target=loop, name="recruitment-worker", daemon=True).start()
