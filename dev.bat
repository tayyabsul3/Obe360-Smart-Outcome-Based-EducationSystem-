@echo off
echo ==========================================================
echo Starting OBE360 Development Environment...
echo ==========================================================

:: Start Backend Server
echo [1/2] Launching Backend Server...
start "OBE360 Server" cmd /k "cd server && npm run dev"

:: Start Frontend Client
echo [2/2] Launching Frontend Client...
start "OBE360 Client" cmd /k "cd client && npm run dev"

echo ==========================================================
echo Dev environment is starting in separate windows.
echo Keep those windows open while developing.
echo ==========================================================
pause
