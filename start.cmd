@echo off
setlocal
cd /d "%~dp0"
title VELTIX & CO. — Lead Generation & Outreach Automation

echo ================================================================
echo   VELTIX & CO. — LEAD GENERATION & CLIENT AUTOMATION SYSTEM
echo   Portfolio: https://veltrixandco.vercel.app/
echo ================================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

echo Starting Automation System...
echo (Your web browser will open automatically at http://localhost:3000)
echo.

node server.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server stopped unexpectedly.
    pause
)
