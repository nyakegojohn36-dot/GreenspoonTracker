@echo off
echo ============================================
echo   GREENSPOON BOX TRACKER - NODE.JS VERSION
echo ============================================
echo.

REM Go to backend folder
cd backend

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js not found!
    echo Install from: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing Node.js packages...
    npm install
)

REM Check database
if not exist "..\database\greenspoon.db" (
    echo 🗃️  Creating database...
    if exist "setup-database.js" (
        node setup-database.js
    ) else (
        echo ❌ ERROR: setup-database.js missing!
        pause
        exit /b 1
    )
)

REM Start the Node.js server
echo 🌐 Starting Node.js server on port 3000...
echo.
echo 📍 Open browser to: http://localhost:3000
echo.
node server.js

REM If server crashes
echo.
echo ❌ Server stopped unexpectedly
pause