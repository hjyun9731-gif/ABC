"""
부과 규칙 (billing)
-------------------
프로토타입 data.jsx 의 BILLING / monthlyCharge / chargeType 를 그대로 이식.
부과 규칙은 이 파일 한 곳에서만 정의하고, 모든 화면/엔드포인트가 동일 규칙을 사용한다.
"""

from dataclasses import dataclass

# ---- 금액 규칙 ----
관리비 = 5000          # 협회 미가입(택배 등) — 자격증명 발급일 다음 달부터
협회비 = 10000         # 협회 가입자 — 가입일 다음 달부터
협회비_70세 = 5000     # 70세 이상 협회 가입자 인하

# 현재 부과 기준월
기준연 = 2026
기준월 = 6


@dataclass
class ChargeRules:
    관리비: int = 관리비
    협회비: int = 협회비
    협회비_70세: int = 협회비_70세
    기준연: int = 기준연
    기준월: int = 기준월


RULES = ChargeRules()


def monthly_charge(membership: str, age: int | None = None, birth_year: int | None = None) -> int:
    """회원의 월 부과액 (가입여부/연령 기반).
    age가 없으면 일반 협회비 기준으로 처리하고, 추후 생년/주민번호 반영 시 70세 감면 계산.
    """
    if membership == "협회가입":
        if age is not None and age >= 70:
            return RULES.협회비_70세
        return RULES.협회비
    return RULES.관리비


def charge_item(membership: str) -> str:
    """부과 항목명."""
    return "협회비" if membership == "협회가입" else "관리비"


# ---- 연월 유틸 ----
def next_month(year: int, month: int) -> tuple[int, int]:
    """'발급/가입일 다음 달부터' → 부과 시작월."""
    return (year + 1, 1) if month == 12 else (year, month + 1)


def ym_key(year: int, month: int) -> str:
    return f"{year}-{month:02d}"


def ym_label(year: int, month: int) -> str:
    return f"{str(year)[2:]}.{month:02d}"


def months_between(y1: int, m1: int, y2: int, m2: int) -> int:
    """두 연월 사이 개월 수(양끝 포함)."""
    return (y2 - y1) * 12 + (m2 - m1) + 1


def next_month_ym(d) -> str | None:
    """date/datetime 값을 받아 다음 달 YYYY-MM 반환."""
    if d is None:
        return None
    y, m = d.year, d.month
    ny, nm = next_month(y, m)
    return ym_key(ny, nm)
