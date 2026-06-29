@echo off
title MedVision - PostgreSQL Database
echo ============================================
echo  Starting PostgreSQL Database Server
echo ============================================

set "PGBIN=C:\Users\fds48483\OneDrive - FactSet\Desktop\aa\tools\pgsql\bin"
set "PGDATA=C:\Users\fds48483\OneDrive - FactSet\Desktop\aa\tools\pgdata"

"%PGBIN%\pg_ctl.exe" -D "%PGDATA%" status >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] PostgreSQL is already running.
) else (
    echo [..] Starting PostgreSQL...
    "%PGBIN%\pg_ctl.exe" -D "%PGDATA%" -l "%PGDATA%\pg.log" start
    timeout /t 3 /nobreak >nul
    echo [OK] PostgreSQL started on port 5432
)

echo.
echo Database : medvision
echo User     : postgres
echo Password : 4804
echo Port     : 5432
echo.
echo Leave this window open while using the app.
echo Press any key to STOP the database...
pause >nul

echo Stopping PostgreSQL...
"%PGBIN%\pg_ctl.exe" -D "%PGDATA%" stop
echo Done.
pause
