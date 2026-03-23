@echo off
echo.
echo ============================================
echo   MENTAL HEALTH APP - SETUP & LAUNCH
echo ============================================
echo.

echo [1/3] Checking Backend Python Dependencies...
cd backend
pip install -r requirements.txt
cd ..

echo [2/3] Checking Frontend Dependencies...
cd frontend
if not exist node_modules (
    echo   Installing npm packages...
    npm install
) else (
    echo   node_modules found, skipping install.
)
cd ..

echo [3/3] Launching App...
python launch.py
pause
