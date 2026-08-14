# 📖 מדריך תצורה - מעבר קל בין סביבות פיתוח ופרודקשן

## 🎯 מטרה
מדריך זה מסביר כיצד להגדיר את המערכת כך שתעבוד הן בסביבת פיתוח מקומית (XAMPP) והן בשרת ענן, **ללא צורך בשינויים ידניים בקבצי ה-API**.

---

## 🏗️ הארכיטקטורה החדשה

### לפני השינוי:
```
❌ כל קובץ PHP הכיל הגדרות hardcoded:
   - $host = "10.0.0.4"
   - $password = "..."
   - header("Access-Control-Allow-Origin: *")
```

### אחרי השינוי:
```
✅ קובץ מרכזי אחד: config-manager.php
   - מגדיר סביבה אחת בלבד: $environment = 'local' או 'production'
   - כל קבצי ה-API שואבים הגדרות ממנו אוטומטית
```

---

## ⚙️ איך זה עובד?

### שלב 1: קובץ התצורה המרכזי
כל ההגדרות נמצאות ב-`config-manager.php`:

```php
// ⚙️ הגדרת סביבה - שנו כאן בלבד!
$environment = 'local';  // לפיתוח מקומי
// $environment = 'production';  // לשרת ענן
```

### שלב 2: קבצי ה-API
כל קובץ API כולל רק:
```php
require_once __DIR__ . '/../config-manager.php';
setCorsHeaders();

$config = getDbConfig();
$dsn = getDsn();
$conn = new PDO($dsn, $config['username'], $config['password']);
```

---

## 🚀 מעבר בין סביבות

### 🏠 סביבת פיתוח (XAMPP מקומי)

1. ודא ש-`config-manager.php` מכיל:
   ```php
   $environment = 'local';
   ```

2. הגדרות ברירת מחדל לפיתוח:
   - **Host**: `localhost`
   - **DB User**: `root`
   - **DB Password**: `` (ריק)
   - **CORS**: מרשה `localhost` ו-`127.0.0.1`

3. הפעל את XAMPP וגש ל:
   ```
   http://localhost/matspanet/
   ```

### ☁️ סביבת פרודקשן (שרת ענן)

1. שנה רק שורה אחת ב-`config-manager.php`:
   ```php
   $environment = 'production';
   ```

2. עדכן את ההגדרות ב-`$config_production`:
   ```php
   $config_production = [
       'host' => 'ejpisga.org',  // או IP של השרת
       'db_name' => 'ejpisgaorg_matspanet_main',
       'username' => 'ejpisgaorg_matspanet_app',
       'password' => 'סיסמה_חזקה',
       'cors_origins' => ['https://matspanet.ejpisga.org']
   ];
   ```

3. העלה את הקבצים לשרת - **המערכת תעבוד מייד!**

---

## 📋 רשימת קבצים שעודכנו

### קובץ תצורה מרכזי:
- ✅ `config-manager.php` - נוצר חדש

### קבצי API (48 קבצים):
כולם עודכנו להשתמש ב-`config-manager.php`:
- `auth.php`
- `get_users.php`
- `get_solutions.php`
- `get_budgets.php`
- `get_catalog_items.php`
- ... ו-43 קבצים נוספים

**אף קובץ לא מכיל יותר הגדרות hardcoded!**

---

## 🔒 אבטחה

### בפיתוח:
- CORS פתוח ל-`localhost`
- סיסמת DB ריקה (ברירת מחדל של XAMPP)

### בפרודקשן:
- CORS מוגבל לדומיין מאושר בלבד
- סיסמה חזקה לחיבור ל-DB
- אין הרשאות מיותרות

---

## 🛠️ תחזוקה שוטפת

### הוספת טבלה חדשה?
1. צור קובץ API חדש בתיקיית `/api`
2. העתק את המבנה הבא:

```php
<?php
require_once __DIR__ . '/../config-manager.php';
setCorsHeaders();
header("Content-Type: application/json; charset=UTF-8");

try {
    $config = getDbConfig();
    $dsn = getDsn();
    $conn = new PDO($dsn, $config['username'], $config['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $conn->query("SELECT * FROM your_table ORDER BY id DESC");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($results);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
```

3. **המערכת תעבוד אוטומטית בשתי הסביבות!**

---

## 📊 סיכום החסכונות

| פעולה | לפני | אחרי |
|-------|------|------|
| מעבר לפרודקשן | לערוך 48 קבצים ✏️ | לשנות שורה 1 בלבד ✅ |
| הוספת שרת חדש | לעדכן 48 קבצים ✏️ | לעדכן configmanager.py ✅ |
| תחזוקת CORS | ידני בכל קובץ ✏️ | פונקציה מרכזית ✅ |
| סיכון לטעויות | גבוה ❌ | נמוך ✅ |

---

## 🎉 נהניתם מהשינוי?

מעכשיו:
- ✅ **כל כתובות ה-IP הוסרו** מהקוד
- ✅ **משתמשים ב-`localhost`** בפיתוח
- ✅ **מעבר לפרודקשן** = שינוי שורה אחת
- ✅ **אין שינויים ידניים** בעת העלאה לענן

**חגגו! 🥳**
