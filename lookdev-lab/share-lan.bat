@echo off
rem Share Sanctuary Lookdev Lab on the local network (http://<this PC>:4175). LAN viewers get WebGL2:
rem browsers only allow WebGPU on https or localhost. Windows may ask to allow Node.js on private networks.
cd /d "%~dp0"
title Sanctuary Lookdev Lab - LAN
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed: https://nodejs.org
  pause
  exit /b 1
)
node scripts\serve.mjs --lan %*
pause
