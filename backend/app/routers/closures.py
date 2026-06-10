"""폐업현황 라우터 — 처리 이력."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Closure

router = APIRouter(prefix="/api/closures", tags=["closures"])


@router.get("")
def list_closures(page: int = 1, size: int = 300, db: Session = Depends(get_db)):
    stmt = select(Closure).options(selectinload(Closure.member)).order_by(Closure.process_date.desc()).offset((page - 1) * size).limit(size)
    rows = []
    for c in db.scalars(stmt).all():
        m = c.member
        rows.append({
            "id": c.id,
            "member_id": c.member_id,
            "memberId": c.member_id,
            "name": m.name if m else "",
            "vehicleNo": m.vehicle_no if m else "",
            "vehicle_no": m.vehicle_no if m else "",
            "sigun": m.sigun if m else "",
            "type": c.type,
            "processDate": c.process_date.isoformat(),
            "process_date": c.process_date.isoformat(),
            "docNo": c.doc_no,
            "doc_no": c.doc_no,
            "content": c.content,
            "unpaidBalance": c.unpaid_balance,
            "unpaid_balance": c.unpaid_balance,
            "notifyLater": c.notify_later,
            "notify_later": c.notify_later,
        })
    return rows
