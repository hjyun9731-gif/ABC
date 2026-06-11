"""
FastAPI 진입점 (main)
---------------------
- 라우터 등록(/api/*)
- /api/health  (DB 불필요, 배포 헬스체크용)
- 빌드된 프론트(static) 가 있으면 서빙. 없으면 API 만 동작.
- 스키마 생성/초기화는 하지 않는다(Alembic 담당, 데이터 보존 정책).
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .database import Base, engine
from .routers import closures, dashboard, deposits, imports, members, pending, payments

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터
for r in (members, deposits, closures, pending, dashboard, imports, payments):
    app.include_router(r.router)


@app.on_event("startup")
def create_missing_tables_only():
    """운영 편의용 안전 초기화.
    DROP/TRUNCATE/DELETE 없이 없는 테이블만 생성한다.
    Railway 첫 배포에서 Alembic 버전 파일이 비어 있어도 업로드 기능이 바로 동작하게 한다.
    """
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name}


# ---- 프론트 정적 서빙 (빌드 산출물이 있을 때만) ----
STATIC_DIR = Path(__file__).resolve().parent / "static"
if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        # SPA 라우팅: 정적 파일 없으면 index.html 반환
        candidate = STATIC_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")
