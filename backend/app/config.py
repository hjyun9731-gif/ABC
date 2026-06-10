"""
환경설정 (config)
------------------
- DATABASE_URL 은 Railway PostgreSQL 플러그인이 자동 주입한다.
- Railway/Heroku 계열은 'postgres://' 또는 'postgresql://' 스킴을 주는데,
  SQLAlchemy + psycopg(v3) 는 'postgresql+psycopg://' 를 기대하므로 보정한다.
- DATABASE_URL 이 없으면 로컬 개발용 sqlite 로 떨어진다.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_db_url(url: str) -> str:
    """Railway 가 주는 postgres URL 을 psycopg 드라이버용으로 보정."""
    if not url:
        return url
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # 비어 있으면 로컬 sqlite. 운영에서는 Railway 가 DATABASE_URL 주입.
    database_url: str = "sqlite:///./local.db"

    # 단일 서비스(FastAPI 가 프론트 정적 서빙)면 보통 CORS 불필요.
    # 프론트를 별도 서비스로 분리할 때만 도메인을 콤마로 나열.
    allowed_origins: str = "*"

    app_name: str = "미수금관리"

    @property
    def sqlalchemy_url(self) -> str:
        return normalize_db_url(self.database_url)

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
