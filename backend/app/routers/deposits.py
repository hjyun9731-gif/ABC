"""통장매칭 라우터 — 입금내역 조회 + 매칭/제외(stub)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Deposit
from ..schemas import DepositMatch, DepositOut

router = APIRouter(prefix="/api/deposits", tags=["deposits"])


@router.get("", response_model=list[DepositOut])
def list_deposits(
    status: str | None = Query(None, description="대기/매칭완료/중복/미매칭/제외/확인필요"),
    page: int = 1,
    size: int = 100,
    db: Session = Depends(get_db),
):
    stmt = select(Deposit)
    if status:
        stmt = stmt.where(Deposit.status == status)
    stmt = stmt.order_by(Deposit.deposit_date).offset((page - 1) * size).limit(size)
    return db.scalars(stmt).all()


@router.post("/{deposit_id}/match", status_code=501)
def match_deposit(deposit_id: int, payload: DepositMatch, db: Session = Depends(get_db)):
    """입금건을 회원에 매칭 → 내부적으로 수납 반영 호출 (다음 단계)."""
    raise HTTPException(status_code=501, detail="통장 매칭은 다음 단계에서 구현됩니다.")


@router.post("/{deposit_id}/exclude", status_code=501)
def exclude_deposit(deposit_id: int, db: Session = Depends(get_db)):
    """입금건 제외 처리 (협회운영비/이자/오입금 등). status='제외'."""
    raise HTTPException(status_code=501, detail="입금 제외는 다음 단계에서 구현됩니다.")
