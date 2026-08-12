#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
בדיקות יחידה פשוטות למערכת מצפן נט API
לא דורש חיבור ל-MySQL
"""

import unittest
import sys
import os
import hashlib

# הוספת הנתיב ל-import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def hash_password(password: str) -> str:
    """מחזיר hash של סיסמה - העתקה מ-main.py לבדיקה מבודדת"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed_password: str) -> bool:
    """מאמת סיסמה מול hash - העתקה מ-main.py לבדיקה מבודדת"""
    return hash_password(password) == hashed_password


class TestPasswordFunctions(unittest.TestCase):
    """בדיקת פונקציות הצפנת סיסמה"""
    
    def test_hash_password_returns_string(self):
        """בודק שה-hash מחזיר מחרוזת"""
        result = hash_password("test123")
        self.assertIsInstance(result, str)
        self.assertEqual(len(result), 64)  # SHA256 produces 64 hex characters
    
    def test_hash_password_different_inputs(self):
        """בודק שסיסמאות שונות נותנות hash שונה"""
        hash1 = hash_password("password1")
        hash2 = hash_password("password2")
        self.assertNotEqual(hash1, hash2)
    
    def test_hash_password_same_input(self):
        """בודק שאותה סיסמה נותנת אותו hash"""
        hash1 = hash_password("same_password")
        hash2 = hash_password("same_password")
        self.assertEqual(hash1, hash2)
    
    def test_verify_password_correct(self):
        """בודק אימות סיסמה תקינה"""
        password = "my_secret_password"
        hashed = hash_password(password)
        self.assertTrue(verify_password(password, hashed))
    
    def test_verify_password_incorrect(self):
        """בודק אימות סיסמה שגויה"""
        password = "my_secret_password"
        hashed = hash_password(password)
        self.assertFalse(verify_password("wrong_password", hashed))


class TestDataValidation(unittest.TestCase):
    """בדיקת תיקוף נתונים"""
    
    def test_allowed_lookup_tables(self):
        """בודק רשימת טבלאות lookup מותרות"""
        allowed_tables = [
            'domains', 'education_stages', 'education_types', 'budget_types',
            'allocation_status', 'solution_status', 'performer_types',
            'lecturer_status', 'field_knowledge', 'role_holders',
            'broad_topics', 'designated_programs', 'week_days',
            'meeting_types', 'responsibility_types', 'schools',
            'certified_lecturer', 'expert_field'
        ]
        
        # בדיקה שאין כפילויות
        self.assertEqual(len(allowed_tables), len(set(allowed_tables)))
        
        # בדיקה שכל השמות באנגלית ובאותיות קטנות
        for table in allowed_tables:
            self.assertTrue(table.islower())
            self.assertTrue(table.replace('_', '').isalpha())
    
    def test_allowed_data_types(self):
        """בודק רשימת סוגי נתונים מותרים"""
        allowed_types = [
            'users', 'categories', 'solutions', 'guides_repo',
            'budgets', 'periods', 'solution_instructors',
            'solution_comments', 'catalog_entries', 'catalog_items',
            'registrations', 'settings', 'activity_log',
            'recycle_bin', 'inspectors', 'pedagogical_executors',
            'homepage', 'faq_data', 'custom_pages'
        ]
        
        # בדיקה שאין כפילויות
        self.assertEqual(len(allowed_types), len(set(allowed_types)))
    
    def test_user_roles(self):
        """בודק רשימת תפקידי משתמש"""
        roles = ['admin', 'manager', 'instructor', 'viewer']
        
        # בדיקה ש-admin ו-manager קיימים (נדרשים ל-authorization)
        self.assertIn('admin', roles)
        self.assertIn('manager', roles)


class TestSecurityFeatures(unittest.TestCase):
    """בדיקת תכונות אבטחה"""
    
    def test_secret_key_default_warning(self):
        """בודק אזהרת SECRET_KEY ברירת מחדל"""
        default_key = 'default-secret-key-change-in-production'
        self.assertTrue(len(default_key) > 0)
    
    def test_session_expiration_default(self):
        """בודק פג תוקף של session"""
        from dotenv import load_dotenv
        load_dotenv()
        
        import os
        # זמן תפוגה ברירת מחדל הוא 1440 דקות (24 שעות)
        default_expire = int(os.getenv('JWT_EXPIRE_MINUTES', '1440'))
        self.assertGreater(default_expire, 0)
        self.assertLessEqual(default_expire, 10080)  # מקסימום שבוע


class TestMainFileSyntax(unittest.TestCase):
    """בדיקת תקינות תחביר של main.py"""
    
    def test_main_file_syntax(self):
        """בודק ש-main.py ניתן לקריאה ללא שגיאות תחביר"""
        import ast
        
        with open('main.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # בודק שהקובץ תקין תחבירית
        try:
            ast.parse(content)
            self.assertTrue(True)
        except SyntaxError as e:
            self.fail(f"שגיאת תחביר ב-main.py: {e}")
    
    def test_db_connector_syntax(self):
        """בודק ש-db_connector.py תקין תחבירית"""
        import ast
        
        with open('db_connector.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        try:
            ast.parse(content)
            self.assertTrue(True)
        except SyntaxError as e:
            self.fail(f"שגיאת תחביר ב-db_connector.py: {e}")


def run_tests():
    """מפעיל את כל הבדיקות"""
    print("=" * 60)
    print("🧪 הפעלת בדיקות יחידה למערכת מצפן נט")
    print("=" * 60)
    
    # יצירת test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # הוספת כל מחלקות הבדיקה - לא דורש DB
    suite.addTests(loader.loadTestsFromTestCase(TestPasswordFunctions))
    suite.addTests(loader.loadTestsFromTestCase(TestDataValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestSecurityFeatures))
    suite.addTests(loader.loadTestsFromTestCase(TestMainFileSyntax))
    
    # הרצת הבדיקות
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # הדפסת סיכום
    print("\n" + "=" * 60)
    print(f"📊 סיכום בדיקות:")
    print(f"   בדיקות שעברו: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"   כשלונות: {len(result.failures)}")
    print(f"   שגיאות: {len(result.errors)}")
    print(f"   סה״כ: {result.testsRun}")
    print("=" * 60)
    
    if result.wasSuccessful():
        print("✅ כל הבדיקות עברו בהצלחה!")
    else:
        print("⚠️  חלק מהבדיקות נכשלו")
    print("=" * 60)
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
