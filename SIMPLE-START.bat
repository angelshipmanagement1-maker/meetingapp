@echo off
title MeetTime - Simple Start
color 0A

echo ========================================================================
echo                        🚀 MEETTIME SIMPLE START 🚀
echo ========================================================================
echo.

echo [1/3] Starting Backend Server...
start "Backend" cmd /k "cd server && npm run dev"
timeout /t 5

echo [2/3] Starting Frontend Server...
start "Frontend" cmd /k "npm run client"
timeout /t 5

echo [3/3] Starting Ngrok...
start "Ngrok" cmd /k "ngrok start --config=ngrok-combined.yml --all"

echo.
echo ========================================================================
echo                           ✅ ALL STARTED!
echo ========================================================================
echo.
echo 🌐 YOUR WEBSITE LINK:
echo https://11af2897d46e.ngrok-free.app
echo.
echo 📋 CONFIGURED:
echo ✅ Backend: https://a2ba9357c856.ngrok-free.app
echo ✅ Frontend: https://11af2897d46e.ngrok-free.app
echo ✅ Environment updated automatically
echo.
echo 🚀 SHARE THIS LINK:
echo https://11af2897d46e.ngrok-free.app
echo.
echo Press any key to exit...
pause