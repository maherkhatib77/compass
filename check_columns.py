import mysql.connector

DB_CONFIG = {
    'host': '10.0.0.4',
    'user': 'ejpisgaorg_matspanet_app',
    'password': 'Adan.3011$',
    'database': 'ejpisgaorg_matspanet_main'
}

try:
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # בודק את המבנה של הטבלה 'users'
    cursor.execute("DESCRIBE users")
    columns = cursor.fetchall()
    
    print("📋 עמודות בטבלת 'users':")
    for col in columns:
        print(f"  - {col[0]} (סוג: {col[1]})")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ שגיאה: {e}")