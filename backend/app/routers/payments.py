"""수납내역 라우터."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Member, Payment

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("")
def list_payments(
    member_id: str | None = None,
    page: int = 1,
    size: int = Query(500, le=5000),
    db: Session = Depends(get_db),
):
    stmt = select(Payment).options(selectinload(Payment.member))
    if member_id:
        stmt = stmt.where(Payment.member_id == member_id)
    stmt = stmt.order_by(Payment.paid_date.desc(), Payment.id.desc()).offset((page - 1) * size).limit(size)
    rows = []
    for p in db.scalars(stmt).all():
        m: Member | None = p.member
        rows.append({
            "id": p.id,
            "memberId": p.member_id,
            "member_id": p.member_id,
            "name": m.name if m else "",
            "vehicleNo": m.vehicle_no if m else "",
            "vehicle_no": m.vehicle_no if m else "",
            "paidForYm": p.paid_for_ym,
            "paid_for_ym": p.paid_for_ym,
            "chargeItem": p.charge_item,
            "charge_item": p.charge_item,
            "amount": p.amount,
            "method": p.method,
            "paidDate": p.paid_date.isoformat(),
            "paid_date": p.paid_date.isoformat(),
            "deposit_id": p.deposit_id,
        })
    return rows
