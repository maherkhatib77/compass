#!/bin/bash
# סקריפט הפעלה מהיר למערכת מצפן נט
# מיועד להרצה על השרת עם חיבור ל-MySQL

echo "=========================================="
echo "🚀 מפעיל את מערכת מצפן נט"
echo "=========================================="

# צבעים להודעות
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# פונקציה להדפסת הודעות
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# בדיקת תלות ראשוניות
echo ""
echo "📋 בודק תלות..."

# בדיקת Python
if ! command -v python3 &> /dev/null; then
    log_error "Python3 לא מותקן. אנא התקן Python3 והפעל מחדש."
    exit 1
fi
log_info "Python3 נמצא: $(python3 --version)"

# בדיקת pip
if ! command -v pip3 &> /dev/null; then
    log_error "pip3 לא מותקן. אנא התקן pip3 והפעל מחדש."
    exit 1
fi
log_info "pip3 נמצא: $(pip3 --version)"

# בדיקת MySQL
if ! command -v mysql &> /dev/null; then
    log_warn "לקוח MySQL לא נמצא (לא קריטי אם השרת מרוחק)"
else
    log_info "MySQL Client נמצא: $(mysql --version)"
fi

# בדיקת חיבור לשרת MySQL
echo ""
echo "🔌 בודק חיבור ל-MySQL..."
DB_HOST="10.0.0.4"
DB_USER="ejpisgaorg_matspanet_app"
DB_PASS='Adan.3011$'
DB_NAME="ejpisgaorg_matspanet_main"

# יצירת קובץ .env עם הגדרות השרת
echo ""
echo "⚙️  מעדכן הגדרות סביבה..."
cat > .env << EOF
# הגדרות מסד נתונים - חיבור לשרת MySQL
DB_HOST=$DB_HOST
DB_PORT=3306
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_NAME=$DB_NAME
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci

# הגדרות שרת API
API_HOST=0.0.0.0
API_PORT=8000

# CORS - לדומיינים מותרים
CORS_ORIGINS=*

# Debug Mode (לפיתוח בלבד!)
DEBUG=True

# Secret Key
SECRET_KEY=matspanet-secret-key-2024
EOF

log_info "קובץ .env עודכן בהצלחה"

# התקנת תלות
echo ""
echo "📦 מתקין תלות Python..."
pip3 install -r requirements.txt --quiet
log_info "התלות הותקנו בהצלחה"

# בדיקת חיבור ל-MySQL לפני ההפעלה
echo ""
echo "🧪 בודק חיבור למסד הנתונים..."
python3 -c "
import mysql.connector
try:
    conn = mysql.connector.connect(
        host='$DB_HOST',
        port=3306,
        user='$DB_USER',
        password='$DB_PASS',
        database='$DB_NAME',
        charset='utf8mb4'
    )
    cursor = conn.cursor()
    cursor.execute('SELECT 1')
    cursor.fetchone()
    cursor.close()
    conn.close()
    print('SUCCESS')
except Exception as e:
    print(f'ERROR: {e}')
" | grep -q "SUCCESS"

if [ $? -eq 0 ]; then
    log_info "חיבור ל-MySQL תקין!"
else
    log_error "נכשל בחיבור ל-MySQL. בדוק שהשרת זמין והפורט 3306 פתוח."
    exit 1
fi

# בדיקת טבלאות קיימות
echo ""
echo "📊 בודק טבלאות במסד הנתונים..."
python3 -c "
import mysql.connector
conn = mysql.connector.connect(
    host='$DB_HOST',
    port=3306,
    user='$DB_USER',
    password='$DB_PASS',
    database='$DB_NAME',
    charset='utf8mb4'
)
cursor = conn.cursor()
cursor.execute('SHOW TABLES')
tables = cursor.fetchall()
print(f'נמצאו {len(tables)} טבלאות:')
for table in tables:
    print(f'  - {table[0]}')
cursor.close()
conn.close()
"

# הפעלת השרת
echo ""
echo "=========================================="
echo "🚀 מפעיל את שרת ה-API..."
echo "=========================================="
echo "השרת יפעל על כתובת: http://0.0.0.0:8000"
echo "לעצירה לחץ Ctrl+C"
echo ""

# הפעלה עם uvicorn
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
