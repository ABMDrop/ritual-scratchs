@echo off
title Ritual Scratch - Local Dev
color 0A

echo.
echo  ==========================================
echo   RITUAL SCRATCH - LOCAL SETUP
echo  ==========================================
echo.

:: Check Node.js
node -v >nul 2>&1
if errorlevel 1 (
  echo  [ERROR] Node.js not found!
  echo  Download it from: https://nodejs.org
  echo.
  pause
  exit /b 1
)

echo  [1/3] Node.js found: OK
echo.

:: Install dependencies
echo  [2/3] Installing dependencies...
echo.
call npm install
if errorlevel 1 (
  echo.
  echo  [ERROR] npm install failed. Check your internet connection.
  pause
  exit /b 1
)

echo.
echo  [3/3] Starting local dev server...
echo.
echo  ==========================================
echo   Open http://localhost:3000 in browser
echo   Press Ctrl+C to stop
echo  ==========================================
echo.

call npm run dev
pause
