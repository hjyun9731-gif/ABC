"""대시보드 라우터 — 집계 요약. (집계 로직은 다음 단계에서 채움)"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Closure, Member
from ..schemas import DashboardSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db)):
    total_members = db.scalar(select(func.count()).select_from(Member)) or 0
    closure_count = db.scalar(select(func.count()).select_from(Closure)) or 0
    # arrears_members / total_arrears_amount / month_payment 는
    # receivable_items · payments 집계로 다음 단계에서 계산한다.
    return DashboardSummary(
        total_members=total_members,
        closure_count=closure_count,
    )
