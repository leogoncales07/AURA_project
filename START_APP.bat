@echo off
cd /d "%~dp0"
echo AURA - Backend Node.js e Web
node scripts\start-local.mjs
if errorlevel 1 pause
