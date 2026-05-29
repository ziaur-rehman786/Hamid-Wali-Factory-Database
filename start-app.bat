@echo off
title Hamid Wali Shoe Factory
color 0B
echo.
echo Starting Hamid Wali Shoe Factory...
echo Open browser: http://localhost:3000
echo Login: admin / admin123
echo.
echo Press Ctrl+C to stop the server.
echo.

cd /d "%~dp0"

if not exist "node_modules\" call npm install
if not exist "backend\node_modules\" (
    cd backend
    call npm install
    cd ..
)
if not exist "frontend\node_modules\" (
    cd frontend
    call npm install
    cd ..
)

call npm run dev
