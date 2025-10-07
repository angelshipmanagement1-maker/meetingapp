@echo off
title MeetTime - Stop Servers
color 0C

echo ========================================================================
echo                        🛑 STOPPING MEETTIME SERVERS
echo ========================================================================
echo.

echo Stopping Backend Server (port 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /f /pid %%a
)

echo.
echo Stopping Frontend Server (port 8080)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /f /pid %%a
)

echo.
echo Stopping all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im nodemon.exe >nul 2>&1

echo.
echo ========================================================================
echo                           ✅ SERVERS STOPPED!
echo ========================================================================
echo.
echo All MeetTime servers have been stopped.
echo You can now run LOCAL-START.bat to restart them.
echo.
pause