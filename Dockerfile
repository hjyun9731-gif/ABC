# ── 1단계: 프론트 빌드 ───────────────────────────────
FROM node:20-slim AS frontend
WORKDIR /fe

# Railway/Nixpacks 환경에서 NODE_ENV=production이어도 Vite devDependency가 설치되도록 include=dev 명시
COPY frontend/package.json ./
RUN npm install --include=dev

COPY frontend/ ./
RUN npm run build -- --outDir dist --emptyOutDir

# ── 2단계: 백엔드 런타임 ─────────────────────────────
FROM python:3.12-slim AS runtime
WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
# 프론트 빌드 산출물 복사
COPY --from=frontend /fe/dist ./app/static

# Railway가 주는 PORT를 shell에서 숫자로 확장해서 실행
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
