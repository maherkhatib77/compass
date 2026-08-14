<?php
/**
 * API Endpoint
 * משתמש ב-config-manager.php להגדרות גמישות בין סביבות
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
    
    // שליפת כל המפקחים מהטבלה inspectors
    $stmt = $conn->query("SELECT * FROM inspectors ORDER BY id ASC");
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