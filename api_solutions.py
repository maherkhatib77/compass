import json
from db_connector import DatabaseManager  # ודא שהשם תואם בדיוק

def get_all_solutions():
    """
    שולף את כל פתרונות הלמידה ממסד הנתונים.
    מחזיר רשימת מילונים (JSON-like).
    """
    db = DatabaseManager()
    
    query = """
        SELECT 
            id, title_he, title_ar, description, category, status, 
            start_date, end_date, total_hours, location, max_participants
        FROM learning_solutions
        ORDER BY created_at DESC
    """
    
    try:
        solutions = db.fetch_all(query)
        return solutions
    except Exception as e:
        print(f"❌ שגיאה בשליפת פתרונות: {e}")
        return []
    finally:
        db.close()

def get_solution_by_id(solution_id):
    """
    שולף פתרון למידה ספציפי לפי ID.
    """
    db = DatabaseManager()
    
    query = """
        SELECT * FROM learning_solutions WHERE id = %s
    """
    
    try:
        solution = db.fetch_one(query, (solution_id,))
        return solution
    except Exception as e:
        print(f"❌ שגיאה בשליפת פתרון #{solution_id}: {e}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 בודק את ה-API החדש מול מסד הנתונים...")
    
    # בדיקה 1: שליפת כל הפתרונות
    print("\n📋 שליפת רשימת כל הפתרונות:")
    all_solutions = get_all_solutions()
    
    if all_solutions:
        print(f"✅ נמצאו {len(all_solutions)} פתרונות.")
        # הצגת הדוגמה הראשונה
        first = all_solutions[0]
        print(f"   דוגמה (ID {first['id']}): {first['title_he']}")
    else:
        print("⚠️ לא נמצאו פתרונות.")

    # בדיקה 2: שליפת פתרון בודד (נסה את ה-ID הראשון שמצאנו)
    if all_solutions:
        test_id = all_solutions[0]['id']
        print(f"\n🔍 שליפת פרטי פתרון בודד (ID: {test_id}):")
        single = get_solution_by_id(test_id)
        
        if single:
            print(f"✅ שם: {single['title_he']}")
            print(f"   סטטוס: {single['status']}")
            print(f"   שעות: {single['total_hours']}")
        else:
            print("❌ לא נמצא פתרון עם ID זה.")

    print("\n🎉 בדיקת API הסתיימה בהצלחה!")