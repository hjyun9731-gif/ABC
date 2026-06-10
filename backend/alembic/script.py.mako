"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

⚠️ 추가 전용 정책: upgrade() 에는 create_table / add_column 만.
   downgrade() 의 drop 류는 운영 DB 에서 실행하지 않는다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    # 운영에서는 실행 금지(데이터 보존). 로컬에서만 참고.
    ${downgrades if downgrades else "pass"}
