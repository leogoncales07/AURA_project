@echo off
cd /d "%~dp0"
echo AURA - Encerrar servicos locais iniciados pelo lancador
node scripts\stop-local.mjs
if errorlevel 1 pause
