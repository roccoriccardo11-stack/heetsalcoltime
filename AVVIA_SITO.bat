@echo off
echo ========================================================
echo   Avvio di HEETS ALCOL TIME in corso...
echo ========================================================
cd /d "%~dp0"
start http://localhost:5173
npm.cmd run dev
pause
