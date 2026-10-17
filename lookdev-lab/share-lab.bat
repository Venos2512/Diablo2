@echo off
rem Share Sanctuary Lookdev Lab over the Internet with a Cloudflare quick tunnel (https link, WebGPU works).
rem Needs Node.js (https://nodejs.org) and cloudflared (winget install --id Cloudflare.cloudflared).
cd /d "%~dp0"
title Sanctuary Lookdev Lab - share
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed: https://nodejs.org
  pause
  exit /b 1
)
node scripts\share.mjs %*
pause
