@echo off
cd /d "%~dp0"
echo AURA - Demonstracao escolar segura com Expo Go
echo Gemini sera bloqueado e os audios sem licenca nao serao utilizados.
node scripts\start-local.mjs --school-demo --expo-go
if errorlevel 1 pause
