@echo off
setlocal
cd /d "%~dp0"
title Local Business Lead Generation & Website Audit Automation

echo ================================================================
echo   LOCAL BUSINESS LEAD GENERATION & WEBSITE AUDIT AUTOMATION
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
