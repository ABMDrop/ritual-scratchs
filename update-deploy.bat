@echo off
title Ritual Scratch - Quick Update Deploy
color 0B

echo.
echo  ==========================================
echo   RITUAL SCRATCH - QUICK UPDATE DEPLOY
echo   Push changes WITHOUT deleting the repo
echo  ==========================================
echo.

:: ── Check Git ──
git --version >nul 2>&1
if errorlevel 1 (
  echo  [ERROR] Git not found! Download: https://git-scm.com
  pause
  exit /b 1
)

:: ── Make sure we are inside a git repo ──
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo.
  echo  [ERROR] This folder is NOT a git repo yet!
  echo  Run deploy-github.bat FIRST to set up the repo,
  echo  then use this file for future updates.
  echo.
  pause
  exit /b 1
)

:: ── Show current remote so user knows where it will push ──
echo  Current GitHub remote:
git remote get-url origin 2>nul
if errorlevel 1 (
  echo  [WARN] No remote origin found.
  echo.
  set /p NEW_REMOTE=" Paste your GitHub repo URL to add it: "
  git remote add origin %NEW_REMOTE%
)

echo.

:: ── Show what files changed ──
echo  ── Changed files ──────────────────────────
git status --short
echo  ───────────────────────────────────────────
echo.

:: ── Ask for a commit message ──
set /p COMMIT_MSG=" Enter commit message (or press Enter for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update ritual scratch fixes

:: ── Stage all changes ──
echo.
echo  [1/4] Staging all changes...
git add .

:: ── Commit ──
echo  [2/4] Committing: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%"

if errorlevel 1 (
  echo.
  echo  [INFO] Nothing new to commit - your files are already up to date.
  echo.
  pause
  exit /b 0
)

:: ── Pull first to avoid conflicts ──
echo  [3/4] Pulling latest from GitHub (safe merge)...
git pull --rebase origin main >nul 2>&1
if errorlevel 1 (
  echo.
  echo  [WARN] Pull had conflicts. Trying force push...
  git push --force-with-lease origin main
  goto :check_push
)

:: ── Push ──
echo  [4/4] Pushing to GitHub...
git push origin main

:check_push
if errorlevel 1 (
  echo.
  echo  ==========================================
  echo  [ERROR] Push failed!
  echo.
  echo  Possible reasons:
  echo   1. Not logged into GitHub (run: git config credential.helper store)
  echo   2. Wrong remote URL
  echo   3. Branch protection on main
  echo  ==========================================
  pause
  exit /b 1
)

echo.
echo  ==========================================
echo   SUCCESS! Changes pushed to GitHub.
echo.
echo   Vercel will auto-deploy in ~30 seconds.
echo   Check: https://vercel.com/dashboard
echo  ==========================================
echo.

set /p OPEN_VERCEL=" Open Vercel dashboard now? (Y/N): "
if /i "%OPEN_VERCEL%"=="Y" start https://vercel.com/dashboard

echo.
pause
