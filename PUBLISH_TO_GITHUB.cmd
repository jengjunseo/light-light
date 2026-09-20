@echo off
setlocal
cd /d "%~dp0"
where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed. Install Git for Windows, then run this file again.
  pause
  exit /b 1
)
if not exist ".git" (
  git init -b main
  if errorlevel 1 goto fail
)
git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin https://github.com/jengjunseo/light-light.git
  if errorlevel 1 goto fail
)
git add .
if errorlevel 1 goto fail
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Remaster Light Light interface"
  if errorlevel 1 goto fail
)
git branch -M main
if errorlevel 1 goto fail
git push -u origin main
if errorlevel 1 goto fail
echo.
echo GitHub upload completed. Check your light-light Vercel deployment.
pause
exit /b 0
:fail
echo.
echo Upload could not be completed. Review the error above.
pause
exit /b 1
