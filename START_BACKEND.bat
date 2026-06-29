@echo off
title MedVision - FastAPI Backend
echo ============================================
echo  Starting MedVision Backend (FastAPI)
echo ============================================
echo.
echo Backend API : http://localhost:8000
echo API Docs    : http://localhost:8000/docs
echo.
echo Loading AI model... (takes 10-20 seconds)
echo.

cd /d "C:\Users\fds48483\OneDrive - FactSet\Desktop\aa\medvision\backend"
"C:\Users\fds48483\OneDrive - FactSet\Desktop\aa\medvision\backend\venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000

pause
