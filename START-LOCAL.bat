@echo off
echo Starting MeetTime Local Development...
echo.

echo Installing dependencies...
call npm install
cd server && call npm install && cd ..

echo.
echo Starting both frontend and backend...
call npm run dev:both

pause