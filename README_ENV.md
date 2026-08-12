# מדריך הגדרת קובץ סביבה (.env) לפרויקט מצפן נט

## מבנה קובץ .env

הקובץ `.env` מכיל את כל המשתנים הנחוצים להפעלת המערכת. יש ליצור אותו בתיקיית השורש של הפרויקט.

### דוגמה לקובץ .env (לפיתוח מקומי):

```env
# הגדרות מסד נתונים - לפיתוח מקומי
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=ejpisgaorg_matspanet_main
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci

# הגדרות שרת API
API_HOST=0.0.0.0
API_PORT=8000

# CORS - לדומיינים מותרים (בפיתוח ניתן להשאיר *)
CORS_ORIGINS=*

# Debug Mode (לפיתוח בלבד!)
DEBUG=True
```

## הסבר על המשתנים:

| משתנה | תיאור | ערך ברירת מחדל |
|--------|--------|-----------------|
| `DB_HOST` | כתובת השרת של מסד הנתונים | `localhost` |
| `DB_USER` | שם משתמש למסד הנתונים | `root` |
| `DB_PASS` | סיסמה למסד הנתונים (ריק לפיתוח מקומי) | `` |
| `DB_NAME` | שם מסד הנתונים | `ejpisgaorg_matspanet_main` |
| `DB_CHARSET` | קידוד תווים | `utf8mb4` |
| `DB_COLLATION` | סדר מיון | `utf8mb4_unicode_ci` |
| `API_HOST` | כתובת השרת של ה-API | `0.0.0.0` |
| `API_PORT` | פורט ה-API | `8000` |
| `CORS_ORIGINS` | דומיינים מותרים לבקשות CORS | `*` |
| `DEBUG` | מצב דיבאג (רק לפיתוח!) | `True` |

## הגדרות לסביבות שונות:

### 1. פיתוח מקומי (Local Development)
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=ejpisgaorg_matspanet_main
DEBUG=True
```

### 2. שרת ענן (Cloud Production)
```env
DB_HOST=כתובת_שרת_הענן_שלך
DB_USER=שם_משתמש_מאובטח
DB_PASS=סיסמה_חזקה_ומאובטחת
DB_NAME=ejpisgaorg_matspanet_main
DEBUG=False
CORS_ORIGINS=https://matspanet.co.il
```

### 3. שרת ביניים (Staging)
```env
DB_HOST=כתובת_שרת_הביניים
DB_USER=שם_משתמש_staging
DB_PASS=סיסמה_staging
DB_NAME=ejpisgaorg_matspanet_staging
DEBUG=True
```

## אבטחה:

⚠️ **חשוב מאוד:**
- קובץ `.env` **לא אמור** להיות מועלה ל-Git (כלול ב-.gitignore)
- בפרודקשן, השתמש בסיסמאות חזקות ומאובטחות
- אל תשתמש ב-`DEBUG=True` בפרודקשן
- הגבל את `CORS_ORIGINS` לדומיינים ספציפיים בפרודקשן

## הפעלת המערכת:

1. וודא שמסד הנתונים קיים ונגיש
2. צור קובץ `.env` עם ההגדרות המתאימות
3. הרץ את השרת:
   ```bash
   python main.py
   ```
4. גש ל-API בדפדפן: `http://127.0.0.1:8000/docs`

## פתרון תקלות:

### שגיאת חיבור למסד הנתונים:
- וודא ששרת MySQL פועל
- בדוק שההגדרות בקובץ `.env` נכונות
- וודא שמסד הנתונים קיים

### שגיאות CORS:
- בפיתוח: השאר `CORS_ORIGINS=*`
- בפרודקשן: החלף לכתובת הדומיין שלך

