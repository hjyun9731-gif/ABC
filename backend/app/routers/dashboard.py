"""대시보드 라우터 — DB 기준 집계."""

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Closure, Member, Payment, ReceivableItem

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    total_members = db.scalar(select(func.count()).select_from(Member)) or 0
    closure_count = db.scalar(select(func.count()).select_from(Closure)) or 0
    active_members = db.scalar(select(func.count()).select_from(Member).where(Member.status == "정상")) or 0
    total_arrears_amount = db.scalar(select(func.coalesce(func.sum(ReceivableItem.amount), 0)).where(ReceivableItem.is_paid == False)) or 0
    arrears_members = db.scalar(select(func.count(func.distinct(ReceivableItem.member_id))).where(ReceivableItem.is_paid == False)) or 0
    ym = date.today().strftime("%Y-%m")
    month_payment = db.scalar(select(func.coalesce(func.sum(Payment.amount), 0)).where(func.to_char(Payment.paid_date, "YYYY-MM") == ym)) or 0
    return {
        "total_members": total_members,
        "active_members": active_members,
        "arrears_members": arrears_members,
        "total_arrears_amount": total_arrears_amount,
        "month_payment": month_payment,
        "closure_count": closure_count,
    }
