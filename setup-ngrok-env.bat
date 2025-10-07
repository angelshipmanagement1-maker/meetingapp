@echo off
echo Setting up ngrok environment...

echo.
echo Please get your ngrok URLs from: http://localhost:4040
echo.
echo Example URLs:
echo Frontend: https://abc123.ngrok.io
echo Backend:  https://def456.ngrok.io
echo.

set /p BACKEND_URL="Enter your backend ngrok URL (e.g., https://def456.ngrok.io): "

echo VITE_SERVER_URL=%BACKEND_URL% > .env.ngrok
echo VITE_APP_NAME=MeetTime >> .env.ngrok

echo.
echo Environment configured! 
echo Backend URL set to: %BACKEND_URL%
echo.
echo Now update your server CORS settings to allow the frontend ngrok URL.
echo.
pause