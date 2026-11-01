@echo off
setlocal
echo Starting CampusPath local development servers...
echo Make sure MongoDB is running and npm install has been completed in both folders.
start "CampusPath API" cmd /k "cd /d ""%~dp0server"" && npm run dev"
timeout /t 2 /nobreak >nul
start "CampusPath Web" cmd /k "cd /d ""%~dp0client"" && npm run dev"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
