"""
Alembic 환경
------------
- 앱 설정(config.Settings)의 DATABASE_URL 을 그대로 사용.
- target_metadata = Base.metadata → autogenerate 가 models.py 를 인식.
- 마이그레이션은 추가 전용으로만 작성/실행한다. downgrade 의 drop 류는 운영에서 실행 금지.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# 앱 메타데이터/설정 로드
from app.config import get_settings
from app.database import Base
from app import models  # noqa: F401  (테이블 등록 위해 import 필요)

config = context.config

# 앱 설정의 DB URL 주입
config.set_main_option("sqlalchemy.url", get_settings().sqlalchemy_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
