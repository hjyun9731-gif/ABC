"""엑셀 업로드/실제 데이터 반영 라우터.

목표
- 전체면허자현황/미수금명단/통장거래내역 등 엑셀을 업로드해 DB에 반영한다.
- 기본은 upsert/append 방식이며 DROP/TRUNCATE/DELETE는 절대 하지 않는다.
- 컬럼명이 조금 달라도 한국어 업무 엑셀에서 자주 쓰는 이름을 자동 추정한다.
"""

from __future__ import annotations

import io
import re
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..billing import charge_item, monthly_charge, next_month_ym
from ..database import get_db
from ..models import Deposit, Member, Payment, ReceivableItem

router = APIRouter(prefix="/api/import", tags=["import"])

SIGUN = [
    "춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시",
    "홍천군", "횡성군", "영월군", "평창군", "정선군", "철원군", "화천군",
    "양구군", "인제군", "고성군", "양양군",
]

NAME_KEYS = ["성명", "이름", "대표자", "대표자명", "회원명", "사업자명", "성명(대표자)", "성명대표자"]
VEHICLE_KEYS = ["차량번호", "차량 번호", "차량", "차량등록번호", "자동차등록번호", "자동차 등록번호", "등록번호", "차량No", "차량NO"]
PHONE_KEYS = ["휴대폰", "핸드폰", "전화번호", "연락처", "휴대전화", "휴대폰번호"]
REGION_KEYS = ["지역", "시군", "관할", "주소", "공문주소", "주소지", "사용본거지"]
MGMT_KEYS = ["관리번호", "관리 번호"]
MEMBER_TYPE_KEYS = ["회원구분", "구분", "개인택배", "업종"]
JOIN_KEYS = ["협회가입일", "가입일", "가입일자", "협회 가입일"]
CERT_KEYS = ["자격증명발급일", "자격증명 발급일", "자격증명발급일자", "발급일", "발급일자"]
AMOUNT_KEYS = ["미수금", "미납금액", "미납액", "미납", "합계", "총액", "금액", "미수금액", "잔액"]
DEPOSIT_NAME_KEYS = ["입금자명", "입금자", "예금주", "거래기록사항", "내용"]
DEPOSIT_DATE_KEYS = ["입금일", "거래일", "일자", "거래일자", "날짜"]
DEPOSIT_AMOUNT_KEYS = ["입금액", "입금", "금액", "거래금액"]


def _norm_col(c: Any) -> str:
    return re.sub(r"\s+", "", str(c or "").strip())


def _find_col(columns: list[str], candidates: list[str]) -> str | None:
    norm_map = {_norm_col(c): c for c in columns}
    for key in candidates:
        nk = _norm_col(key)
        if nk in norm_map:
            return norm_map[nk]
    for c in columns:
        nc = _norm_col(c)
        for key in candidates:
            if _norm_col(key) in nc:
                return c
    return None


def _clean(v: Any) -> str:
    if v is None:
        return ""
    if pd.isna(v):
        return ""
    s = str(v).strip()
    if s.endswith(".0"):
        s = s[:-2]
    return s.strip()


def _money(v: Any) -> int:
    s = _clean(v)
    if not s:
        return 0
    s = re.sub(r"[^0-9\-]", "", s)
    try:
        return max(0, int(s or 0))
    except ValueError:
        return 0


def _parse_date(v: Any) -> date | None:
    s = _clean(v)
    if not s:
        return None
    try:
        return pd.to_datetime(s).date()
    except Exception:
        pass
    # 주민/엑셀에서 20260610, 260610 형태 대응
    digits = re.sub(r"\D", "", s)
    try:
        if len(digits) == 8:
            return date(int(digits[:4]), int(digits[4:6]), int(digits[6:8]))
        if len(digits) == 6:
            yy = int(digits[:2])
            y = 2000 + yy if yy < 80 else 1900 + yy
            return date(y, int(digits[2:4]), int(digits[4:6]))
    except Exception:
        return None
    return None


def _sigun_from_text(text: str) -> str:
    for s in SIGUN:
        if s in text:
            return s
        short = s[:-1]
        if short and short in text:
            return s
    return "미분류"


def _vehicle_last4(vehicle: str) -> str:
    digits = re.findall(r"\d+", vehicle or "")
    if not digits:
        return ""
    return digits[-1][-4:]


def _member_type(row: dict[str, Any], vehicle: str, columns: list[str]) -> str:
    c = _find_col(columns, MEMBER_TYPE_KEYS)
    raw = _clean(row.get(c)) if c else ""
    joined = raw + " " + vehicle
    if "택배" in joined or "배" in vehicle:
        return "택배"
    return "개인"


def _membership(row: dict[str, Any], columns: list[str]) -> str:
    joined = " ".join(_clean(row.get(c)) for c in columns)
    join_col = _find_col(columns, JOIN_KEYS)
    if join_col and _clean(row.get(join_col)):
        return "협회가입"
    if "미가입" in joined:
        return "협회미가입"
    if "협회가입" in joined or "가입" in joined:
        return "협회가입"
    return "협회미가입"



def _json_safe(v: Any) -> Any:
    """FastAPI가 pandas/엑셀 값을 JSON으로 변환하다 500 나는 문제 방지."""
    if v is None:
        return ""
    try:
        if pd.isna(v):
            return ""
    except Exception:
        pass
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    # pandas Timestamp / numpy scalar 대응
    if hasattr(v, "isoformat") and "Timestamp" in type(v).__name__:
        try:
            return v.isoformat()
        except Exception:
            return str(v)
    if hasattr(v, "item"):
        try:
            return v.item()
        except Exception:
            pass
    return v


def _json_safe_row(row: dict[str, Any]) -> dict[str, Any]:
    return {str(k): _json_safe(v) for k, v in row.items()}


def _make_unique_columns(values: list[Any]) -> list[str]:
    seen: dict[str, int] = {}
    cols: list[str] = []
    for i, v in enumerate(values, start=1):
        name = _clean(v) or f"컬럼{i}"
        # 엑셀의 Unnamed 컬럼/빈 컬럼 정리
        if name.lower().startswith("unnamed"):
            name = f"컬럼{i}"
        base = name
        if base in seen:
            seen[base] += 1
            name = f"{base}_{seen[base]}"
        else:
            seen[base] = 1
        cols.append(name)
    return cols


def _header_score(values: list[Any]) -> int:
    joined_cells = [_norm_col(v) for v in values if _clean(v)]
    if not joined_cells:
        return 0
    candidates = (
        NAME_KEYS + VEHICLE_KEYS + PHONE_KEYS + REGION_KEYS + MGMT_KEYS + MEMBER_TYPE_KEYS +
        JOIN_KEYS + CERT_KEYS + AMOUNT_KEYS + DEPOSIT_NAME_KEYS + DEPOSIT_DATE_KEYS + DEPOSIT_AMOUNT_KEYS
    )
    score = 0
    for cell in joined_cells:
        for key in candidates:
            nk = _norm_col(key)
            if nk and (nk == cell or nk in cell or cell in nk):
                score += 1
                break
    return score


def _normalize_sheet(df: pd.DataFrame) -> pd.DataFrame:
    """헤더가 1행이 아닌 협회 엑셀도 읽도록 헤더 행 자동 탐지."""
    df = df.dropna(how="all")
    if df.empty:
        return df
    # 좌우가 전부 빈 컬럼 제거
    df = df.dropna(axis=1, how="all")
    if df.empty:
        return df

    # 상단 30행 중 이름/차량번호/금액 같은 업무 컬럼명이 가장 많이 들어있는 행을 헤더로 사용
    best_idx = None
    best_score = 0
    max_scan = min(len(df), 30)
    for i in range(max_scan):
        vals = list(df.iloc[i].values)
        score = _header_score(vals)
        if score > best_score:
            best_score = score
            best_idx = i
    if best_idx is not None and best_score >= 2:
        cols = _make_unique_columns(list(df.iloc[best_idx].values))
        out = df.iloc[best_idx + 1:].copy()
        out.columns = cols
    else:
        # 그래도 못 찾으면 기존 방식처럼 첫 행을 컬럼으로 간주
        cols = _make_unique_columns(list(df.iloc[0].values))
        out = df.iloc[1:].copy()
        out.columns = cols

    out = out.dropna(how="all")
    # 완전 빈 행 제거
    out = out.loc[:, [c for c in out.columns if not str(c).startswith("컬럼") or out[c].astype(str).str.strip().ne("").any()]]
    return out


def _read_excel(file: UploadFile) -> tuple[str, list[dict[str, Any]]]:
    content = file.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="파일 내용이 비어 있습니다.")
    name = file.filename or "upload.xlsx"
    suffix = Path(name).suffix.lower()
    try:
        frames = []
        if suffix in {".xlsx", ".xlsm", ".xls"}:
            # header=None으로 먼저 읽어야 제목줄/병합셀 있는 관공서 엑셀도 안전하게 처리됨
            sheets = pd.read_excel(io.BytesIO(content), sheet_name=None, dtype=object, header=None)
            for sheet, raw in sheets.items():
                df = _normalize_sheet(raw)
                if df.empty:
                    continue
                df["__sheet"] = sheet
                frames.append(df)
            if not frames:
                return name, []
            df = pd.concat(frames, ignore_index=True)
        elif suffix == ".csv":
            df = pd.read_csv(io.BytesIO(content), dtype=object, encoding="utf-8-sig")
            df = df.dropna(how="all")
        else:
            raise HTTPException(status_code=400, detail="xlsx/xlsm/xls/csv 파일만 업로드할 수 있습니다.")
    except HTTPException:
        raise
    except Exception as exc:
        # 서버 500 대신 화면에 읽기 실패 이유가 보이도록 400으로 반환
        raise HTTPException(status_code=400, detail=f"엑셀 읽기 실패: {type(exc).__name__}: {exc}") from exc
    df = df.rename(columns={c: str(c).strip() for c in df.columns})
    df = df.fillna("")
    return name, [_json_safe_row(r) for r in df.to_dict(orient="records")]

def _member_payload(row: dict[str, Any], index: int, columns: list[str], db: Session) -> dict[str, Any] | None:
    name_col = _find_col(columns, NAME_KEYS)
    vehicle_col = _find_col(columns, VEHICLE_KEYS)
    if not name_col or not vehicle_col:
        return None
    name = _clean(row.get(name_col))
    vehicle = _clean(row.get(vehicle_col))
    if not name or not vehicle:
        return None
    phone_col = _find_col(columns, PHONE_KEYS)
    region_col = _find_col(columns, REGION_KEYS)
    mgmt_col = _find_col(columns, MGMT_KEYS)
    cert_col = _find_col(columns, CERT_KEYS)
    join_col = _find_col(columns, JOIN_KEYS)
    region_raw = _clean(row.get(region_col)) if region_col else ""
    sigun = _sigun_from_text(region_raw or " ".join(_clean(row.get(c)) for c in columns))
    member_type = _member_type(row, vehicle, columns)
    membership = _membership(row, columns)
    cert_date = _parse_date(row.get(cert_col)) if cert_col else None
    join_date = _parse_date(row.get(join_col)) if join_col else None
    charge = charge_item(membership)
    monthly = monthly_charge(membership, birth_year=None)
    base_date = join_date if membership == "협회가입" and join_date else cert_date
    billing_start = next_month_ym(base_date) if base_date else None
    current_count = db.scalar(select(func.count()).select_from(Member)) or 0
    yy = (cert_date or date.today()).strftime("%y")
    mgmt_no = _clean(row.get(mgmt_col)) if mgmt_col else ""
    if not mgmt_no:
        prefix = "양" if "양" in " ".join(_clean(row.get(c)) for c in columns) else "신"
        mgmt_no = f"{prefix}{yy}-{current_count + index + 1:03d}"
    return {
        "id": "", "mgmt_no": mgmt_no, "reg_type": "양도양수" if mgmt_no.startswith("양") else "신규",
        "name": name, "vehicle_no": vehicle, "phone": _clean(row.get(phone_col)) if phone_col else None,
        "sigun": sigun, "region_raw": region_raw or sigun, "member_type": member_type, "membership": membership,
        "birth_year": None, "cert_issue_date": cert_date, "assoc_join_date": join_date,
        "billing_start_ym": billing_start, "charge_item": charge, "monthly_charge": monthly,
        "last_payment_ym": None, "status": "정상", "is_disconnected": False, "cert_missing": cert_date is None,
        "memo": "엑셀 업로드 반영",
    }


def _find_member(db: Session, name: str, vehicle: str) -> Member | None:
    vehicle_last4 = _vehicle_last4(vehicle)
    if vehicle:
        m = db.scalar(select(Member).where(Member.vehicle_no == vehicle).limit(1))
        if m:
            return m
    if name and vehicle_last4:
        candidates = db.scalars(select(Member).where(Member.name == name)).all()
        for m in candidates:
            if _vehicle_last4(m.vehicle_no) == vehicle_last4:
                return m
    if name:
        return db.scalar(select(Member).where(Member.name == name).limit(1))
    return None


@router.post("/preview")
def preview_import(file_type: str = Form(...), file: UploadFile = File(...)):
    filename, rows = _read_excel(file)
    if not rows:
        return {"filename": filename, "file_type": file_type, "total_rows": 0, "columns": [], "sample": []}
    columns = [c for c in rows[0].keys() if not c.startswith("__")]
    return {
        "filename": filename,
        "file_type": file_type,
        "total_rows": len(rows),
        "columns": columns,
        "sample": rows[:10],
        "message": "미리보기입니다. 저장 버튼을 눌러야 DB에 반영됩니다.",
    }


@router.post("/commit")
def commit_import(file_type: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename, rows = _read_excel(file)
    if not rows:
        return {"ok": True, "filename": filename, "inserted": 0, "updated": 0, "skipped": 0, "errors": []}
    columns = [c for c in rows[0].keys() if not c.startswith("__")]
    inserted = updated = skipped = 0
    errors: list[str] = []

    if file_type in {"members", "license", "전체면허자현황"}:
        for idx, row in enumerate(rows, start=1):
            payload = _member_payload(row, idx, columns, db)
            if not payload:
                skipped += 1
                continue
            existing = _find_member(db, payload["name"], payload["vehicle_no"])
            try:
                if existing:
                    # 빈 값으로 기존 값을 지우지 않는다. 있는 값만 보강한다.
                    for key, value in payload.items():
                        if key == "id" or value in (None, ""):
                            continue
                        setattr(existing, key, value)
                    updated += 1
                else:
                    seq = (db.scalar(select(func.count()).select_from(Member)) or 0) + 1
                    payload["id"] = f"M{seq:05d}"
                    db.add(Member(**payload))
                    inserted += 1
            except Exception as exc:
                errors.append(f"{idx}행: {exc}")
        db.commit()
        return {"ok": True, "filename": filename, "type": "members", "inserted": inserted, "updated": updated, "skipped": skipped, "errors": errors[:20]}

    if file_type in {"arrears", "receivables", "미수금명단"}:
        name_col = _find_col(columns, NAME_KEYS)
        vehicle_col = _find_col(columns, VEHICLE_KEYS)
        amount_col = _find_col(columns, AMOUNT_KEYS)
        month_cols = [c for c in columns if re.search(r"(20\d{2}[-./년 ]?\d{1,2}|\d{1,2}\s*월)", str(c))]
        if not (name_col or vehicle_col):
            raise HTTPException(status_code=400, detail="미수금 파일에서 이름 또는 차량번호 컬럼을 찾지 못했습니다.")
        for idx, row in enumerate(rows, start=1):
            name = _clean(row.get(name_col)) if name_col else ""
            vehicle = _clean(row.get(vehicle_col)) if vehicle_col else ""
            member = _find_member(db, name, vehicle)
            if not member:
                skipped += 1
                continue
            created_for_row = 0
            # 월별 컬럼 우선 반영
            for c in month_cols:
                amt = _money(row.get(c))
                if amt <= 0:
                    continue
                raw = str(c)
                m = re.search(r"(20\d{2}).*?(\d{1,2})", raw)
                if m:
                    ym = f"{int(m.group(1)):04d}-{int(m.group(2)):02d}"
                else:
                    mm = re.search(r"(\d{1,2})\s*월", raw)
                    year_match = re.search(r"20\d{2}", filename)
                    yy = int(year_match.group(0)) if year_match else date.today().year
                    ym = f"{yy:04d}-{int(mm.group(1)):02d}" if mm else f"{date.today().year}-00"
                item = db.scalar(select(ReceivableItem).where(ReceivableItem.member_id == member.id, ReceivableItem.ym == ym).limit(1))
                if item:
                    item.amount = amt
                    item.is_paid = False
                    updated += 1
                else:
                    db.add(ReceivableItem(member_id=member.id, ym=ym, charge_item=member.charge_item, amount=amt, is_paid=False))
                    inserted += 1
                created_for_row += 1
            if created_for_row == 0 and amount_col:
                amt = _money(row.get(amount_col))
                if amt > 0:
                    year_match = re.search(r"20\d{2}", filename)
                    yy = int(year_match.group(0)) if year_match else date.today().year
                    ym = f"{yy:04d}-00"
                    item = db.scalar(select(ReceivableItem).where(ReceivableItem.member_id == member.id, ReceivableItem.ym == ym).limit(1))
                    if item:
                        item.amount = amt
                        item.is_paid = False
                        updated += 1
                    else:
                        db.add(ReceivableItem(member_id=member.id, ym=ym, charge_item=member.charge_item, amount=amt, is_paid=False))
                        inserted += 1
                else:
                    skipped += 1
        db.commit()
        return {"ok": True, "filename": filename, "type": "arrears", "inserted": inserted, "updated": updated, "skipped": skipped, "errors": errors[:20]}

    if file_type in {"deposits", "bank", "통장거래내역"}:
        date_col = _find_col(columns, DEPOSIT_DATE_KEYS)
        name_col = _find_col(columns, DEPOSIT_NAME_KEYS)
        amount_col = _find_col(columns, DEPOSIT_AMOUNT_KEYS)
        if not (date_col and name_col and amount_col):
            raise HTTPException(status_code=400, detail="통장거래내역에서 입금일/입금자명/입금액 컬럼을 찾지 못했습니다.")
        for idx, row in enumerate(rows, start=1):
            d = _parse_date(row.get(date_col)) or date.today()
            name = _clean(row.get(name_col))
            amt = _money(row.get(amount_col))
            if not name or amt <= 0:
                skipped += 1
                continue
            memo = " ".join(_clean(row.get(c)) for c in columns if c not in {date_col, name_col, amount_col})[:60]
            db.add(Deposit(deposit_date=d, depositor_name=name, amount=amt, memo=memo, status="대기", is_excluded=False))
            inserted += 1
        db.commit()
        return {"ok": True, "filename": filename, "type": "deposits", "inserted": inserted, "updated": 0, "skipped": skipped, "errors": errors[:20]}

    raise HTTPException(status_code=400, detail="file_type은 members / arrears / deposits 중 하나여야 합니다.")
