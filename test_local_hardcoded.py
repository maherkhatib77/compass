import mysql.connector
from mysql.connector import Error

def connect_local():
    try:
        # ב-XAMPP ברירת המחדל היא root ללא סיסמה
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',  # חובה להשאיר ריק לגמרי ללא רווחים
            database='ejpisgaorg_matspanet_main' # וודא שהמסד נוצר!
        )

        if connection.is_connected():
            print("✅ הצלחה! מחובר ל-MySQL מקומי.")
            cursor = connection.cursor()
            cursor.execute("SELECT DATABASE();")
            print(f"📂 מסד נתונים נוכחי: {cursor.fetchone()[0]}")
            cursor.close()
            connection.close()
        else:
            print("❌ החיבור נכשל.")

    except Error as e:
        print(f"❌ שגיאה: {e}")
        print("\n💡 טיפ קריטי:")
        print("1. האם יצרת את מסד הנתונים 'ejpisgaorg_matspanet_main' ב-phpMyAdmin?")
        print("2. נסה לשנות את המשתמש ל-'root' ולהשאיר password ריק לגמרי (ללא רווחים).")
        print("3. אם יש לך סיסמה ל-root, הכנס אותה במקום המחרוזת הריקה.")

if __name__ == "__main__":
    connect_local()