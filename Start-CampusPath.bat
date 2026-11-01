@echo off
title CampusPath - Placement Portal

echo ========================================
echo       CAMPUSPATH PLACEMENT PORTAL
echo ========================================
echo.

echo Starting MongoDB service...
net start MongoDB

echo.
echo Starting CampusPath Backend...
start "CampusPath Backend" cmd /k "cd /d ""%~dp0server"" && npm run dev"

timeout /t 4 /nobreak >nul

echo Starting CampusPath Frontend...
start "CampusPath Frontend" cmd /k "cd /d ""%~dp0client"" && npm run dev"

timeout /t 6 /nobreak >nul

echo Opening CampusPath website...
start "" "http://localhost:5173"

echo.
echo CampusPath startup completed.
pause