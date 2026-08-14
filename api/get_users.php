<?php
/**
 * API: שליפת משתמשים
 * משתמש בקובץ config-manager.php להגדרות גמישות
 */

// טעינת הגדרות תצורה מרכזיות
require_once __DIR__ . '/../config-manager.php';

// הגדרת כותרות CORS
setCorsHeaders();

header("Content-Type: application/json; charset=UTF-8");

try {
    // קבלת הגדרות חיבור מה-config manager
    $config = getDbConfig();
    $dsn = getDsn();
    
    $conn = new PDO($dsn, $config['username'], $config['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // שליפת כל המשתמשים מהטבלה users
    // שימו לב: אנו בוחרים במפורש את השדות ולא מחזירים את password_hash מטעמי אבטחה
    $sql = "SELECT id, username, full_name, email, role, department, phone, is_active, last_login, created_at, updated_at FROM users ORDER BY id ASC";
    
    $stmt = $conn->query($sql);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($results);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "שגיאת מסד נתונים",
        "message" => $e->getMessage(),
        "sql_state" => $e->getCode()
    ]);
}
?>
