"""
DB 연결 (database)
------------------
- engine / SessionLocal / Base / get_db 를 정의.
- 스키마 생성은 Alembic 마이그레이션이 담당한다(추가 전용).
  앱 시작 시 자동 create_all / drop 은 하지 않는다.  → 데이터 보존 정책.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from .config import get_settings

settings = get_settings()

# sqlite(로컬) 일 때만 필요한 옵션
connect_args = {}
if settings.sqlalchemy_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.sqlalchemy_url,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """모든 ORM 모델의 공통 베이스."""
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
