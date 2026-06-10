"""
회원 / 미수금명단 라우터
- 미수금명단(중심 화면): 정상 & 미수>0 필터 기본
- 전체자명단: status/has_arrears 필터로 동일 엔드포인트 재사용
- 회원 상세(드로어), 메모 수정
- 수납 반영 / 폐업 등록  → 골격 단계에서는 stub (다음 단계에서 services 로 구현)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Member
from ..schemas import (
    ClosureCreate,
    ClosureOut,
    MemberBase,
    MemberDetail,
    MemberUpdate,
    PaymentApply,
)

router = APIRouter(prefix="/api/members", tags=["members"])


@router.get("", response_model=list[MemberBase])
def list_members(
    q: str | None = Query(None, description="이름/차량번호/관리번호 검색"),
    sigun: str | None = None,
    member_type: str | None = None,
    membership: str | None = None,
    status: str | None = Query(None, description="정상/폐업/양도/이관/탈퇴"),
    has_arrears: bool | None = Query(None, description="미수금명단=True"),
    page: int = 1,
    size: int = 50,
    db: Session = Depends(get_db),
):
    stmt = select(Member)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (Member.name.like(like))
            | (Member.vehicle_no.like(like))
            | (Member.mgmt_no.like(like))
        )
    if sigun:
        stmt = stmt.where(Member.sigun == sigun)
    if member_type:
        stmt = stmt.where(Member.member_type == member_type)
    if membership:
        stmt = stmt.where(Member.membership == membership)
    if status:
        stmt = stmt.where(Member.status == status)
    # NOTE: has_arrears 필터는 receivable_items 집계 기준으로 다음 단계에서 구현
    stmt = stmt.offset((page - 1) * size).limit(size)
    return db.scalars(stmt).all()


@router.get("/{member_id}", response_model=MemberDetail)
def get_member(member_id: str, db: Session = Depends(get_db)):
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")
    # arrears_months/arrears_amount 집계는 다음 단계 services 에서 채운다.
    detail = MemberDetail.model_validate(member)
    return detail


@router.patch("/{member_id}", response_model=MemberBase)
def update_member(member_id: str, payload: MemberUpdate, db: Session = Depends(get_db)):
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")
    if payload.memo is not None:
        member.memo = payload.memo
    if payload.phone is not None:
        member.phone = payload.phone
    db.commit()
    db.refresh(member)
    return member


@router.post("/{member_id}/payments", status_code=501)
def apply_payment(member_id: str, payload: PaymentApply, db: Session = Depends(get_db)):
    """수납 반영 — 프로토타입 applyPayment 로직 이식 예정.
    입금액으로 가능한 개월수만큼 미수목록 차감 + payments 행 추가."""
    raise HTTPException(status_code=501, detail="수납 반영은 다음 단계에서 구현됩니다.")


@router.post("/{member_id}/closure", status_code=501, response_model=ClosureOut)
def register_closure(member_id: str, payload: ClosureCreate, db: Session = Depends(get_db)):
    """폐업/양도/이관/탈퇴 등록 — 프로토타입 confirmClosure 로직 이식 예정.
    closures 행 추가 + members.status 변경(미수금명단에서 제외)."""
    raise HTTPException(status_code=501, detail="폐업 등록은 다음 단계에서 구현됩니다.")
