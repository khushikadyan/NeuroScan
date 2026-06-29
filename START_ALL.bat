@echo off
title MedVision - Start All Services
echo ============================================
echo  MedVision - Starting All Services
echo ============================================
echo.
echo This will open 3 windows:
echo   1. PostgreSQL Database  (port 5432)
echo   2. FastAPI Backend      (port 8000)
echo   3. Next.js Frontend     (port 3000)
echo.
echo After all 3 start, open your browser at:
echo   http://localhost:3000
echo.
echo Press any key to start all services...
pause >nul

echo.
echo [1/3] Starting Database...
start "MedVision - Database" cmd /k ""C:\Users\fds48483\OneDrive - FactSet\Desktop\aa\medvision\START_DATABASE.bat""

echo Waiting for database to fully start...
timeout /t 12 /nobreak >nul

echo [2/3] Starting Backend (AI model loading)...
start "MedVision - Backend" cmd /k ""C:\Users\fds48483\OneDrive - FactSet\Desktop\aa\medvision\START_BACKEND.bat""

echo Waiting for backend to load...
timeout /t 20 /nobreak >nul

echo [3/3] Starting Frontend...
start "MedVision - Frontend" cmd /k ""C:\Users\fds48483\OneDrive - FactSet\Desktop\aa\medvision\START_FRONTEND.bat""

echo.
echo ============================================
echo  All services are starting up!
echo  Opening browser in 30 seconds...
echo ============================================
timeout /t 30 /nobreak >nul

start http://localhost:3000

echo.
echo Browser opened at http://localhost:3000
echo.
echo To STOP everything: close the 3 service windows.
echo.
pause
