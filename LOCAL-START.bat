@echo off
title MeetTime - Local Development
color 0A

echo ========================================================================
echo                        🚀 MEETTIME LOCAL START 🚀
echo ========================================================================
echo.

echo [INFO] This script starts both servers for local development
echo [INFO] Frontend: http://localhost:8080
echo [INFO] Backend: http://localhost:3001
echo.

echo [0/3] Stopping existing servers...
echo Killing processes on port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
echo Killing processes on port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
echo Existing servers stopped.
echo.

echo [1/3] Starting Backend Server...
start "Backend" cmd /k "cd server && npm run dev"
timeout /t 5

echo [2/3] Starting Frontend Server...
start "Frontend" cmd /k "npm run dev"
timeout /t 3

echo [3/3] Checking server status...
timeout /t 2
echo.
echo ========================================================================
echo                           ✅ SERVERS STARTED!
echo ========================================================================
echo.
echo 🌐 ACCESS YOUR APP:
echo Frontend: http://localhost:8080
echo Backend API: http://localhost:3001
echo Health Check: http://localhost:3001/health
echo Connection Test: http://localhost:8080/test
echo.
echo 📋 TROUBLESHOOTING:
echo - If port errors persist, manually close all Node.js processes
echo - Check Task Manager for node.exe processes
echo - Visit /test page to run diagnostics
echo - If still issues, restart your computer
echo.
echo Press any key to exit...
pause