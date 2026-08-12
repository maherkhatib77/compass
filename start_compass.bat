@'
@echo off
echo ==========================================
echo   Starting Compass Server (Localhost Mode)
echo ==========================================
echo.

REM --- 1. הגדרת סביבה ---
echo [1/3] Setting up environment...
(
    echo DB_HOST=localhost
    echo DB_USER=ejpisgaorg_matspanet_app
    echo DB_PASSWORD=Adan.3011$
    echo DB_NAME=ejpisgaorg_matspanet_main
) > .env
echo Done.
echo.

REM --- 2. בדיקת חבילות ---
echo [2/3] Checking Python packages...
python -m pip install fastapi uvicorn mysql-connector-python python-dotenv aiofiles --quiet
echo.

REM --- 3. הפעלת השרת ---
echo [3/3] Starting Server...
echo ------------------------------------------
echo Server running at: http://localhost:8000
echo API at: http://localhost:8000/api
echo ------------------------------------------
python main.py
'@ | Out-File -FilePath start_compass.bat -Encoding ASCII