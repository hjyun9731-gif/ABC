"""폐업현황 라우터 — 처리된 회원 목록. (등록은 members/{id}/closure 재사용)"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Closure
from ..schemas import ClosureOut

router = APIRouter(prefix="/api/closures", tags=["closures"])


@router.get("", response_model=list[ClosureOut])
def list_closures(page: int = 1, size: int = 100, db: Session = Depends(get_db)):
    stmt = (
        select(Closure)
        .order_by(Closure.process_date.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return db.scalars(stmt).all()
