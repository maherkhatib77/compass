import mysql.connector
import bcrypt

# -- פרטי החיבור (תוקן ל-localhost) --
DB_CONFIG = {
    'host': 'localhost',          # <-- תוקן ל-localhost (במקום 10.0.0.4)
    'user': 'ejpisgaorg_matspanet_app',
    'password': 'Adan.3011$',
    'database': 'ejpisgaorg_matspanet_main'
}

# -- פרטי המשתמש לאיפוס --
TARGET_USERNAME = "admin"      # <-- המשתמש קיים בטבלה
NEW_PASSWORD = "admin"         # <-- הסיסמה החדשה
# -----------------------------------------

def reset_password():
    conn = None  # <-- תיקון: מאתחל את המשתנה למקרה של כשלון התחברות
    cursor = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # יצירת Bcrypt Hash (עלות 10, תואם $2y$10$)
        hashed = bcrypt.hashpw(NEW_PASSWORD.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')

        # עדכון – שם הטבלה `users`, העמודה `password_hash`
        sql = "UPDATE users SET password_hash = %s WHERE username = %s"
        cursor.execute(sql, (hashed, TARGET_USERNAME))
        conn.commit()

        if cursor.rowcount > 0:
            print(f"✅ הסיסמה עבור המשתמש '{TARGET_USERNAME}' אופסה בהצלחה!")
            print(f"   סיסמה חדשה: {NEW_PASSWORD}")
            print(f"   Hash חדש: {hashed}")
        else:
            print(f"❌ המשתמש '{TARGET_USERNAME}' לא נמצא בטבלה.")

    except mysql.connector.Error as err:
        print(f"❌ שגיאת MySQL: {err}")
    except Exception as e:
        print(f"❌ שגיאה כללית: {e}")
    finally:
        # תיקון: בודק אם conn וה-cursor קיימים לפני הסגירה
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

if __name__ == "__main__":
    reset_password()