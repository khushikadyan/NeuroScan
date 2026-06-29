@echo off
title MedVision - Next.js Frontend
echo ============================================
echo  Starting MedVision Frontend (Next.js)
echo ============================================
echo.
echo Frontend URL : http://localhost:3000
echo.
echo Starting production server (instant load)...
echo.

cd /d "C:\Users\fds48483\OneDrive - FactSet\Desktop\aa\medvision\frontend"
"C:\Users\fds48483\OneDrive - FactSet\Desktop\aa\tools\node-v20.19.1-win-x64\node.exe" node_modules\next\dist\bin\next start --port 3000

pause
