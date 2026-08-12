# מדריך פריסה לשרת ענן - מצפן נט

## מבוא
מדריך זה מסביר כיצד לפרוס את מערכת "מצפן נט" על שרת ענן, לאחר פיתוח מקומי.

## שלבי הפריסה:

### 1. הכנות לפני העלאה לשרת

#### א. יצירת קובץ .env חדש לפרודקשן
```bash
# צור קובץ .env חדש עם ההגדרות הבאות:
DB_HOST=כתובת_שרת_MySQL_שלך
DB_USER=שם_משתמש_מאובטח
DB_PASS=סיסמה_חזקה_ומורכבת
DB_NAME=ejpisgaorg_matspanet_main
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci

API_HOST=0.0.0.0
API_PORT=8000

CORS_ORIGINS=https://matspanet.co.il

DEBUG=False
```

#### ב. וידוא הגדרות אבטחה
- ✅ הסר את קובץ `.env` מ-Git (כלול ב-.gitignore)
- ✅ השתמש בסיסמאות חזקות למסד הנתונים
- ✅ הגדר `DEBUG=False`
- ✅ הגבל CORS לדומיין הספציפי שלך

### 2. הקמת שרת ענן

#### אפשרויות מומלצות:
1. **AWS EC2** - גמיש ומקצועי
2. **DigitalOcean Droplet** - פשוט וזול
3. **Google Cloud Compute Engine** - אינטגרציה טובה עם שירותי Google
4. **Heroku** - קל לתפעול (מתאים להתחלה)

#### דרישות מינימליות לשרת:
- CPU: 2 cores
- RAM: 2GB
- Storage: 20GB SSD
- OS: Ubuntu 20.04 LTS או newer

### 3. התקנת תלות על השרת

```bash
# עדכון המערכת
sudo apt update && sudo apt upgrade -y

# התקנת Python 3.10+
sudo apt install python3 python3-pip python3-venv -y

# התקנת MySQL Client
sudo apt install default-libmysqlclient-dev -y

# התקנת Nginx (לאחסון קבצים סטטיים ו-proxy)
sudo apt install nginx -y

# התקנת Supervisor (לניהול תהליכים)
sudo apt install supervisor -y
```

### 4. הגדרת סביבת עבודה

```bash
# יצירת תיקיית פרויקט
sudo mkdir -p /var/www/matspanet
cd /var/www/matspanet

# יצירת סביבה וירטואלית
python3 -m venv venv
source venv/bin/activate

# העלאת הקבצים לשרת (באמצעות Git או SCP)
git clone <repository_url> .

# התקנת תלות Python
pip install -r requirements.txt
```

### 5. יצירת קובץ requirements.txt

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
mysql-connector-python==8.3.0
python-dotenv==1.0.0
gunicorn==21.2.0
```

### 6. הגדרת מסד נתונים בשרת הענן

#### אפשרות א': AWS RDS
```bash
# צור מסד נתונים ב-AWS RDS Console
# השתמש בפרטים שיתקבלו בקובץ ה-.env
```

#### אפשרות ב': התקנת MySQL על השרת
```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation

# כניסה ל-MySQL
sudo mysql

# יצירת מסד נתונים ומשתמש
CREATE DATABASE ejpisgaorg_matspanet_main CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'matspanet_user'@'localhost' IDENTIFIED BY 'סיסמה_חזקה_מאוד';
GRANT ALL PRIVILEGES ON ejpisgaorg_matspanet_main.* TO 'matspanet_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 7. הגדרת Gunicorn כ-Application Server

צור קובץ `/var/www/matspanet/gunicorn.conf.py`:
```python
bind = "127.0.0.1:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5
errorlog = "/var/log/matspanet/error.log"
accesslog = "/var/log/matspanet/access.log"
loglevel = "info"
```

### 8. הגדרת Supervisor להפעלה אוטומטית

צור קובץ `/etc/supervisor/conf.d/matspanet.conf`:
```ini
[program:matspanet]
command=/var/www/matspanet/venv/bin/gunicorn -c gunicorn.conf.py main:app
directory=/var/www/matspanet
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/matspanet/out.log
```

לאחר מכן:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start matspanet
```

### 9. הגדרת Nginx כ-Reverse Proxy

צור קובץ `/etc/nginx/sites-available/matspanet`:
```nginx
server {
    listen 80;
    server_name matspanet.co.il www.matspanet.co.il;

    # הפניה לקבצים סטטיים
    location / {
        root /var/www/matspanet;
        try_files $uri $uri/ =404;
    }

    # Reverse Proxy ל-API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # הגדרות אבטחה
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

הפעל את ההגדרה:
```bash
sudo ln -s /etc/nginx/sites-available/matspanet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 10. הגדרת SSL עם Let's Encrypt

```bash
# התקנת Certbot
sudo apt install certbot python3-certbot-nginx -y

# יצירת תעודת SSL
sudo certbot --nginx -d matspanet.co.il -d www.matspanet.co.il

# חידוש אוטומטי
sudo certbot renew --dry-run
```

### 11. בדיקת תקינות

```bash
# בדיקת סטטוס השירותים
sudo supervisorctl status matspanet
sudo systemctl status nginx

# בדיקת לוגים
tail -f /var/log/matspanet/error.log
tail -f /var/log/nginx/error.log

# בדיקת API
curl https://matspanet.co.il/api/solutions
```

## טיפים לתחזוקה שוטפת:

### גיבוי מסד נתונים
```bash
# יצירת גיבוי יומי
mysqldump -u matspanet_user -p ejpisgaorg_matspanet_main > backup_$(date +%Y%m%d).sql

# העלאה ל-S3 (אופציונלי)
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-bucket/backups/
```

### ניטור
- השתמש ב-**CloudWatch** (AWS) או **Datadog** לניטור ביצועים
- הגדר התראות על זמינות האתר
- עקוב אחרי לוגים באופן שוטף

### עדכונים
```bash
cd /var/www/matspanet
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo supervisorctl restart matspanet
```

## פתרון תקלות נפוצות:

### 1. שגיאות חיבור למסד נתונים
- בדוק שהשרת MySQL פעיל
- וודא שה-firewall מאפשר חיבורים
- בדוק הגדרות user@host ב-MySQL

### 2. שגיאות הרשאה
```bash
sudo chown -R www-data:www-data /var/www/matspanet
sudo chmod -R 755 /var/www/matspanet
```

### 3. בעיות CORS
- וודא ש-CORS_ORIGINS כולל את הדומיין הנכון
- בדוק הגדרות Nginx

## עלויות משוערות (חודשיות):

| שירות | עלות משוערת |
|--------|-------------|
| שרת ענן (2GB RAM) | $10-20 |
| מסד נתונים Managed | $15-25 |
| אחסון קבצים (S3) | $5-10 |
| תעודת SSL | חינם (Let's Encrypt) |
| **סה״כ** | **$30-55 לחודש** |

## המלצות נוספות:

1. **CDN** - השתמש ב-Cloudflare לשיפור ביצועים ואבטחה
2. **Backup אוטומטי** - הגדר גיבוי יומי למסד הנתונים
3. **Monitoring** - השתמש בכלי ניטור כמו New Relic או Sentry
4. **CI/CD** - הגדר pipeline אוטומטי לבדיקות ופריסה
5. **Scaling** - תכנן ארכיטקטורה שתאפשר גדילה עתידית

---

**בהצלחה! 🚀**
