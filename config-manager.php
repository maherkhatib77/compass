<?php
/**
 * Config Manager - קובץ הגדרות מרכזי למערכת
 * 
 * קובץ זה מאפשר מעבר קל בין סביבות פיתוח ופרודקשן
 * על ידי שינוי משתנה אחד בלבד.
 * 
 * הוראות שימוש:
 * 1. בסביבת פיתוח (XAMPP מקומי): השאירו $environment = 'local';
 * 2. בסביבת פרודקשן (שרת ענן): שנו ל-$environment = 'production';
 * 3. כל קבצי ה-API ישתמשו בהגדרות המתאימות אוטומטית
 */

// ============================================================================
// ⚙️ הגדרת סביבה - שנו כאן בלבד!
// ============================================================================
$environment = 'local';  // אפשרויות: 'local' או 'production'

// ============================================================================
// 🏠 סביבת פיתוח מקומית (XAMPP)
// ============================================================================
$config_local = [
    'host' => 'localhost',
    'db_name' => 'ejpisgaorg_matspanet_main',
    'username' => 'root',
    'password' => '',  // ברירת מחדל של XAMPP - ריקה
    'charset' => 'utf8mb4',
    'cors_origins' => ['http://localhost', 'http://127.0.0.1']
];

// ============================================================================
// ☁️ סביבת פרודקשן (שרת ענן)
// ============================================================================
$config_production = [
    'host' => 'ejpisga.org',
    'db_name' => 'ejpisgaorg_matspanet_main',
    'username' => 'ejpisgaorg_matspanet_app',
    'password' => 'Adan.3011$',
    'charset' => 'utf8mb4',
    'cors_origins' => ['https://matspanet.ejpisga.org', 'https://www.matspanet.ejpisga.org']
];

// ============================================================================
// 🎯 בחירת ההגדרות לפי הסביבה
// ============================================================================
if ($environment === 'production') {
    $config = $config_production;
} else {
    $config = $config_local;
}

// ============================================================================
// 📤 פונקציה לקבלת הגדרות חיבור למסד נתונים
// ============================================================================
function getDbConfig() {
    global $config;
    return $config;
}

// ============================================================================
// 📤 פונקציה לקבלת DSN לחיבור PDO
// ============================================================================
function getDsn() {
    global $config;
    return "mysql:host={$config['host']};dbname={$config['db_name']};charset={$config['charset']}";
}

// ============================================================================
// 📤 פונקציה לקבלת הגדרות CORS
// ============================================================================
function getCorsOrigins() {
    global $config;
    return $config['cors_origins'];
}

// ============================================================================
// 🔒 פונקציה להגדרת כותרות CORS
// ============================================================================
function setCorsHeaders() {
    $allowed_origins = getCorsOrigins();
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    } elseif ($origin === '' || strpos($origin, 'localhost') !== false) {
        // הרשה ל-localhost בפיתוח
        header("Access-Control-Allow-Origin: *");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");
    
    // טיפול בבקשות preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
?>