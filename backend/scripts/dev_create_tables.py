"""
로컬 개발 전용 — 테이블 생성 (create_all)
-----------------------------------------
- create_all 은 '없는 테이블만' 만든다. 기존 테이블/데이터는 건드리지 않는다(추가 전용).
- 운영에서는 사용하지 말 것. 운영 스키마는 Alembic(`alembic upgrade head`)이 담당.
- 어떤 경우에도 drop 하지 않는다.
"""

from app.database import Base, engine
from app import models  # noqa: F401

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)  # IF NOT EXISTS 의미 — 기존 것 보존
    print("[dev] create_all 완료 (없는 테이블만 생성, 기존 데이터 보존).")
