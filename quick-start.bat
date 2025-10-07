@echo off
echo 🚀 MeetTime Quick Start
echo.

echo 📦 Installing dependencies...
call npm install
cd server
call npm install
cd ..

echo.
echo 🔧 Starting servers...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:8080
echo Test Page: http://localhost:8080/test
echo.

start "Backend Server" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Both servers are starting!
echo 📋 Visit http://localhost:8080/test to verify connection
echo.
pause