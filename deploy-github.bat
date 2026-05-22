@echo off
title Ritual Scratch - GitHub Deploy
color 0B

echo.
echo  ==========================================
echo   RITUAL SCRATCH - GITHUB DEPLOY
echo  ==========================================
echo.

:: Check Git
git --version >nul 2>&1
if errorlevel 1 (
  echo  [ERROR] Git not found!
  echo  Download it from: https://git-scm.com
  echo.
  pause
  exit /b 1
)

:: Check Node.js
node -v >nul 2>&1
if errorlevel 1 (
  echo  [ERROR] Node.js not found!
  echo  Download it from: https://nodejs.org
  echo.
  pause
  exit /b 1
)

echo  [OK] Git and Node.js found
echo.

:: Ask for GitHub repo URL
echo  Step 1: Make sure your repo exists on https://github.com
echo          (It can have old data - this script will WIPE it clean)
echo          Then copy the repo URL and paste below.
echo.
set /p REPO_URL="  Paste your GitHub repo URL here: "

if "%REPO_URL%"=="" (
  echo.
  echo  [ERROR] No URL entered. Exiting.
  pause
  exit /b 1
)

echo.
echo  ==========================================
echo   WARNING: This will DELETE all old data
echo   on GitHub and replace with current files!
echo  ==========================================
echo.
set /p CONFIRM="  Are you sure? Type YES to continue: "
if /i NOT "%CONFIRM%"=="YES" (
  echo.
  echo  Cancelled. No changes made.
  pause
  exit /b 0
)

echo.
echo  [1/7] Cleaning up old Git data locally...
if exist .git (
  rmdir /s /q .git
  echo         Old .git folder removed.
)

echo  [2/7] Removing node_modules and .next from tracking...
if exist node_modules rmdir /s /q node_modules >nul 2>&1
if exist .next rmdir /s /q .next >nul 2>&1

echo  [3/7] Initialising fresh Git repo...
git init >nul 2>&1

:: Ensure .gitignore exists and covers build folders
echo node_modules/ > .gitignore
echo .next/ >> .gitignore
echo .env >> .gitignore
echo .env.local >> .gitignore
echo out/ >> .gitignore
echo dist/ >> .gitignore
echo  [3/7] .gitignore created/updated.

echo  [4/7] Staging all latest files...
git add .

echo  [5/7] Creating fresh commit...
git commit -m "Fresh deploy - Ritual Scratch Next.js" >nul 2>&1

git branch -M main >nul 2>&1
git remote add origin %REPO_URL%

echo  [6/7] Force pushing to GitHub (overwrites ALL old data)...
echo.
git push -u origin main --force

if errorlevel 1 (
  echo.
  echo  [ERROR] Push failed. Possible reasons:
  echo   - Wrong GitHub URL
  echo   - Not logged into GitHub (run: git credential-manager)
  echo   - Repo does not exist yet - create it at https://github.com/new
  echo.
  pause
  exit /b 1
)

echo.
echo  [7/7] Done!
echo.
echo  ==========================================
echo   SUCCESS! All old data wiped.
echo   Latest files are now live on GitHub!
echo.
echo   Next step - Deploy to Vercel FREE:
echo   1. Go to https://vercel.com
echo   2. Sign in with GitHub
echo   3. Click "Add New Project"
echo   4. Import your repo
echo   5. Click Deploy - Done!
echo  ==========================================
echo.

set /p OPEN="  Open Vercel now? (Y/N): "
if /i "%OPEN%"=="Y" start https://vercel.com/new

echo.
pause
