@echo off
echo.
echo ============================================
echo   MENTAL HEALTH APP - CLEAN FIX & RESET
echo ============================================
echo.
echo [1/4] Cleaning old corrupted files...
cd frontend
if exist node_modules (
    echo   Removing frontend node_modules...
    rmdir /s /q node_modules
)
if exist .next (
    echo   Removing .next cache...
    rmdir /s /q .next
)
if exist package-lock.json (
    del package-lock.json
)
cd ..

cd backend
if exist node_modules (
    echo   Removing backend node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del package-lock.json
)
cd ..

echo.
echo [2/4] Reinstalling Backend Python Dependencies...
cd backend
pip install --upgrade -r requirements.txt
cd ..

echo.
echo [3/4] Reinstalling Frontend Dependencies (with correct versions)...
cd frontend
npm install
cd ..

echo.
echo [4/4] Everything is fixed!
echo Launching now...
echo.
python launch.py
pause
