"""Compatibility routes share the same approval, budget and access rules."""
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.api.v1 import requisition as workflow
from app.db.session import get_db
from app.models.requisition import JobRequisition
from app.schemas.requisition import RequisitionCreate as CanonicalCreate, RequisitionApprovalAction, RequisitionAssignment
from pydantic import BaseModel

router = APIRouter()
class RequisitionCreate(CanonicalCreate):
    reason: str = 'replacement'
    submit_immediately: bool = True
    reason_detail: Optional[str] = None
    priority: str = 'medium'
    is_salary_negotiable: bool = False
    target_onboard_date: Optional[str] = None
class ApprovalAction(RequisitionApprovalAction):
    action: str = 'approved'
class RecruiterAssignment(BaseModel):
    recruiter_id: int
    assignment_type: str = 'primary'
def existing_view(data):
    result = dict(data)
    if result.get('status') == 'pending_dept': result['status'] = 'pending_manager'
    return result
@router.get('')
def list_requisitions(status: str = 'all', authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    items, page = [], 1
    while True:
        result = workflow.list_requisitions(search='', status_filter='pending_dept' if status == 'pending_manager' else status, department_id=None, overdue=False, page=page, page_size=100, authorization=authorization, db=db)
        items.extend(existing_view(item) for item in result['items'])
        if page >= result['pages']: return items
        page += 1
@router.get('/{requisition_id}')
def get_requisition(requisition_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    return existing_view(workflow.get_requisition(requisition_id, authorization, db))
@router.post('', status_code=201)
def create_requisition(payload: RequisitionCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    data = workflow.create_requisition(CanonicalCreate(**payload.model_dump()), authorization, db)
    req = db.get(JobRequisition, data['id'])
    for name in ('reason_detail', 'priority', 'is_salary_negotiable', 'target_onboard_date'):
        setattr(req, name, getattr(payload, name))
    db.commit()
    db.refresh(req)
    return existing_view(req.to_dict())
@router.post('/{requisition_id}/approve')
def approve_requisition(requisition_id: int, payload: ApprovalAction, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    actions = {'approved': workflow.approve_requisition, 'rejected': workflow.reject_requisition, 'changes_requested': workflow.request_change, 'request_change': workflow.request_change}
    if payload.action not in actions: raise HTTPException(422, 'Thao tác phê duyệt không hợp lệ.')
    return existing_view(actions[payload.action](requisition_id, RequisitionApprovalAction(comment=payload.comment, override_budget=payload.override_budget), authorization, db))
@router.post('/{requisition_id}/assign-recruiters')
def assign_recruiter(requisition_id: int, payload: RecruiterAssignment, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    workflow.get_requisition(requisition_id, authorization, db)
    req = db.get(JobRequisition, requisition_id)
    if payload.assignment_type not in ('primary', 'secondary', 'support'): raise HTTPException(422, 'Loại phân công không hợp lệ.')
    primary = payload.recruiter_id if payload.assignment_type == 'primary' else req.recruiter_id
    support = req.support_recruiter_id if payload.assignment_type == 'primary' else payload.recruiter_id
    if not primary: raise HTTPException(422, 'Cần phân công người phụ trách chính trước.')
    return existing_view(workflow.assign_recruiter(requisition_id, RequisitionAssignment(recruiter_id=primary, support_recruiter_id=support), authorization, db))
