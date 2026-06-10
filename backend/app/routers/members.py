"""회원 / 미수금명단 라우터 — 실제 DB 기반 목록/상세/수납/폐업."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Closure, Member, MemberHistory, Payment, ReceivableItem
from ..schemas import ClosureCreate, MemberUpdate, PaymentApply

router = APIRouter(prefix="/api/members", tags=["members"])


def _open_items(member: Member) -> list[ReceivableItem]:
    return sorted([x for x in member.receivable_items if not x.is_paid], key=lambda x: x.ym)


def _member_dict(member: Member, detail: bool = False) -> dict:
    open_items = _open_items(member)
    paid_items = [x for x in member.receivable_items if x.is_paid]
    arrears_amount = sum(x.amount for x in open_items)
    out = {
        # DB 원본 필드
        "id": member.id,
        "mgmt_no": member.mgmt_no,
        "reg_type": member.reg_type,
        "name": member.name,
        "vehicle_no": member.vehicle_no,
        "phone": member.phone,
        "sigun": member.sigun,
        "region_raw": member.region_raw,
        "member_type": member.member_type,
        "membership": member.membership,
        "birth_year": member.birth_year,
        "cert_issue_date": member.cert_issue_date.isoformat() if member.cert_issue_date else None,
        "assoc_join_date": member.assoc_join_date.isoformat() if member.assoc_join_date else None,
        "billing_start_ym": member.billing_start_ym,
        "charge_item": member.charge_item,
        "monthly_charge": member.monthly_charge,
        "last_payment_ym": member.last_payment_ym,
        "status": member.status,
        "is_disconnected": member.is_disconnected,
        "cert_missing": member.cert_missing,
        "memo": member.memo,
        # 프론트 기존 화면 호환 camelCase 필드
        "mgmtNo": member.mgmt_no,
        "vehicleNo": member.vehicle_no,
        "memberType": member.member_type,
        "regionRaw": member.region_raw,
        "certIssueDate": member.cert_issue_date.isoformat() if member.cert_issue_date else None,
        "assocJoinDate": member.assoc_join_date.isoformat() if member.assoc_join_date else None,
        "billingStartYm": member.billing_start_ym,
        "chargeItem": member.charge_item,
        "monthlyCharge": member.monthly_charge,
        "lastPaymentYm": member.last_payment_ym,
        "disconnected": member.is_disconnected,
        "certMissing": member.cert_missing,
        "arrears_months": len(open_items),
        "arrears_amount": arrears_amount,
        "arrearsMonths": len(open_items),
        "totalArrears": arrears_amount,
        "age": (date.today().year - member.birth_year) if member.birth_year else None,
        "updatedAt": member.updated_at.isoformat() if member.updated_at else "",
    }
    if detail:
        out["receivable_items"] = [
            {"id": x.id, "ym": x.ym, "label": x.ym, "charge_item": x.charge_item, "item": x.charge_item, "amount": x.amount, "is_paid": x.is_paid, "paid": x.is_paid}
            for x in sorted(member.receivable_items, key=lambda x: x.ym)
        ]
        out["arrears"] = [
            {"id": x.id, "ym": x.ym, "label": x.ym, "charge_item": x.charge_item, "item": x.charge_item, "amount": x.amount, "is_paid": x.is_paid, "paid": x.is_paid}
            for x in sorted(member.receivable_items, key=lambda x: x.ym)
        ]
        out["payments"] = [
            {"id": p.id, "memberId": p.member_id, "paid_for_ym": p.paid_for_ym, "paidForYm": p.paid_for_ym, "charge_item": p.charge_item, "chargeItem": p.charge_item, "amount": p.amount, "method": p.method, "paid_date": p.paid_date.isoformat(), "paidDate": p.paid_date.isoformat()}
            for p in sorted(member.payments, key=lambda p: p.paid_date, reverse=True)
        ]
    else:
        out["arrears"] = [
            {"id": x.id, "ym": x.ym, "label": x.ym, "item": x.charge_item, "amount": x.amount, "paid": x.is_paid}
            for x in open_items[:12]
        ]
    return out


@router.get("")
def list_members(
    q: str | None = Query(None, description="이름/차량번호/관리번호 검색"),
    sigun: str | None = None,
    member_type: str | None = None,
    membership: str | None = None,
    status: str | None = Query(None, description="정상/폐업/양도/이관/탈퇴"),
    has_arrears: bool | None = Query(None, description="미수금명단=True"),
    page: int = 1,
    size: int = 500,
    db: Session = Depends(get_db),
):
    stmt = select(Member).options(selectinload(Member.receivable_items), selectinload(Member.payments))
    if q:
        like = f"%{q}%"
        stmt = stmt.where((Member.name.like(like)) | (Member.vehicle_no.like(like)) | (Member.mgmt_no.like(like)))
    if sigun:
        stmt = stmt.where(Member.sigun == sigun)
    if member_type:
        stmt = stmt.where(Member.member_type == member_type)
    if membership:
        stmt = stmt.where(Member.membership == membership)
    if status:
        stmt = stmt.where(Member.status == status)
    stmt = stmt.order_by(Member.sigun, Member.name).offset((page - 1) * size).limit(size)
    members = [_member_dict(m) for m in db.scalars(stmt).unique().all()]
    if has_arrears is True:
        members = [m for m in members if m["totalArrears"] > 0 and m["status"] == "정상"]
    if has_arrears is False:
        members = [m for m in members if m["totalArrears"] == 0]
    return members


@router.get("/{member_id}")
def get_member(member_id: str, db: Session = Depends(get_db)):
    stmt = select(Member).options(selectinload(Member.receivable_items), selectinload(Member.payments)).where(Member.id == member_id)
    member = db.scalar(stmt)
    if member is None:
        raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")
    return _member_dict(member, detail=True)


@router.patch("/{member_id}")
def update_member(member_id: str, payload: MemberUpdate, db: Session = Depends(get_db)):
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")
    before = member.memo or ""
    if payload.memo is not None:
        member.memo = payload.memo
    if payload.phone is not None:
        member.phone = payload.phone
    db.add(MemberHistory(member_id=member.id, content=f"회원정보 수정: memo {before!r} → {member.memo!r}", actor="system"))
    db.commit()
    db.refresh(member)
    return _member_dict(member)


@router.post("/{member_id}/payments")
def apply_payment(member_id: str, payload: PaymentApply, db: Session = Depends(get_db)):
    stmt = select(Member).options(selectinload(Member.receivable_items)).where(Member.id == member_id)
    member = db.scalar(stmt)
    if member is None:
        raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")
    remain = payload.amount
    if remain <= 0:
        raise HTTPException(status_code=400, detail="수납액은 0원보다 커야 합니다.")
    paid_count = 0
    for item in _open_items(member):
        if remain < item.amount:
            break
        remain -= item.amount
        item.is_paid = True
        db.add(Payment(member_id=member.id, paid_for_ym=item.ym, charge_item=item.charge_item, amount=item.amount, method=payload.method, paid_date=payload.paid_date or date.today(), deposit_id=payload.deposit_id))
        member.last_payment_ym = item.ym
        paid_count += 1
    db.add(MemberHistory(member_id=member.id, content=f"수납 반영 {payload.amount:,}원 / {paid_count}개월", actor="system"))
    db.commit()
    return {"ok": True, "paid_count": paid_count, "remain": remain, "member": get_member(member_id, db)}


@router.post("/{member_id}/closure")
def register_closure(member_id: str, payload: ClosureCreate, db: Session = Depends(get_db)):
    stmt = select(Member).options(selectinload(Member.receivable_items)).where(Member.id == member_id)
    member = db.scalar(stmt)
    if member is None:
        raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")
    unpaid = sum(x.amount for x in _open_items(member))
    closure = Closure(
        member_id=member.id,
        type=payload.type,
        process_date=payload.process_date,
        doc_no=payload.doc_no,
        content=payload.content or "미수금명단에서 이탈 처리",
        unpaid_balance=unpaid,
        notify_later=unpaid > 0 or payload.notify_later,
    )
    member.status = payload.type
    db.add(closure)
    db.add(MemberHistory(member_id=member.id, content=f"{payload.type} 처리 / 미수잔액 {unpaid:,}원", actor="system"))
    db.commit()
    return {"ok": True, "closure_id": closure.id, "unpaid_balance": unpaid, "notify_later": closure.notify_later}
