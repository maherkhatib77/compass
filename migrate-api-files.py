#!/usr/bin/env python3
"""
מיראוץ אוטומטי להעברת כל קבצי ה-API לעבודה עם config-manager.php
הסקריפט:
1. קורא כל קובץ PHP בתיקיית api/
2. מחליף את הגדרות ה-hardcoded בקריאה ל-config-manager
3. שומר את הקובץ המעודכן
"""

import os
import re
from pathlib import Path

def migrate_file(file_path):
    """מעדכן קובץ PHP יחיד"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # בדיקה אם כבר עודכן
    if 'require_once' in content and 'config-manager.php' in content:
        return False, "כבר עודכן"
    
    # הסרת הגדרות hardcoded ישנות
    patterns_to_remove = [
        r'\$host\s*=\s*["\'][^"\']+["\'];?\s*\n',
        r'\$db_name\s*=\s*["\'][^"\']+["\'];?\s*\n',
        r'\$username\s*=\s*["\'][^"\']+["\'];?\s*\n',
        r'\$password\s*=\s*["\'][^"\']+["\'];?\s*\n',
        r'\$charset\s*=\s*["\'][^"\']+["\'];?\s*\n',
    ]
    
    for pattern in patterns_to_remove:
        content = re.sub(pattern, '', content)
    
    # החלפת יצירת ה-PDO connection
    old_dsn_pattern = r'new\s+PDO\s*\(\s*["\']mysql:host=\$host;dbname=\$db_name[^"\']*["\']\s*,\s*\$username\s*,\s*\$password\s*\)'
    new_connection = '''// קבלת הגדרות חיבור מה-config manager
    $config = getDbConfig();
    $dsn = getDsn();
    
    $conn = new PDO($dsn, $config['username'], $config['password'])'''
    
    content = re.sub(old_dsn_pattern, new_connection, content)
    
    # הוספת require ו-setCorsHeaders בתחילת הקובץ אחרי <?php
    if '<?php' in content and 'require_once' not in content:
        content = content.replace(
            '<?php',
            '''<?php
/**
 * API Endpoint
 * משתמש ב-config-manager.php להגדרות גמישות בין סביבות
 */

// טעינת הגדרות תצורה מרכזיות
require_once __DIR__ . '/../config-manager.php';

// הגדרת כותרות CORS
setCorsHeaders();
'''
        )
    
    # הסרת header CORS הישן אם קיים
    content = re.sub(r'header\s*\(\s*["\']Access-Control-Allow-Origin:\s*\*["\']\s*\)\s*;?\s*\n', '', content)
    
    # שמירת הקובץ המעודכן
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True, "עודן בהצלחה"

def main():
    api_dir = Path('/workspace/api')
    migrated = 0
    skipped = 0
    
    print("🔄 מתחיל מיגרציה של קבצי API...")
    print("=" * 60)
    
    for php_file in api_dir.glob('*.php'):
        if php_file.name == 'config-manager.php':
            continue
        
        success, message = migrate_file(php_file)
        if success:
            migrated += 1
            print(f"✅ {php_file.name}: {message}")
        else:
            skipped += 1
            print(f"⏭️  {php_file.name}: {message}")
    
    print("=" * 60)
    print(f"🎉 סיכום: {migrated} קבצים עודכנו, {skipped} קבצים דולגו")
    print("\n📝 חשוב:")
    print("   - בדוק את config-manager.php והתאם את ההגדרות לסביבה הרצויה")
    print("   - שנה $environment = 'production' בעת העלאה לשרת הענן")

if __name__ == '__main__':
    main()
