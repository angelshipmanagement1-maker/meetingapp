@echo off
title MeetTime - Port Checker
color 0B

echo ========================================================================
echo                        🔍 MEETTIME PORT CHECKER
echo ========================================================================
echo.

echo Checking port 3001 (Backend)...
netstat -aon | find ":3001" | find "LISTENING"
if %errorlevel% == 0 (
    echo ❌ Port 3001 is BUSY
    echo.
    echo Processes using port 3001:
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
        echo Process ID: %%a
        tasklist /fi "pid eq %%a" /fo table /nh
    )
) else (
    echo ✅ Port 3001 is FREE
)

echo.
echo Checking port 8080 (Frontend)...
netstat -aon | find ":8080" | find "LISTENING"
if %errorlevel% == 0 (
    echo ❌ Port 8080 is BUSY
    echo.
    echo Processes using port 8080:
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do (
        echo Process ID: %%a
        tasklist /fi "pid eq %%a" /fo table /nh
    )
) else (
    echo ✅ Port 8080 is FREE
)

echo.
echo ========================================================================
echo                           📋 SUMMARY
echo ========================================================================
echo.
echo If ports are busy:
echo 1. Run STOP-SERVERS.bat to free them
echo 2. Or manually close the processes shown above
echo 3. Then run LOCAL-START.bat
echo.
pause