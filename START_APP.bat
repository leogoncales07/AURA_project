@echo off
:: Always run from the directory where this script is located
cd /d "%~dp0"

echo.
echo ============================================
echo   MENTAL HEALTH APP - SETUP & LAUNCH
echo ============================================
echo.

echo [1/3] Checking Backend Python Dependencies...
cd backend
python -m pip install -r requirements.txt
cd /d "%~dp0"

echo.
echo [2/3] Checking Frontend Dependencies...
cd frontend
if not exist node_modules (
    echo   Installing npm packages...
    cmd /c npm install
) else (
    echo   node_modules found, skipping install.
)
cd /d "%~dp0"

echo.
echo [3/3] Launching App and Opening Browser...
python launch.py
pause

