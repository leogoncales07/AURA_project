@echo off
setlocal
set "AUDIO_DIR=%~dp0tmp\aura-audio-candidates"

if not exist "%AUDIO_DIR%\manifest.json" (
  echo Os candidatos de audio ainda nao foram gerados.
  echo Execute: node scripts\generate-audio-candidates.mjs
  pause
  exit /b 1
)

echo A abrir os tres candidatos de audio da AURA.
echo Ouvir cada WAV com auscultadores e com o altifalante do telemovel.
echo Os ficheiros ainda nao estao instalados na aplicacao.
start "" explorer.exe "%AUDIO_DIR%"
endlocal
