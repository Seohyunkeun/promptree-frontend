@echo off
REM === Promptree: 백엔드 + 프런트 동시에 실행 ===
REM 백엔드
start "promptree-backend" cmd /k "cd /d C:\Users\seo\Promptree && npm start"
REM 프런트
start "promptree-frontend" cmd /k "cd /d C:\Users\seo\Promptree\client && npm run dev"