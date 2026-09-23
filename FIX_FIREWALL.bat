@echo off
:: BatchSubagent - Run as Administrator to allow Mobile App to connect via Wi-Fi
echo ============================================================
echo   AURA Project - Fixing Wi-Fi & Firewall for Mobile Connection
echo ============================================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [Requesting Administrator Privileges...]
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [1/3] Setting Wi-Fi network profile to Private...
powershell -Command "Set-NetConnectionProfile -InterfaceAlias 'Wi-Fi' -NetworkCategory Private"

echo [2/3] Adding Firewall rule for Expo Metro (Port 8081)...
netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081

echo [3/3] Adding Firewall rule for Backend API (Port 8000)...
netsh advfirewall firewall add rule name="AURA Backend 8000" dir=in action=allow protocol=TCP localport=8000

echo.
echo ============================================================
echo   SUCCESS! Your phone can now connect to 192.168.68.54!
echo ============================================================
echo.
pause
