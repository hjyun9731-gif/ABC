"""통장매칭 라우터 — 입금내역 조회 + 매칭/제외."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Deposit, Member, MemberHistory, Payment
from ..schemas import DepositMatch

router = APIRouter(prefix="/api/deposits", tags=["deposits"])


def _open_items(member: Member):
    return sorted([x for x in member.receivable_items if not x.is_paid], key=lambda x: x.ym)


@router.get("")
def list_deposits(
    status: str | None = Query(None, description="대기/매칭완료/중복/미매칭/제외/확인필요"),
    page: int = 1,
    size: int = 500,
    db: Session = Depends(get_db),
):
    stmt = select(Deposit)
    if status:
        stmt = stmt.where(Deposit.status == status)
    stmt = stmt.order_by(Deposit.deposit_date.desc(), Deposit.id.desc()).offset((page - 1) * size).limit(size)
    rows = []
    for d in db.scalars(stmt).all():
        rows.append({
            "id": d.id,
            "deposit_date": d.deposit_date.isoformat(),
            "depositDate": d.deposit_date.isoformat(),
            "depositor_name": d.depositor_name,
            "depositorName": d.depositor_name,
            "amount": d.amount,
            "memo": d.memo,
            "status": d.status,
            "matched_member_id": d.matched_member_id,
            "candidateId": d.matched_member_id,
            "is_excluded": d.is_excluded,
            "hint": d.hint,
        })
    return rows


@router.post("/{deposit_id}/match")
def match_deposit(deposit_id: int, payload: DepositMatch, db: Session = Depends(get_db)):
    deposit = db.get(Deposit, deposit_id)
    if deposit is None:
        raise HTTPException(status_code=404, detail="입금내역을 찾을 수 없습니다.")
    if deposit.is_excluded:
        raise HTTPException(status_code=400, detail="제외 처리된 입금건은 매칭할 수 없습니다.")
    stmt = select(Member).options(selectinload(Member.receivable_items)).where(Member.id == payload.member_id)
    member = db.scalar(stmt)
    if member is None:
        raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")

    remain = deposit.amount
    applied = 0
    for item in _open_items(member):
        if remain <= 0:
            break
        pay_amount = min(remain, item.amount)
        if pay_amount <= 0:
            continue
        db.add(Payment(member_id=member.id, paid_for_ym=item.ym, charge_item=item.charge_item, amount=pay_amount, method="통장매칭", paid_date=deposit.deposit_date, deposit_id=deposit.id))
        applied += pay_amount
        remain -= pay_amount
        if pay_amount >= item.amount:
            item.is_paid = True
        else:
            item.amount -= pay_amount
        member.last_payment_ym = item.ym

    deposit.status = "매칭완료"
    deposit.matched_member_id = member.id
    deposit.hint = f"{member.name} / {member.vehicle_no} / 반영 {applied:,}원"
    db.add(MemberHistory(member_id=member.id, content=f"통장매칭 수납 반영 {applied:,}원 (입금자 {deposit.depositor_name})", actor="system"))
    db.commit()
    return {"ok": True, "deposit_id": deposit.id, "member_id": member.id, "applied": applied, "remain": remain}


@router.post("/{deposit_id}/exclude")
def exclude_deposit(deposit_id: int, db: Session = Depends(get_db)):
    deposit = db.get(Deposit, deposit_id)
    if deposit is None:
        raise HTTPException(status_code=404, detail="입금내역을 찾을 수 없습니다.")
    deposit.status = "제외"
    deposit.is_excluded = True
    deposit.hint = "사용자 제외 처리"
    db.commit()
    return {"ok": True, "deposit_id": deposit.id, "status": deposit.status}
