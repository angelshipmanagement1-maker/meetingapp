@echo off
title MeetTime - One Click Setup
color 0A

echo.
echo ██╗   ██╗███████╗███████╗████████╗████████╗██╗███╗   ███╗███████╗
echo ████╗ ████║██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██║████╗ ████║██╔════╝
echo ██╔████╔██║█████╗  █████╗     ██║      ██║   ██║██╔████╔██║█████╗  
echo ██║╚██╔╝██║██╔══╝  ██╔══╝     ██║      ██║   ██║██║╚██╔╝██║██╔══╝  
echo ██║ ╚═╝ ██║███████╗███████╗   ██║      ██║   ██║██║ ╚═╝ ██║███████╗
echo ╚═╝     ╚═╝╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝
echo.
echo                    🚀 ONE-CLICK MEETTIME SETUP 🚀
echo ========================================================================

echo.
echo [1/6] Installing Dependencies...
call npm install >nul 2>&1
cd server && call npm install >nul 2>&1 && cd ..
echo ✅ Dependencies installed

echo.
echo [2/6] Starting Backend Server...
start "Backend" cmd /k "cd server && npm run dev" >nul 2>&1
timeout /t 8 >nul

echo.
echo [3/6] Starting Frontend Server...
start "Frontend" cmd /k "npm run client" >nul 2>&1
timeout /t 8 >nul

echo.
echo [4/6] Starting Ngrok Tunnels...
start "Ngrok" cmd /k "ngrok start --config=ngrok-combined.yml --all" >nul 2>&1
timeout /t 8 >nul

echo.
echo [5/6] Opening Ngrok Dashboard...
start http://localhost:4040
timeout /t 3 >nul

echo.
echo ========================================================================
echo                        ⏳ WAITING FOR NGROK URLS ⏳
echo ========================================================================
echo.
echo 📋 INSTRUCTIONS:
echo    1. Ngrok dashboard is now open in your browser
echo    2. Look for TWO tunnel URLs:
echo       • Backend (port 3001) - for configuration
echo       • Frontend (port 8080) - YOUR WEBSITE LINK
echo.

:get_backend_url
echo [6/6] Configuration Setup...
echo.
set /p BACKEND_URL="📥 Paste your BACKEND ngrok URL here (port 3001): "

if "%BACKEND_URL%"=="" (
    echo ❌ Please enter the backend URL
    goto get_backend_url
)

echo.
echo 🔧 Updating configuration...
echo VITE_SERVER_URL=%BACKEND_URL% > .env
echo VITE_APP_NAME=MeetTime >> .env
echo ✅ Configuration updated!

echo.
echo ========================================================================
echo                        🎉 SETUP COMPLETE! 🎉
echo ========================================================================
echo.
echo 🌐 YOUR WEBSITE IS READY!
echo.
echo 📋 COPY THIS LINK TO SHARE:
echo    👉 Go back to ngrok dashboard
echo    👉 Copy the FRONTEND URL (port 8080)
echo    👉 That's your website link - share it with anyone!
echo.
echo 💡 CONFIGURED:
echo    ✅ Backend URL: %BACKEND_URL%
echo    ✅ Frontend: Ready to share
echo    ✅ All services running
echo.
echo 🚀 READY TO USE:
echo    • Share the FRONTEND ngrok URL
echo    • People can join meetings from anywhere
echo    • Click "Visit Site" on ngrok warning pages
echo.
echo ========================================================================
echo Press any key to keep services running...
pause >nul