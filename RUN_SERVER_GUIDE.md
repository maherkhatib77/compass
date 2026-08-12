# 🚀 מדריך הפעלה מהיר - מערכת מצפן נט

## דרישות מוקדמות
- Python 3.8+
- pip3
- גישה לשרת MySQL (10.0.0.4:3306)

## התקנה והפעלה בפקודה אחת

```bash
# העתק את הפרויקט לשרת (אם עדיין לא העתקת)
cd /path/to/your/project

# הפעל את סקריפט ההפעלה
./run_server.sh
```

## מה הסקריפט עושה?

1. ✅ בודק תלות (Python, pip, MySQL)
2. ✅ יוצר קובץ `.env` עם הגדרות השרת שלך
3. ✅ מתקין את כל החבילות הנדרשות מ-`requirements.txt`
4. ✅ בודק חיבור למסד הנתונים
5. ✅ מציג רשימת טבלאות קיימות
6. ✅ מפעיל את שרת ה-API על פורט 8000

## פרטי מסד הנתונים (מוגדרים אוטומטית)

- **Host**: `10.0.0.4` (הכתובת הפנימית של השרת)
- **Port**: `3306`
- **Database**: `ejpisgaorg_matspanet_main`
- **User**: `ejpisgaorg_matspanet_app`
- **Password**: `Adan.3011$`

## גישה למערכת

לאחר ההפעלה, המערכת תהיה זמינה ב:
- **API**: http://localhost:8000
- **דף הבית**: http://localhost:8000/index.html
- **מערכת ניהול**: http://localhost:8000/dashboard.html

## עצירה והפעלה מחדש

### עצירה
לחץ `Ctrl+C` בטרמינל כדי לעצור את השרת.

### הפעלה מחדש
```bash
./run_server.sh
```

## הפעלה ברקע (Production)

להפעלת השרת ברקע:

```bash
# באמצעות nohup
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &

# או באמצעות screen
screen -S matspanet
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
# Ctrl+A, D כדי לצאת מ-screen
```

## בדיקת תקינות השרת

```bash
# בדיקת API בסיסית
curl http://localhost:8000/api/test

# בדיקת חיבור ל-MySQL
python3 db_connector.py
```

## פתרון תקלות

### שגיאת חיבור ל-MySQL
```
❌ נכשל בחיבור ל-MySQL. בדוק שהשרת זמין והפורט 3306 פתוח.
```

**פתרון:**
1. ודא ששרת MySQL פועל: `sudo systemctl status mysql`
2. בדוק שהפורט 3306 פתוח: `netstat -tlnp | grep 3306`
3. ודא שהמשתמש יכול להתחבר מרחוק

### שגיאת הרשאות
```
bash: ./run_server.sh: Permission denied
```

**פתרון:**
```bash
chmod +x run_server.sh
```

### חבילות Python חסרות
```
ModuleNotFoundError: No module named 'fastapi'
```

**פתרון:**
```bash
pip3 install -r requirements.txt
```

## הערות חשובות

⚠️ **אבטחה**: 
- שנה את `SECRET_KEY` בקובץ `.env` לפני עלייה לפרודקשן
- הגדר CORS רק לדומיינים מותרים במקום `*`

📊 **ביצועים**:
- בפרודקשן השתמש ב-gunicorn עם מספר workers
- שקול להשתמש ב-Redis ל-cache

🔄 **עדכונים**:
- לאחר עדכון קוד, עצור את השרת והפעל מחדש
- בצע backup למסד הנתונים לפני עדכונים גדולים

---

**נוצר עבור**: מצפן נט  
**תאריך**: 2024  
**גרסה**: 1.0
