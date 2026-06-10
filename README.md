# 미수금관리 프로그램

강원도개인소형화물자동차운송사업협회 업무 흐름을 기준으로 만든 미수금관리 웹 프로그램입니다.

## 현재 반영된 화면

- 대시보드
- 미수금명단 MAIN
  - 회원 목록
  - 검색/필터
  - 회원 상세 드로어
  - 부과기준/미수상세/메모
  - 수납 반영 UI 및 샘플 동작
  - 폐업 등록 UI 및 샘플 동작
- 통장매칭
- 폐업현황
- 전체자명단
- 수납내역
- 신규·예정자

현재 프론트는 샘플 데이터로 업무흐름을 검증할 수 있게 구성되어 있습니다. 백엔드 FastAPI, PostgreSQL, Alembic, Railway 배포 골격은 포함되어 있으며, 실제 운영 데이터 연결은 다음 단계에서 API에 연결하면 됩니다.

## 핵심 업무 규칙

- 관리비: 5,000원
- 협회비: 10,000원
- 70세 이상 협회가입자: 협회비 5,000원
- 관리비는 자격증명 발급일자 다음 달부터 부과
- 협회비는 협회 가입일자 다음 달부터 부과
- 폐업 처리 시 미수금명단에서는 제외
- 미수금이 없어도 폐업 처리 내용은 입력
- 미수금이 남아 있으면 추후 납부 안내 대상

## 로컬 실행

### 프론트

```bash
cd frontend
npm install
npm run dev
```

### 백엔드

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

## Railway 배포

Railway는 Dockerfile 기준으로 빌드합니다.

중요 설정:

- `railway.toml`의 startCommand는 `sh -c`로 PORT를 해석합니다.
- healthcheckPath: `/api/health`
- PostgreSQL 연결은 `DATABASE_URL` 환경변수를 사용합니다.

## 주의

실제 회원 개인정보, DB 덤프, `.env` 파일은 GitHub에 올리지 마세요.
