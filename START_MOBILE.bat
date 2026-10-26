@echo off
cd /d "%~dp0"
echo AURA - Testes locais com Expo Go
node scripts\start-local.mjs --expo-go
if errorlevel 1 pause
