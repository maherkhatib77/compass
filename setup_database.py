#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
סקריפט להקמת מסד נתונים MySQL למערכת מצפן נט
משתמש בהגדרות מהקובץ .env או ברירות מחדל
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
import getpass

# טעינת הגדרות סביבה
load_dotenv()

# הגדרות חיבור ל-MySQL
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', '')
}

# פרטי מסד הנתונים של המערכת
TARGET_DB = os.getenv('DB_NAME', 'ejpisgaorg_matspanet_main')
TARGET_USER = os.getenv('DB_APP_USER', 'ejpisgaorg_matspanet_app')
TARGET_PASSWORD = os.getenv('DB_APP_PASSWORD', '')


def print_success(message):
    print(f"✅ {message}")


def print_error(message):
    print(f"❌ {message}")


def print_info(message):
    print(f"ℹ️  {message}")


def connect_to_mysql(root_password=None):
    """מתחבר ל-MySQL כ-root"""
    try:
        config = DB_CONFIG.copy()
        if root_password:
            config['password'] = root_password
        
        connection = mysql.connector.connect(**config)
        if connection.is_connected():
            print_success("חיבור ל-MySQL הוקם בהצלחה")
            return connection
    except Error as e:
        print_error(f"שגיאה בחיבור ל-MySQL: {e}")
        return None


def create_database_and_user(connection, db_name, app_user, app_password):
    """יוצר מסד נתונים ומשתמש ייעודי"""
    cursor = connection.cursor()
    
    try:
        # יצירת מסד הנתונים
        print_info(f"יוצר מסד נתונים: {db_name}")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print_success(f"מסד הנתונים {db_name} נוצר/קיים")
        
        # יצירת משתמש אם לא קיים
        print_info(f"יוצר משתמש: {app_user}")
        cursor.execute(f"CREATE USER IF NOT EXISTS '{app_user}'@'%' IDENTIFIED BY %s", (app_password,))
        print_success(f"המשתמש {app_user} נוצר/קיים")
        
        # מתן הרשאות
        print_info("מעניק הרשאות למשתמש על מסד הנתונים")
        cursor.execute(f"GRANT ALL PRIVILEGES ON `{db_name}`.* TO '{app_user}'@'%'")
        cursor.execute("FLUSH PRIVILEGES")
        print_success("ההרשאות הוענקו בהצלחה")
        
        connection.commit()
        return True
        
    except Error as e:
        print_error(f"שגיאה ביצירת מסד הנתונים/משתמש: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()


def read_schema_file(filename='matspanet_db_schema.sql'):
    """קורא את קובץ ה-schema"""
    if not os.path.exists(filename):
        print_error(f"הקובץ {filename} לא נמצא")
        return None
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print_success(f"נקרא קובץ schema: {filename}")
    return content


def execute_schema(connection, db_name, schema_content):
    """מבצע את ה-schema במסד הנתונים"""
    cursor = connection.cursor()
    
    try:
        # בחירת מסד הנתונים
        cursor.execute(f"USE `{db_name}`")
        
        # פיצול ל-statements בצורה חכמה יותר
        # התעלמות מ-comment lines ו-empty lines
        statements = []
        current_statement = []
        in_delimiter_block = False
        delimiter_mode = ';'  # default delimiter
        
        lines = schema_content.split('\n')
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # דילוג על הערות ריקות או תחילתיות
            if not stripped or stripped.startswith('--'):
                i += 1
                continue
            
            # טיפול ב-DELIMITER
            if stripped.startswith('DELIMITER '):
                if stripped == 'DELIMITER $$':
                    delimiter_mode = '$$'
                    in_delimiter_block = True
                elif stripped == 'DELIMITER ;':
                    delimiter_mode = ';'
                    in_delimiter_block = False
                i += 1
                continue
            
            # הוספת השורה ל-statement הנוכחי
            current_statement.append(line)
            
            # בדיקה אם הגענו לסוף statement
            if delimiter_mode == ';':
                if stripped.endswith(';'):
                    stmt = '\n'.join(current_statement).strip()
                    if stmt and not stmt.startswith('--'):
                        statements.append(stmt)
                    current_statement = []
            else:  # delimiter_mode == '$$'
                if stripped.endswith('$$'):
                    # סיום trigger/procedure
                    full_stmt = '\n'.join(current_statement)
                    # החלת $$ ב-; לפני הביצוע
                    full_stmt = full_stmt.replace('$$', ';')
                    statements.append(full_stmt)
                    current_statement = []
            
            i += 1
        
        # הוספת statement אחרון אם קיים (למקרה שלא הסתיים ב-delimiter)
        if current_statement:
            stmt = '\n'.join(current_statement).strip()
            if stmt and not stmt.startswith('--'):
                # אם זה לא מסתיים ב-;, נוסיף אחד
                if not stmt.endswith(';'):
                    stmt += ';'
                statements.append(stmt)
        
        print_info(f"מבצע {len(statements)} פעולות schema")
        
        success_count = 0
        error_count = 0
        errors_list = []
        
        for i, stmt in enumerate(statements, 1):
            stmt = stmt.strip()
            if not stmt or stmt.startswith('--'):
                continue
            
            try:
                cursor.execute(stmt)
                success_count += 1
                
                if i % 10 == 0:
                    print_info(f"בוצעו {i} מתוך {len(statements)} פעולות...")
                    
            except Error as e:
                error_msg = str(e)
                # חלק מהשגיאות הן צפויות (כמו ON DUPLICATE KEY)
                if 'Duplicate' not in error_msg and 'Duplicate entry' not in error_msg:
                    print_error(f"שגיאה בפקודה {i}: {e}")
                    errors_list.append((i, stmt[:100], error_msg))
                    error_count += 1
        
        connection.commit()
        print_success(f"ה-schema בוצע בהצלחה! ({success_count} פעולות, {error_count} שגיאות)")
        
        if errors_list:
            print_info("פירוט שגיאות:")
            for err_num, stmt_preview, err_msg in errors_list[:5]:  # הצג רק 5 ראשונות
                print(f"   פקודה {err_num}: {stmt_preview}...")
                print(f"      שגיאה: {err_msg}")
        
        return error_count == 0
        
    except Error as e:
        print_error(f"שגיאה כללית בביצוע schema: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()


def verify_setup(connection, db_name, app_user):
    """מאמת שההקמה הצליחה"""
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute(f"USE `{db_name}`")
        
        # בדיקת טבלאות
        cursor.execute("SHOW TABLES")
        tables = [row[f'Tables_in_{db_name}'] for row in cursor.fetchall()]
        
        print_success(f"נמצאו {len(tables)} טבלאות במסד הנתונים:")
        for table in sorted(tables):
            print(f"   - {table}")
        
        # בדיקת משתמשים
        cursor.execute("SELECT User, Host FROM mysql.user WHERE User = %s", (app_user,))
        users = cursor.fetchall()
        
        if users:
            print_success(f"המשתמש {app_user} קיים במערכת")
        else:
            print_error(f"המשתמש {app_user} לא נמצא!")
        
        # בדיקת הרשאות
        cursor.execute(f"SHOW GRANTS FOR '{app_user}'@'%'")
        grants = cursor.fetchall()
        print_success(f"נמצאו {len(grants)} הרשאות למשתמש")
        
        return len(tables) > 0
        
    except Error as e:
        print_error(f"שגיאה באימות ההקמה: {e}")
        return False
    finally:
        cursor.close()


def main():
    print("=" * 60)
    print("🔧 סקריפט הקמת מסד נתונים למערכת מצפן נט")
    print("=" * 60)
    
    # קבלת סיסמת root אם לא סופקה
    root_password = DB_CONFIG.get('password')
    if not root_password:
        root_password = getpass.getpass("הזן סיסמת root ל-MySQL: ")
    
    # התחברות ל-MySQL
    connection = connect_to_mysql(root_password)
    if not connection:
        return False
    
    try:
        # יצירת מסד נתונים ומשתמש
        if not create_database_and_user(
            connection, 
            TARGET_DB, 
            TARGET_USER, 
            TARGET_PASSWORD or 'Adan.3011$'
        ):
            return False
        
        # קריאת schema
        schema_content = read_schema_file()
        if not schema_content:
            return False
        
        # ביצוע schema
        if not execute_schema(connection, TARGET_DB, schema_content):
            return False
        
        # אימות
        if not verify_setup(connection, TARGET_DB, TARGET_USER):
            print_info("הערה: חלק מהאימותים נכשלו, אך ייתכן שההקמה הצליחה")
        
        print("\n" + "=" * 60)
        print_success("הקמת מסד הנתונים הושלמה בהצלחה!")
        print("=" * 60)
        print(f"\nפרטי חיבור:")
        print(f"  מסד נתונים: {TARGET_DB}")
        print(f"  משתמש: {TARGET_USER}")
        print(f"  סיסמה: {'*' * len(TARGET_PASSWORD or 'Adan.3011$')}")
        print(f"  מארח: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
        print("\n⚠️  חשוב: שנה את סיסמת המשתמש 'admin' לאחר הכניסה הראשונה!")
        
        return True
        
    finally:
        if connection.is_connected():
            connection.close()
            print_info("החיבור ל-MySQL נסגר")


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
