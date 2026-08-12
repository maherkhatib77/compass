@echo off
echo ==========================================
echo   מאתחל את מערכת Compass עם MySQL
echo   שרת: 10.0.0.4 | מסד: ejpisgaorg_matspanet_main
echo ==========================================

:: 1. בדיקת Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [שגיאה] Python לא מותקן או לא נמצא ב-PATH!
    pause
    exit /b
)

:: 2. יצירת קובץ הסביבה (.env) עם ההגדרות שלך
echo יוצר קובץ הגדרות...
(
    echo DB_HOST=10.0.0.4
    echo DB_NAME=ejpisgaorg_matspanet_main
    echo DB_USER=ejpisgaorg_matspanet_app
    echo DB_PASSWORD=Adan.3011$
    echo DB_PORT=3306
    echo SERVER_HOST=0.0.0.0
    echo SERVER_PORT=8000
) > .env

:: 3. התקנת חביות (אם חסרות)
echo מתקין ספריות נדרשות...
pip install mysql-connector-python flask flask-cors python-dotenv

:: 4. הפעלת השרת
echo מפעיל את השרת...
echo גש אל: http://localhost:8000
python app.py

pause