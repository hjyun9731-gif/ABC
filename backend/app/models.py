"""
ORM 모델 (models)
-----------------
프로토타입 data.jsx 의 중첩 객체를 정규화한 테이블 정의.
- members          회원 (미수금명단/전체자명단의 원천)
- receivable_items 미수목록 (member 1:N)
- payments         수납/납부 내역 (member 1:N)
- deposits         통장 입금내역 (통장매칭)
- closures         폐업/처리 정보 (member 1:N, 이력 보존)
- pending          신규·예정자
- member_history   수정이력 (선택)

미수월수/미수금액/장기미납/고액 등은 receivable_items 에서 집계 가능한 파생값이라
컬럼으로 저장하지 않고 서비스 레이어에서 계산한다(필요 시 캐시 컬럼 추가는 추가 전용 마이그레이션으로).
"""

from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Member(Base):
    __tablename__ = "misu_members"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)        # 'M00001'
    mgmt_no: Mapped[str] = mapped_column(String(16), unique=True, index=True)  # 관리번호
    reg_type: Mapped[str] = mapped_column(String(8))                     # 등록구분: 신규/양도양수
    name: Mapped[str] = mapped_column(String(40), index=True)            # 이름
    vehicle_no: Mapped[str] = mapped_column(String(20), index=True)      # 차량번호
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True) # 연락처
    sigun: Mapped[str] = mapped_column(String(20), index=True)           # 시군
    region_raw: Mapped[str | None] = mapped_column(String(40), nullable=True)  # 지역원본
    member_type: Mapped[str] = mapped_column(String(8))                  # 개인/택배
    membership: Mapped[str] = mapped_column(String(12), index=True)      # 협회가입/협회미가입
    birth_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cert_issue_date: Mapped[date | None] = mapped_column(Date, nullable=True)   # 자격증명발급일
    assoc_join_date: Mapped[date | None] = mapped_column(Date, nullable=True)   # 협회가입일
    billing_start_ym: Mapped[str | None] = mapped_column(String(7), nullable=True)  # 'YYYY-MM'
    charge_item: Mapped[str] = mapped_column(String(8))                  # 관리비/협회비
    monthly_charge: Mapped[int] = mapped_column(Integer, default=0)
    last_payment_ym: Mapped[str | None] = mapped_column(String(7), nullable=True)
    status: Mapped[str] = mapped_column(String(8), default="정상", index=True)  # 정상/폐업/양도/이관/탈퇴
    is_disconnected: Mapped[bool] = mapped_column(Boolean, default=False)  # 결번
    cert_missing: Mapped[bool] = mapped_column(Boolean, default=False)     # 자격증명미발급
    memo: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    receivable_items: Mapped[list["ReceivableItem"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship(back_populates="member")
    closures: Mapped[list["Closure"]] = relationship(back_populates="member")


class ReceivableItem(Base):
    __tablename__ = "misu_receivable_items"
    __table_args__ = (UniqueConstraint("member_id", "ym", name="uq_misu_receivable_member_ym"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    member_id: Mapped[str] = mapped_column(ForeignKey("misu_members.id"), index=True)
    ym: Mapped[str] = mapped_column(String(7))            # 'YYYY-MM'
    charge_item: Mapped[str] = mapped_column(String(8))
    amount: Mapped[int] = mapped_column(Integer)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    member: Mapped["Member"] = relationship(back_populates="receivable_items")


class Payment(Base):
    __tablename__ = "misu_payments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    member_id: Mapped[str] = mapped_column(ForeignKey("misu_members.id"), index=True)
    paid_for_ym: Mapped[str] = mapped_column(String(7))   # 어느 달 분 납부인지
    charge_item: Mapped[str] = mapped_column(String(8))
    amount: Mapped[int] = mapped_column(Integer)
    method: Mapped[str] = mapped_column(String(12))       # 통장매칭/현금/CMS
    paid_date: Mapped[date] = mapped_column(Date)
    deposit_id: Mapped[int | None] = mapped_column(
        ForeignKey("misu_deposits.id"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    member: Mapped["Member"] = relationship(back_populates="payments")
    deposit: Mapped["Deposit | None"] = relationship(back_populates="payments")


class Deposit(Base):
    __tablename__ = "misu_deposits"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    deposit_date: Mapped[date] = mapped_column(Date, index=True)   # 일자
    depositor_name: Mapped[str] = mapped_column(String(40), index=True)  # 입금자명
    amount: Mapped[int] = mapped_column(Integer)                   # 입금액
    memo: Mapped[str | None] = mapped_column(String(60), nullable=True)  # 적요
    status: Mapped[str] = mapped_column(String(8), default="대기", index=True)
    # 상태: 대기/매칭완료/중복/미매칭/제외/확인필요
    matched_member_id: Mapped[str | None] = mapped_column(
        ForeignKey("misu_members.id"), nullable=True
    )
    is_excluded: Mapped[bool] = mapped_column(Boolean, default=False)
    hint: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    payments: Mapped[list["Payment"]] = relationship(back_populates="deposit")


class Closure(Base):
    __tablename__ = "misu_closures"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    member_id: Mapped[str] = mapped_column(ForeignKey("misu_members.id"), index=True)
    type: Mapped[str] = mapped_column(String(8))          # 폐업/양도/이관/탈퇴
    process_date: Mapped[date] = mapped_column(Date)      # 처리일
    doc_no: Mapped[str | None] = mapped_column(String(40), nullable=True)  # 공문번호
    content: Mapped[str | None] = mapped_column(Text, nullable=True)       # 내용
    unpaid_balance: Mapped[int] = mapped_column(Integer, default=0)        # 미납잔액
    notify_later: Mapped[bool] = mapped_column(Boolean, default=False)     # 추후납부안내
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    member: Mapped["Member"] = relationship(back_populates="closures")


class Pending(Base):
    __tablename__ = "misu_pending"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(40))
    vehicle_no: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    sigun: Mapped[str] = mapped_column(String(20))
    region_raw: Mapped[str | None] = mapped_column(String(40), nullable=True)
    member_type: Mapped[str] = mapped_column(String(8))
    membership: Mapped[str] = mapped_column(String(12))
    reg_type: Mapped[str] = mapped_column(String(8))
    cert_issue_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    step: Mapped[str] = mapped_column(String(20))         # 단계
    step_index: Mapped[int] = mapped_column(Integer, default=0)
    mgmt_no: Mapped[str | None] = mapped_column(String(16), nullable=True)
    expected_charge: Mapped[str | None] = mapped_column(String(8), nullable=True)  # 예상부과
    note: Mapped[str | None] = mapped_column(String(60), nullable=True)            # 비고
    promoted_member_id: Mapped[str | None] = mapped_column(
        ForeignKey("misu_members.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MemberHistory(Base):
    __tablename__ = "misu_member_history"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    member_id: Mapped[str] = mapped_column(ForeignKey("misu_members.id"), index=True)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    content: Mapped[str] = mapped_column(Text)
    actor: Mapped[str | None] = mapped_column(String(40), nullable=True)
