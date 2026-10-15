import json
from math import isclose
from fastapi import HTTPException
from app.models.hr import Competency
from app.models.referral_eval import CandidateEvaluation


def interview_scorecard(db, interview, evaluator_id):
    saved = db.query(CandidateEvaluation).filter_by(interview_id=interview.id, evaluator_id=evaluator_id).first()
    if saved and saved.criteria_scores:
        criteria = json.loads(saved.criteria_scores)
        return saved.framework_name, criteria, saved
    query = db.query(Competency).filter(Competency.is_active.is_(True))
    if interview.competency_category:
        name = interview.competency_category
    else:
        first = query.order_by(Competency.category, Competency.sort_order, Competency.id).first()
        if not first:
            raise HTTPException(status_code=409, detail='Chưa có khung năng lực. HR cần khai báo tiêu chí và tổng trọng số 100% tại Cấu hình nền tảng nhân sự')
        name = first.category
    criteria = [item.to_dict() for item in query.filter_by(category=name).order_by(Competency.sort_order, Competency.id).all()]
    if not criteria or not isclose(sum(item['weight'] for item in criteria), 100, abs_tol=0.01):
        raise HTTPException(status_code=409, detail=f'Khung {name} chưa hợp lệ: tổng trọng số phải bằng 100%')
    return name, criteria, saved


def calculate_scorecard(criteria, submitted):
    by_id = {item.criterion_id: item for item in submitted}
    if len(by_id) != len(submitted) or set(by_id) != {item['id'] for item in criteria}:
        raise HTTPException(status_code=400, detail='Cần chấm đầy đủ và đúng các tiêu chí của khung năng lực')
    snapshots = []
    for criterion in criteria:
        item = by_id[criterion['id']]
        if len(item.comment.strip()) < 5:
            raise HTTPException(status_code=400, detail='Nhận xét mỗi tiêu chí phải có ít nhất 5 ký tự')
        snapshots.append({
            'id': criterion['id'], 'name': criterion['name'], 'weight': criterion['weight'],
            'required_level': criterion['required_level'], 'description': criterion.get('description'),
            'score': item.score, 'comment': item.comment.strip(),
        })
    total = round(sum(item['score'] * item['weight'] / 100 for item in snapshots), 2)
    return snapshots, total
