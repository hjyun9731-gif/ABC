import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 빌드 산출물은 백엔드가 정적 서빙할 위치로 보낸다.
// 개발 중에는 /api 요청을 로컬 FastAPI(8000)로 프록시.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../backend/app/static',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
