import sqlite3

def seed_database():
    conn = sqlite3.connect('matspanet.db')
    cursor = conn.cursor()
    
    # הוספת משתמש ראשי
    cursor.execute('''
        INSERT INTO users (username, full_name, email, password_hash, role, department, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', ('admin', 'מנהל המערכת', 'admin@matspanet.co.il', 
          'pbkdf2:sha256:260000$randomsalt$hashedpassword', 'admin', 'מטה', 1))
    
    # הוספת פתרונות למידה לדוגמה
    solutions = [
        ('פתרון מתמטיקה - כיתה ז', 'פתרון מלא לתרגילי מתמטיקה לכיתה ז', 'תוכן הפתרון...', 'published', 1),
        ('פתרון פיזיקה - כיתה ח', 'מדריך לפתרון תרגילי פיזיקה', 'תוכן הפתרון...', 'published', 1),
        ('פתרון לשון - כיתה ט', 'דרכים לשיפור כתיבה וקריאה', 'תוכן הפתרון...', 'draft', 1),
    ]
    
    cursor.executemany('''
        INSERT INTO learning_solutions (title, description, content, status, created_by)
        VALUES (?, ?, ?, ?, ?)
    ''', solutions)
    
    # הוספת בתי ספר לדוגמה
    schools = [
        ('תיכון עירוני א', 'תל אביב', 'תיכון'),
        ('חטיבת ביניים נווה צדק', 'ירושלים', 'חטיבה'),
        ('בית ספר יסודי גבעה', 'חיפה', 'יסודי'),
    ]
    
    cursor.executemany('''
        INSERT INTO lookup_schools (name, city, type)
        VALUES (?, ?, ?)
    ''', schools)
    
    conn.commit()
    conn.close()
    print("✅ נתוני דוגמה נוספו בהצלחה!")

if __name__ == "__main__":
    seed_database()
