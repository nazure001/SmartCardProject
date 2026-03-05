@echo off
REM ============================================================
REM SmartCardProject - Setup Script for Windows
REM ============================================================

echo.
echo ========================================
echo SmartCard Project - Installation Setup
echo ========================================
echo.

REM Check if Node.js is installed
echo [1] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed

REM Check if npm is installed
echo [2] Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)
echo [OK] npm is installed

REM Install dependencies
echo.
echo [3] Installing Node.js dependencies...
echo This may take a few minutes...
echo.
npm install

if errorlevel 1 (
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)
echo [OK] Dependencies installed

REM Check if .env exists
echo.
echo [4] Checking .env file...
if not exist .env (
    echo [WARNING] .env file not found!
    echo Please configure .env file manually
) else (
    echo [OK] .env file exists
)

REM Check if database_schema.sql exists
echo.
echo [5] Checking database schema...
if not exist database_schema.sql (
    echo [ERROR] database_schema.sql not found!
    pause
    exit /b 1
)
echo [OK] database_schema.sql found

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Configure .env file with your MySQL settings
echo 2. Import database schema:
echo    mysql -u root -p db_smart_card ^< database_schema.sql
echo 3. Start the server:
echo    node server_api.js
echo 4. In another terminal, start the bot:
echo    node bot_sekolah.js
echo 5. Open dashboard.html in browser
echo.
pause
