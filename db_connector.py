import mysql.connector
from mysql.connector import pooling
import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from datetime import datetime

# טעינת הגדרות מהסביבה
load_dotenv()

class DatabaseManager:
    def __init__(self):
        """מאתחל את חיבור ה-MySQL"""
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 3306)),
            'user': os.getenv('DB_USER', 'ejpisgaorg_matspanet_app'),
            'password': os.getenv('DB_PASS', 'Adan.3011$'),
            'database': os.getenv('DB_NAME', 'ejpisgaorg_matspanet_main'),
            'charset': os.getenv('DB_CHARSET', 'utf8mb4'),
            'collation': os.getenv('DB_COLLATION', 'utf8mb4_unicode_ci'),
            'autocommit': True
        }
        self._initialize_db()
    
    def _initialize_db(self):
        """בודק את החיבור למסד הנתונים - לא יוצר טבלאות (הן אמורות להיות קיימות)"""
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor()
            
            # בדיקה בסיסית שהחיבור עובד
            cursor.execute("SELECT 1")
            cursor.fetchone()
            
            cursor.close()
            conn.close()
            print("✅ חיבור ל-MySQL הוקם בהצלחה.")
        except Exception as e:
            print(f"⚠️ אזהרה בחיבור ל-MySQL: {e}")
            print("⚠️ השרת ימשיך לעבוד אך קריאות API לדאטה בייס ייכשלו")
            # לא זורק exception כדי לאפשר לשרת לעבוד גם ללא DB
            # raise
    
    def get_connection(self):
        """מחזיר חיבור למסד הנתונים"""
        return mysql.connector.connect(**self.db_config)
    
    def fetch_all(self, query, params=None) -> List[Dict[str, Any]]:
        """שולף מספר שורות ומחזיר רשימת מילונים."""
        conn = None
        cursor = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, params or ())
            rows = cursor.fetchall()
            
            # המרת תאריכים ו-decimal ל-types סטנדרטיים
            for row in rows:
                for key, value in row.items():
                    if isinstance(value, datetime):
                        row[key] = value.strftime('%Y-%m-%d %H:%M:%S')
                    elif hasattr(value, '__float__'):
                        # טיפול ב-Decimal types
                        row[key] = float(value) if value is not None else None
            
            return rows
        except Exception as e:
            raise e
        finally:
            if cursor: 
                cursor.close()
            if conn: 
                conn.close()
    
    def fetch_one(self, query, params=None) -> Optional[Dict[str, Any]]:
        """שולף שורה אחת ומחזיר מילון או None."""
        conn = None
        cursor = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, params or ())
            row = cursor.fetchone()
            
            if row:
                for key, value in row.items():
                    if isinstance(value, datetime):
                        row[key] = value.strftime('%Y-%m-%d %H:%M:%S')
                    elif hasattr(value, '__float__'):
                        row[key] = float(value) if value is not None else None
            
            return row
        except Exception as e:
            raise e
        finally:
            if cursor: 
                cursor.close()
            if conn: 
                conn.close()
    
    def execute(self, query, params=None) -> int:
        """מבצע פעולת כתיבה (INSERT/UPDATE/DELETE) ומחזיר את מספר השורות שהושפעו."""
        conn = None
        cursor = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            conn.commit()
            return cursor.rowcount
        except Exception as e:
            if conn: 
                conn.rollback()
            raise e
        finally:
            if cursor: 
                cursor.close()
            if conn: 
                conn.close()
    
    def executemany(self, query, params_list: List[tuple]) -> int:
        """מבצע INSERT/UPDATE עבור מספר רשומות."""
        conn = None
        cursor = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.executemany(query, params_list)
            conn.commit()
            return cursor.rowcount
        except Exception as e:
            if conn: 
                conn.rollback()
            raise e
        finally:
            if cursor: 
                cursor.close()
            if conn: 
                conn.close()
    
    def close(self):
        """סוגר חיבורים (אופציונלי כי אנו סוגרים בכל פונקציה)."""
        pass

if __name__ == "__main__":
    # בדיקה עצמית
    print("\n🧪 בודק תקינות מודול DB...")
    db = None
    try:
        db = DatabaseManager()
        users = db.fetch_all("SELECT COUNT(*) as count FROM users")
        print(f"✅ נמצאו {users[0]['count']} משתמשים במסד הנתונים.")
        
        solutions = db.fetch_all("SELECT COUNT(*) as count FROM learning_solutions")
        print(f"✅ נמצאו {solutions[0]['count']} פתרונות למידה.")
        
        print("\n🎉 המודול עובד תקין ומוכן לשימוש!")
    except Exception as e:
        print(f"❌ שגיאה בבדיקה: {e}")
    finally:
        if db:
            db.close()