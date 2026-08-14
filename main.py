from fastapi import FastAPI, HTTPException, Depends, status, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import uvicorn
from db_connector import DatabaseManager
import os
from dotenv import load_dotenv
import hashlib
import secrets
from datetime import datetime, timedelta

# טעינת הגדרות מהסביבה
load_dotenv()

# אתחול האפליקציה
app = FastAPI(title="Matspanet API", description="API למערכת מצפן נט")

# הגדרת CORS לאישור בקשות מהדפדפן (חשוב לפיתוח מקומי)
cors_origins = os.getenv('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins != ['*'] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# הגדרת תיקיית קבצים סטטיים
app.mount("/static", StaticFiles(directory="."), name="static")
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/data", StaticFiles(directory="data"), name="data")
# הערה: לא להשתמש ב-StaticFiles עבור /api כדי לאפשר ל-FastAPI לטפל בקבצי PHP באופן דינמי
# app.mount("/api", StaticFiles(directory="api"), name="api")

# אתחול מסד הנתונים
db = DatabaseManager()

# הגדרות אבטחה
SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key-change-in-production')
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """מחזיר hash של סיסמה"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed_password: str) -> bool:
    """מאמת סיסמה מול hash"""
    return hash_password(password) == hashed_password


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """מאמת משתמש מתוך token"""
    if not credentials:
        return None
    
    token = credentials.credentials
    
    # כאן ניתן להוסיף אימות JWT אמיתי
    # כרגע בדיקה בסיסית מול הטבלה sessions
    try:
        query = "SELECT s.user_id, u.username, u.role, u.is_active FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW() AND s.is_valid = 1"
        result = db.fetch_one(query, (token,))
        if result and result['is_active']:
            return result
        return None
    except Exception:
        return None


def require_auth(user: dict = Depends(get_current_user)):
    """בודק שהמשתמש מאומת"""
    if not user:
        raise HTTPException(status_code=401, detail="נדרשת הרשאה")
    return user


def require_role(required_roles: List[str]):
    """בודק שלמשתמש יש תפקיד מתאים"""
    async def role_checker(user: dict = Depends(require_auth)):
        if user['role'] not in required_roles:
            raise HTTPException(status_code=403, detail="אין לך הרשאה לבצע פעולה זו")
        return user
    return role_checker


@app.get("/")
def read_root():
    return FileResponse("index.html")


@app.get("/api/get_solutions.php")
def get_solutions_php():
    """מחזיר פתרונות למידה - תואם ל-get_solutions.php"""
    try:
        query = "SELECT * FROM learning_solutions ORDER BY id DESC"
        results = db.fetch_all(query)
        
        # המרת datetime ל-string
        processed_results = []
        for row in results:
            processed_row = {}
            for key, value in row.items():
                if hasattr(value, 'strftime'):
                    processed_row[key] = value.strftime('%Y-%m-%d %H:%M:%S')
                else:
                    processed_row[key] = value
            processed_results.append(processed_row)
        
        return JSONResponse(content=processed_results, media_type="application/json; charset=UTF-8")
    except Exception as e:
        # החזרת מערך ריק אם אין DB
        print(f"⚠️ שגיאה בשליפת פתרונות: {e}")
        return JSONResponse(content=[], media_type="application/json; charset=UTF-8")


@app.get("/api/{file_path:path}")
def serve_api_file(file_path: str):
    """מגיש קבצי PHP מהתיקייה api/"""
    file_location = os.path.join("api", file_path)
    if os.path.isfile(file_location) and file_path.endswith('.php'):
        # קריאת הקובץ והחזרת התוכן שלו
        with open(file_location, "r", encoding="utf-8") as f:
            content = f.read()
        return JSONResponse(content={"raw": content}, media_type="text/plain")
    raise HTTPException(status_code=404, detail="קובץ לא נמצא")


@app.get("/dashboard.html")
def read_dashboard():
    return FileResponse("dashboard.html")


@app.get("/api/health")
def health_check():
    """בודק תקינות המערכת"""
    try:
        db.fetch_all("SELECT 1")
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@app.post("/api/auth/login")
def login(username: str = Form(...), password: str = Form(...)):
    """מבצע התחברות ומחזיר token"""
    try:
        query = "SELECT id, username, password_hash, role, is_active FROM users WHERE username = %s"
        user = db.fetch_one(query, (username,))
        
        if not user or not user['is_active']:
            raise HTTPException(status_code=401, detail="שם משתמש או סיסמה שגויים")
        
        if not verify_password(password, user['password_hash']):
            # עדכון ניסיונות כושלים
            db.execute("UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE username = %s", (username,))
            raise HTTPException(status_code=401, detail="שם משתמש או סיסמה שגויים")
        
        # יצירת token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(minutes=int(os.getenv('JWT_EXPIRE_MINUTES', 1440)))
        
        # שמירת session
        session_query = "INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (%s, %s, %s, %s)"
        db.execute(session_query, (token, user['id'], hash_password(token), expires_at))
        
        # איפוס ניסיונות כושלים ועדכון כניסה אחרונה
        db.execute("UPDATE users SET failed_login_attempts = 0, last_login = NOW() WHERE id = %s", (user['id'],))
        
        return {
            "token": token,
            "expires_at": expires_at.isoformat(),
            "user": {
                "id": user['id'],
                "username": user['username'],
                "role": user['role']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/logout")
def logout(user: dict = Depends(require_auth), token: HTTPAuthorizationCredentials = Depends(security)):
    """מבצע התנתקות"""
    try:
        token_value = token.credentials
        db.execute("UPDATE sessions SET is_valid = 0 WHERE id = %s", (token_value,))
        return {"message": "התנתקת בהצלחה"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/me")
def get_current_user_info(user: dict = Depends(require_auth)):
    """מחזיר פרטי משתמש נוכחי"""
    try:
        query = "SELECT id, username, full_name, email, role, department, is_active, created_at FROM users WHERE id = %s"
        user_data = db.fetch_one(query, (user['user_id'],))
        
        if user_data:
            for key, value in user_data.items():
                if hasattr(value, 'strftime'):
                    user_data[key] = value.strftime('%Y-%m-%d %H:%M:%S')
        
        return user_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/solutions")
def get_all_solutions(status_filter: Optional[str] = None):
    """שולף את כל פתרונות הלמידה, עם אפשרות סינון לפי סטטוס"""
    try:
        if status_filter:
            query = "SELECT * FROM learning_solutions WHERE status = %s ORDER BY created_at DESC"
            results = db.fetch_all(query, (status_filter,))
        else:
            query = "SELECT * FROM learning_solutions ORDER BY created_at DESC"
            results = db.fetch_all(query)
        
        return {"count": len(results), "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/solutions/{solution_id}")
def get_solution(solution_id: int):
    """שולף פתרון למידה ספציפי לפי ID"""
    try:
        query = "SELECT * FROM learning_solutions WHERE id = %s"
        result = db.fetch_one(query, (solution_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="פתרון לא נמצא")
                
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/solutions")
def create_solution(solution_data: dict, user: dict = Depends(require_role(['admin', 'manager']))):
    """יוצר פתרון למידה חדש"""
    try:
        query = """INSERT INTO learning_solutions 
                   (title_he, description_he, category, status, created_by) 
                   VALUES (%s, %s, %s, %s, %s)"""
        
        solution_id = db.execute(query, (
            solution_data.get('title_he'),
            solution_data.get('description_he'),
            solution_data.get('category'),
            solution_data.get('status', 'draft'),
            user['user_id']
        ))
        
        return {"id": solution_id, "message": "הפתרון נוצר בהצלחה"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/solutions/{solution_id}")
def update_solution(solution_id: int, solution_data: dict, user: dict = Depends(require_role(['admin', 'manager']))):
    """מעדכן פתרון למידה קיים"""
    try:
        query = """UPDATE learning_solutions 
                   SET title_he = %s, description_he = %s, category = %s, status = %s, updated_at = NOW()
                   WHERE id = %s"""
        
        db.execute(query, (
            solution_data.get('title_he'),
            solution_data.get('description_he'),
            solution_data.get('category'),
            solution_data.get('status'),
            solution_id
        ))
        
        return {"message": "הפתרון עודכן בהצלחה"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/solutions/{solution_id}")
def delete_solution(solution_id: int, user: dict = Depends(require_role(['admin']))):
    """מוחק פתרון למידה"""
    try:
        query = "DELETE FROM learning_solutions WHERE id = %s"
        db.execute(query, (solution_id,))
        return {"message": "הפתרון נמחק בהצלחה"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users")
def get_all_users(user: dict = Depends(require_role(['admin', 'manager']))):
    """שולף את כל המשתמשים (ללא סיסמאות!)"""
    try:
        query = "SELECT id, username, full_name, email, role, department, is_active, created_at FROM users"
        results = db.fetch_all(query)
        return {"count": len(results), "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/{user_id}")
def get_user(user_id: int, current_user: dict = Depends(require_auth)):
    """שולף משתמש ספציפי לפי ID"""
    try:
        query = "SELECT id, username, full_name, email, role, department, is_active, created_at FROM users WHERE id = %s"
        result = db.fetch_one(query, (user_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="משתמש לא נמצא")
                
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users")
def create_user(user_data: dict, current_user: dict = Depends(require_role(['admin']))):
    """יוצר משתמש חדש"""
    try:
        query = """INSERT INTO users 
                   (username, password_hash, full_name, email, role, department, is_active) 
                   VALUES (%s, %s, %s, %s, %s, %s, 1)"""
        
        password_hash = hash_password(user_data.get('password', 'default_password'))
        
        db.execute(query, (
            user_data.get('username'),
            password_hash,
            user_data.get('full_name'),
            user_data.get('email'),
            user_data.get('role', 'viewer'),
            user_data.get('department')
        ))
        
        return {"message": "המשתמש נוצר בהצלחה"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/users/{user_id}")
def update_user(user_id: int, user_data: dict, current_user: dict = Depends(require_role(['admin']))):
    """מעדכן משתמש קיים"""
    try:
        if 'password' in user_data:
            password_hash = hash_password(user_data['password'])
            query = """UPDATE users 
                       SET full_name = %s, email = %s, role = %s, department = %s, password_hash = %s, updated_at = NOW()
                       WHERE id = %s"""
            db.execute(query, (
                user_data.get('full_name'),
                user_data.get('email'),
                user_data.get('role'),
                user_data.get('department'),
                password_hash,
                user_id
            ))
        else:
            query = """UPDATE users 
                       SET full_name = %s, email = %s, role = %s, department = %s, updated_at = NOW()
                       WHERE id = %s"""
            db.execute(query, (
                user_data.get('full_name'),
                user_data.get('email'),
                user_data.get('role'),
                user_data.get('department'),
                user_id
            ))
        
        return {"message": "המשתמש עודכן בהצלחה"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, current_user: dict = Depends(require_role(['admin']))):
    """מוחק משתמש"""
    try:
        query = "DELETE FROM users WHERE id = %s"
        db.execute(query, (user_id,))
        return {"message": "המשתמש נמחק בהצלחה"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/registrations")
def get_registrations(solution_id: Optional[int] = None, user: dict = Depends(require_auth)):
    """שולף רישומים להשתלמויות"""
    try:
        if solution_id:
            query = """SELECT r.*, u.full_name, u.email, ls.title_he 
                       FROM registrations r 
                       JOIN users u ON r.user_id = u.id 
                       JOIN learning_solutions ls ON r.solution_id = ls.id 
                       WHERE r.solution_id = %s"""
            results = db.fetch_all(query, (solution_id,))
        else:
            query = """SELECT r.*, u.full_name, u.email, ls.title_he 
                       FROM registrations r 
                       JOIN users u ON r.user_id = u.id 
                       JOIN learning_solutions ls ON r.solution_id = ls.id"""
            results = db.fetch_all(query)
        
        return {"count": len(results), "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/registrations")
def create_registration(registration_data: dict, user: dict = Depends(require_auth)):
    """יוצר רישום חדש להשתלמות"""
    try:
        query = """INSERT INTO registrations 
                   (solution_id, user_id, registration_source, attendance_status) 
                   VALUES (%s, %s, 'web', 'registered')"""
        
        db.execute(query, (
            registration_data.get('solution_id'),
            user['user_id']
        ))
        
        return {"message": "הרישום נוצר בהצלחה"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/budgets")
def get_budgets(solution_id: Optional[int] = None, user: dict = Depends(require_role(['admin', 'manager']))):
    """שולף נתוני תקציב"""
    try:
        if solution_id:
            query = "SELECT * FROM budgets WHERE solution_id = %s"
            results = db.fetch_all(query, (solution_id,))
        else:
            query = "SELECT * FROM budgets"
            results = db.fetch_all(query)
        
        return {"count": len(results), "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Lookup Tables Endpoints - טבלאות עזר
# ============================================

@app.get("/api/lookup/{table_name}")
def get_lookup_table(table_name: str):
    """שולף טבלת עזר לפי שם"""
    allowed_tables = [
        'domains', 'education_stages', 'education_types', 'budget_types',
        'allocation_status', 'solution_status', 'performer_types',
        'lecturer_status', 'field_knowledge', 'role_holders',
        'broad_topics', 'designated_programs', 'week_days',
        'meeting_types', 'responsibility_types', 'schools',
        'certified_lecturer', 'expert_field'
    ]
    
    # מיפוי שמות לטבלאות אמיתיות
    table_mapping = {
        'domains': 'lookup_domains',
        'education_stages': 'lookup_education_stages',
        'education_types': 'lookup_education_types',
        'budget_types': 'lookup_budget_types',
        'allocation_status': 'lookup_allocation_status',
        'solution_status': 'lookup_solution_status',
        'performer_types': 'lookup_performer_types',
        'lecturer_status': 'lookup_lecturer_status',
        'field_knowledge': 'lookup_field_knowledge',
        'role_holders': 'lookup_role_holders',
        'broad_topics': 'lookup_broad_topics',
        'designated_programs': 'lookup_designated_programs',
        'week_days': 'lookup_week_days',
        'meeting_types': 'lookup_meeting_types',
        'responsibility_types': 'lookup_responsibility_types',
        'schools': 'lookup_schools',
        'certified_lecturer': 'lookup_certified_lecturer',
        'expert_field': 'lookup_expert_field'
    }
    
    if table_name not in allowed_tables:
        raise HTTPException(status_code=404, detail=f"טבלת עזר '{table_name}' לא נמצאה")
    
    actual_table = table_mapping[table_name]
    
    try:
        query = f"SELECT * FROM `{actual_table}` ORDER BY id ASC"
        results = db.fetch_all(query)
        return {"count": len(results), "data": results}
    except Exception as e:
        # אם הטבלה לא קיימת, מחזירים מערך ריק
        if "doesn't exist" in str(e):
            return {"count": 0, "data": [], "note": "הטבלה טרם הוגדרה במסד הנתונים"}
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Additional Data Endpoints - נתונים נוספים
# ============================================

@app.get("/api/data/{data_type}")
def get_data(data_type: str):
    """שולף סוגי נתונים שונים מהמערכת"""
    allowed_types = [
        'users', 'categories', 'solutions', 'guides_repo',
        'budgets', 'periods', 'solution_instructors',
        'solution_comments', 'catalog_entries', 'catalog_items',
        'registrations', 'settings', 'activity_log',
        'recycle_bin', 'inspectors', 'pedagogical_executors',
        'homepage', 'faq_data', 'custom_pages'
    ]
    
    if data_type not in allowed_types:
        raise HTTPException(status_code=404, detail=f"סוג נתונים '{data_type}' לא נמצא")
    
    # מיפוי סוגי נתונים לטבלאות
    type_to_table = {
        'users': 'users',
        'categories': 'learning_solutions',  # או טבלת קטגוריות ייעודית אם קיימת
        'solutions': 'learning_solutions',
        'guides_repo': 'instructors',
        'budgets': 'budgets',
        'periods': 'system_settings',  # או טבלת זמנים ייעודית
        'solution_instructors': 'instructors',
        'solution_comments': 'audit_logs',  # או טבלת הערות ייעודית
        'catalog_entries': 'file_uploads',
        'catalog_items': 'file_uploads',
        'registrations': 'registrations',
        'settings': 'system_settings',
        'activity_log': 'audit_logs',
        'recycle_bin': 'audit_logs',  # או טבלת אשפה ייעודית
        'inspectors': 'users',  # משתמשים עם תפקיד inspector
        'pedagogical_executors': 'users',  # משתמשים עם תפקיד executor
        'homepage': 'system_settings',
        'faq_data': 'system_settings',
        'custom_pages': 'system_settings'
    }
    
    table = type_to_table[data_type]
    
    try:
        # שאילתות מיוחדות לסוגים מסוימים
        if data_type == 'categories':
            query = "SELECT DISTINCT category FROM learning_solutions WHERE category IS NOT NULL"
            results = db.fetch_all(query)
            return {"count": len(results), "data": results}
        elif data_type == 'solutions':
            query = "SELECT * FROM learning_solutions ORDER BY created_at DESC"
            results = db.fetch_all(query)
        elif data_type == 'inspectors':
            query = "SELECT * FROM users WHERE role = 'inspector'"
            results = db.fetch_all(query)
        elif data_type == 'pedagogical_executors':
            query = "SELECT * FROM users WHERE role = 'executor'"
            results = db.fetch_all(query)
        elif data_type == 'users':
            query = "SELECT id, username, full_name, email, role, department, is_active, created_at FROM users ORDER BY created_at DESC"
            results = db.fetch_all(query)
        else:
            query = f"SELECT * FROM `{table}` ORDER BY created_at DESC" if table != 'system_settings' else f"SELECT * FROM `{table}`"
            results = db.fetch_all(query)
        
        return {"count": len(results), "data": results}
    except Exception as e:
        if "doesn't exist" in str(e):
            return {"count": 0, "data": [], "note": "הטבלה טרם הוגדרה במסד הנתונים"}
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Data Save Endpoint - שמירת נתונים
# ============================================

@app.post("/api/data-save")
async def save_data(request: Request, user: dict = Depends(require_auth)):
    """שומר נתונים שנשלחים מהלקוח"""
    try:
        import json
        
        body = await request.json()
        
        # קבלת פרטי הטבלה והנתונים מהבקשה
        table_name = body.get('table')
        data = body.get('data')
        action = body.get('action', 'insert')  # insert, update, delete
        
        if not table_name or not data:
            raise HTTPException(status_code=400, detail="נדרשים פרמטרים 'table' ו-'data'")
        
        # רשימת טבלאות מותרות לשמירה
        allowed_tables = [
            'users', 'learning_solutions', 'registrations', 'budgets',
            'instructors', 'audit_logs', 'file_uploads', 'system_settings',
            'categories', 'periods', 'catalog_entries', 'catalog_items',
            'faq_data', 'guides_repo', 'homepage_settings', 'custom_pages',
            'solution_comments', 'solution_instructors', 'pedagogical_executors',
            'inspectors', 'mentors', 'activity_logs', 'recycle_bin', 'lookup_schools'
        ]
        
        if table_name not in allowed_tables:
            raise HTTPException(status_code=403, detail=f"אין הרשאה לשמור לטבלה '{table_name}'")
        
        # בדיקת הרשאות לפי טבלה
        if table_name == 'users' and user['role'] != 'admin':
            raise HTTPException(status_code=403, detail="רק מנהל יכול לנהל משתמשים")
        
        if action == 'insert':
            # בניית שאילתת INSERT דינמית
            columns = list(data.keys())
            values = list(data.values())
            columns_str = ', '.join([f"`{col}`" for col in columns])
            placeholders = ', '.join(['%s'] * len(columns))
            
            query = f"INSERT INTO `{table_name}` ({columns_str}) VALUES ({placeholders})"
            db.execute(query, tuple(values))
            
            return {
                "success": True,
                "message": "הנתונים נשמרו בהצלחה",
                "action": "insert",
                "table": table_name,
                "timestamp": datetime.now().isoformat()
            }
        
        elif action == 'update':
            # בניית שאילתת UPDATE דינמית
            record_id = data.get('id')
            if not record_id:
                raise HTTPException(status_code=400, detail="נדרש שדה 'id' לעדכון")
            
            # הסרת id מהנתונים לעדכון
            update_data = {k: v for k, v in data.items() if k != 'id'}
            columns = list(update_data.keys())
            values = list(update_data.values())
            
            set_clause = ', '.join([f"`{col}` = %s" for col in columns])
            query = f"UPDATE `{table_name}` SET {set_clause}, updated_at = NOW() WHERE id = %s"
            db.execute(query, tuple(values + [record_id]))
            
            return {
                "success": True,
                "message": "הנתונים עודכנו בהצלחה",
                "action": "update",
                "table": table_name,
                "id": record_id,
                "timestamp": datetime.now().isoformat()
            }
        
        elif action == 'delete':
            record_id = data.get('id')
            if not record_id:
                raise HTTPException(status_code=400, detail="נדרש שדה 'id' למחיקה")
            
            query = f"DELETE FROM `{table_name}` WHERE id = %s"
            db.execute(query, (record_id,))
            
            return {
                "success": True,
                "message": "הרשומה נמחקה בהצלחה",
                "action": "delete",
                "table": table_name,
                "id": record_id,
                "timestamp": datetime.now().isoformat()
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"פעולה '{action}' לא נתמכת")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Dashboard & Analytics Endpoints
# ============================================

@app.get("/api/dashboard/summary")
def get_dashboard_summary(user: dict = Depends(require_auth)):
    """מחזיר סיכום נתונים לדשבורד"""
    try:
        # סטטיסטיקות בסיסיות
        solutions_count = db.fetch_one("SELECT COUNT(*) as count FROM learning_solutions")
        users_count = db.fetch_one("SELECT COUNT(*) as count FROM users WHERE is_active = 1")
        registrations_count = db.fetch_one("SELECT COUNT(*) as count FROM registrations")
        budgets_total = db.fetch_one("SELECT SUM(allocated_amount) as total FROM budgets")
        
        return {
            "total_solutions": solutions_count['count'] if solutions_count else 0,
            "active_users": users_count['count'] if users_count else 0,
            "total_registrations": registrations_count['count'] if registrations_count else 0,
            "total_budget": float(budgets_total['total']) if budgets_total and budgets_total['total'] else 0,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reports/activity")
def get_activity_report(days: int = 30, user: dict = Depends(require_role(['admin', 'manager']))):
    """מחזיר דוח פעילות לתקופה נתונה"""
    try:
        query = """
        SELECT 
            DATE(created_at) as date,
            action_type,
            COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
        GROUP BY DATE(created_at), action_type
        ORDER BY date DESC, action_type
        """
        results = db.fetch_all(query, (days,))
        return {"count": len(results), "data": results, "period_days": days}
    except Exception as e:
        if "doesn't exist" in str(e):
            return {"count": 0, "data": [], "note": "טבלת audit_logs טרם הוגדרה"}
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print("🚀 מפעיל את שרת ה-API...")
    print(f"📍 כתובת מקומית: http://127.0.0.1:{os.getenv('API_PORT', 8000)}")
    print(f"📍 תיעוד אוטומטי (Swagger): http://127.0.0.1:{os.getenv('API_PORT', 8000)}/docs")
    uvicorn.run(app, host=os.getenv('API_HOST', '0.0.0.0'), port=int(os.getenv('API_PORT', 8000)))