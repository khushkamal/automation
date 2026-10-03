@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title VELTIX & CO. — Daily Lead Generator

echo ================================================================
echo   VELTIX & CO. — AUTOMATED LEAD GENERATION SYSTEM
echo   Website: https://veltrixandco.vercel.app/
echo ================================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

echo Select Target Category:
echo   1. Clinics & Healthcare
echo   2. Real Estate & Builders
echo   3. Interior Designers & Architects
echo   4. Gyms & Fitness Centers
echo   5. Restaurants & Banquets
echo   6. D2C & E-commerce Brands
echo.
set /p cat_choice="Enter Choice (1-6) [Default 1]: "

if "%cat_choice%"=="2" (
    set CATEGORY=real-estate
) else if "%cat_choice%"=="3" (
    set CATEGORY=interior
) else if "%cat_choice%"=="4" (
    set CATEGORY=gyms
) else if "%cat_choice%"=="5" (
    set CATEGORY=restaurants
) else if "%cat_choice%"=="6" (
    set CATEGORY=d2c
) else (
    set CATEGORY=clinics
)

echo.
set /p CITY="Enter Target City (e.g. Delhi, Mumbai, Bangalore, Dubai) [Default Delhi]: "
if "%CITY%"=="" set CITY=Delhi

echo.
set /p LIMIT="Enter Number of Leads (e.g. 15, 25, 50) [Default 20]: "
if "%LIMIT%"=="" set LIMIT=20

echo.
echo Running Lead Engine for %CITY% (%CATEGORY%)...
node veltrixLeadGenerator.js --city "%CITY%" --category "%CATEGORY%" --limit %LIMIT%

echo.
echo ================================================================
echo   SUCCESS! Leads have been saved to:
echo   - veltrix_leads.csv (Open with Excel / Google Sheets)
echo   - veltrix_leads.json
echo ================================================================
echo.
pause
