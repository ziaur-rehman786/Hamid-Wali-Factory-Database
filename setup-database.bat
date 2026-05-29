@echo off
title Hamid Wali Shoe Factory - Database Setup
color 0B
echo.
echo ============================================
echo   HAMID WALI SHOE FACTORY
echo   Database Setup
echo ============================================
echo.

cd /d "%~dp0backend"

if not exist "node_modules\" (
    echo Installing packages... Please wait.
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed. Install Node.js first.
        pause
        exit /b 1
    )
)

echo.
echo [1/2] Creating database and tables...
call npm run db:setup
if errorlevel 1 (
    echo.
    echo SETUP FAILED!
    echo Open backend\.env and set POSTGRES_ADMIN_PASSWORD to your pgAdmin password.
    pause
    exit /b 1
)

echo.
echo [2/2] Adding sample data...
call npm run db:seed
if errorlevel 1 (
    echo.
    echo SEED FAILED! Check PostgreSQL is running.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   SUCCESS! Database is ready.
echo ============================================
echo.
echo   Database: hamid_wali_factory
echo   Username: hw_factory_admin
echo   Password: (see backend\.env DB_PASSWORD)
echo.
echo   App login: admin / admin123
echo.
    echo   Fix khata numbers: npm run db:sync-khata
    echo   Next: Double-click start-app.bat
echo ============================================
echo.
pause
