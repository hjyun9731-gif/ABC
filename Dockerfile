# ── 1단계: 프론트 빌드 ───────────────────────────────
FROM node:20-slim AS frontend
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
# vite build → ../backend/app/static 으로 떨어지지만, 빌드 컨텍스트상
# 산출물을 명시 위치로 받기 위해 outDir 를 ./dist 로 덮어쓴다.
RUN npx vite build --outDir dist --emptyOutDir

# ── 2단계: 백엔드 런타임 ─────────────────────────────
FROM python:3.12-slim AS runtime
WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
# 프론트 빌드 산출물을 백엔드 정적 디렉터리로 복사
COPY --from=frontend /backend/app/static ./app/static

# Railway 가 주는 $PORT 로 기동. 마이그레이션은 predeploy(railway.json)에서 수행.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
