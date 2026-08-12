#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
סקריפט אימות מקיף למערכת מצפן נט
בודק את כל רכיבי המערכת ומציג דוח מסודר
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
import sys

# טעינת הגדרות סביבה
load_dotenv()

# הגדרות חיבור ל-MySQL
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'ejpisgaorg_matspanet_app'),
    'password': os.getenv('DB_PASS', 'Adan.3011$')
}
DB_NAME = os.getenv('DB_NAME', 'ejpisgaorg_matspanet_main')

def print_section(title):
    """מדפיס כותרת סקציה"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_warning(message):
    print(f"⚠️  {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def test_database_connection():
    """בודק חיבור למסד הנתונים"""
    print_section("1️⃣  בדיקת חיבור למסד הנתונים")
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG, database=DB_NAME)
        if connection.is_connected():
            print_success("חיבור למסד הנתונים הוקם בהצלחה")
            
            # קבלת גרסת MySQL
            cursor = connection.cursor()
            cursor.execute("SELECT VERSION();")
            version = cursor.fetchone()
            print_info(f"גרסת MySQL: {version[0]}")
            
            # קבלת שם מסד הנתונים
            cursor.execute("SELECT DATABASE();")
            db_name = cursor.fetchone()
            print_info(f"שם מסד הנתונים: {db_name[0]}")
            
            cursor.close()
            connection.close()
            return True
        else:
            print_error("נכשל בחיבור למסד הנתונים")
            return False
            
    except Error as e:
        print_error(f"שגיאה בחיבור למסד הנתונים: {e}")
        return False

def check_admin_user():
    """בודק קיום משתמש admin"""
    print_section("2️⃣  בדיקת משתמש Admin")
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG, database=DB_NAME)
        cursor = connection.cursor(dictionary=True)
        
        # בדיקת קיום משתמש admin
        cursor.execute("""
            SELECT id, username, role, full_name, email, is_active, created_at 
            FROM users 
            WHERE username = 'admin' OR role = 'admin'
        """)
        
        admins = cursor.fetchall()
        
        if admins:
            print_success(f"נמצאו {len(admins)} משתמשי admin")
            for admin in admins:
                print_info(f"  - ID: {admin['id']}, שם: {admin['full_name']}, " +
                          f"אימייל: {admin['email']}, פעיל: {'כן' if admin['is_active'] else 'לא'}")
        else:
            print_warning("לא נמצא משתמש admin במערכת")
            print_info("מומלץ ליצור משתמש admin התחלתי")
        
        cursor.close()
        connection.close()
        return len(admins) > 0
        
    except Error as e:
        print_error(f"שגיאה בבדיקת משתמש admin: {e}")
        return False

def get_database_statistics():
    """אוסף סטטיסטיקות ממסד הנתונים"""
    print_section("3️⃣  סטטיסטיקות מסד נתונים")
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG, database=DB_NAME)
        cursor = connection.cursor(dictionary=True)
        
        # רשימת טבלאות לספירה
        tables = {
            'users': 'משתמשים',
            'learning_solutions': 'פתרונות למידה',
            'instructors': 'מדריכים',
            'registrations': 'הרשמות',
            'notifications': 'התראות',
            'budgets': 'תקציבים',
            'sessions': 'סשנים',
            'system_settings': 'הגדרות מערכת'
        }
        
        stats = {}
        for table, name_he in tables.items():
            try:
                cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                result = cursor.fetchone()
                stats[table] = result['count'] if result else 0
                print_info(f"{name_he}: {stats[table]}")
            except Error:
                stats[table] = 0
                print_warning(f"הטבלה {name_he} לא נגישה")
        
        cursor.close()
        connection.close()
        
        return stats
        
    except Error as e:
        print_error(f"שגיאה באיסוף סטטיסטיקות: {e}")
        return {}

def check_system_settings():
    """בודק הגדרות מערכת קריטיות"""
    print_section("4️⃣  בדיקת הגדרות מערכת")
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG, database=DB_NAME)
        cursor = connection.cursor(dictionary=True)
        
        # בדיקת הגדרות קריטיות
        critical_settings = [
            'system_name_he',
            'max_login_attempts',
            'session_timeout_minutes',
            'lockout_duration_minutes'
        ]
        
        placeholders = ','.join(['%s'] * len(critical_settings))
        query = f"""
            SELECT setting_key, setting_value 
            FROM system_settings 
            WHERE setting_key IN ({placeholders})
        """
        
        cursor.execute(query, critical_settings)
        
        settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
        
        if len(settings) == len(critical_settings):
            print_success("כל הגדרות המערכת הקריטיות קיימות")
            for key, value in settings.items():
                print_info(f"  {key}: {value}")
        else:
            missing = set(critical_settings) - set(settings.keys())
            print_warning(f"חסרות הגדרות: {missing}")
        
        cursor.close()
        connection.close()
        
        return len(settings) == len(critical_settings)
        
    except Error as e:
        print_error(f"שגיאה בבדיקת הגדרות מערכת: {e}")
        return False

def verify_table_structure():
    """מוודא שמבנה הטבלאות תקין"""
    print_section("5️⃣  בדיקת מבנה טבלאות")
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG, database=DB_NAME)
        cursor = connection.cursor()
        
        cursor.execute("SHOW TABLES;")
        tables = [row[0] for row in cursor.fetchall()]
        
        print_success(f"נמצאו {len(tables)} טבלאות במסד הנתונים")
        
        # בדיקת טבלאות קריטיות
        critical_tables = ['users', 'learning_solutions', 'system_settings']
        missing_tables = [t for t in critical_tables if t not in tables]
        
        if not missing_tables:
            print_success("כל הטבלאות הקריטיות קיימות")
        else:
            print_error(f"חסרות טבלאות קריטיות: {missing_tables}")
        
        cursor.close()
        connection.close()
        
        return len(missing_tables) == 0
        
    except Error as e:
        print_error(f"שגיאה בבדיקת מבנה טבלאות: {e}")
        return False

def run_full_verification():
    """מריץ את כל הבדיקות ומציג סיכום"""
    print("\n")
    print("╔" + "═"*68 + "╗")
    print("║" + " "*20 + "סקריפט אימות מערכת מצפן נט" + " "*19 + "║")
    print("╚" + "═"*68 + "╝")
    
    results = {}
    
    # הרצת כל הבדיקות
    results['db_connection'] = test_database_connection()
    results['admin_user'] = check_admin_user()
    results['db_stats'] = get_database_statistics()
    results['system_settings'] = check_system_settings()
    results['table_structure'] = verify_table_structure()
    
    # הצגת סיכום
    print_section("📊 סיכום בדיקות")
    
    passed = sum(1 for v in [results['db_connection'], results['admin_user'], 
                             results['system_settings'], results['table_structure']] if v)
    total = 4
    
    print(f"בדיקות שעברו: {passed}/{total}")
    
    if passed == total:
        print_success("✅ כל הבדיקות עברו בהצלחה! המערכת מוכנה לשימוש.")
        return True
    elif passed >= total - 1:
        print_warning("⚠️  רוב הבדיקות עברו, אך יש לבדוק אזהרות.")
        return True
    else:
        print_error("❌ נכשלו מספר בדיקות. יש לבדוק את הלוג למעלה.")
        return False

if __name__ == "__main__":
    success = run_full_verification()
    sys.exit(0 if success else 1)
