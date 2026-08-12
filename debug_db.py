from db_connector import DatabaseManager

db = DatabaseManager()

# בדיקה 1: שליפת כל העמודות משורה אחת כדי לראות את המבנה האמיתי
query_check = "SELECT * FROM learning_solutions LIMIT 1"
try:
    result = db.fetch_one(query_check)
    if result:
        print("🔍 מבנה שורה דוגמה מהטבלה:")
        for key, value in result.items():
            # מציג רק 50 תווים הראשונים כדי לא להציף
            val_str = str(value)[:50] if value else "NULL/Empty"
            print(f"   {key}: {val_str}")
    else:
        print("⚠️ הטבלה ריקה לגמרי!")
except Exception as e:
    print(f"❌ שגיאה בבדיקה: {e}")

db.close()