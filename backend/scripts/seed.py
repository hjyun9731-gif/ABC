"""
시드 스크립트 (seed)
--------------------
데이터 보존 정책:
  - 이 스크립트는 **테이블이 비어 있을 때만** 데이터를 삽입한다.
  - 기존 행을 DELETE/TRUNCATE/UPDATE 하지 않는다.
  - 이미 데이터가 있으면 아무 것도 하지 않고 즉시 종료한다.

사용:
  python -m scripts.seed            # 빈 경우에만 시드
실데이터는 시드 대신 엑셀 import 로 적재할 예정(다음 단계).

골격 단계에서는 동작 확인용 샘플 1건만 넣는다.
프로토타입 data.jsx 의 buildDataset(3240명) 이식은 다음 단계에서 진행한다.
"""

import sys
from datetime import date

from sqlalchemy import func, select

from app.database import SessionLocal
from app.models import Member, ReceivableItem


def table_is_empty(db, model) -> bool:
    return (db.scalar(select(func.count()).select_from(model)) or 0) == 0


def seed() -> None:
    db = SessionLocal()
    try:
        if not table_is_empty(db, Member):
            print("[seed] members 테이블에 데이터가 이미 존재 → 시드 건너뜀 (데이터 보존).")
            return

        print("[seed] 빈 테이블 확인 → 샘플 데이터 삽입.")
        m = Member(
            id="M00001",
            mgmt_no="신26-001",
            reg_type="신규",
            name="홍길동",
            vehicle_no="강원80바1234",
            phone="010-1234-5678",
            sigun="춘천시",
            region_raw="춘천",
            member_type="개인",
            membership="협회가입",
            birth_year=1970,
            cert_issue_date=date(2020, 3, 10),
            assoc_join_date=date(2020, 4, 1),
            billing_start_ym="2020-05",
            charge_item="협회비",
            monthly_charge=10000,
            status="정상",
            memo="골격 단계 샘플",
        )
        db.add(m)
        db.add(
            ReceivableItem(
                member_id="M00001", ym="2026-06", charge_item="협회비",
                amount=10000, is_paid=False,
            )
        )
        db.commit()
        print("[seed] 샘플 1건 삽입 완료.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    sys.exit(0)
