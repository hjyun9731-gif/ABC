"""신규·예정자 라우터 — 목록 + 등록/단계진행/전환(stub)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Pending
from ..schemas import PendingOut

router = APIRouter(prefix="/api/pending", tags=["pending"])


@router.get("", response_model=list[PendingOut])
def list_pending(db: Session = Depends(get_db)):
    stmt = select(Pending).order_by(Pending.step_index)
    return db.scalars(stmt).all()


@router.post("/{pending_id}/promote", status_code=501)
def promote_pending(pending_id: int, db: Session = Depends(get_db)):
    """예정자를 정식 회원(전체자명단)으로 전환 + 관리번호 부여 (다음 단계)."""
    raise HTTPException(status_code=501, detail="예정자 전환은 다음 단계에서 구현됩니다.")
