<?php
/**
 * API Endpoint
 * משתמש ב-config-manager.php להגדרות גמישות בין סביבות
 */

// טעינת הגדרות תצורה מרכזיות
require_once __DIR__ . '/../config-manager.php';

// הגדרת כותרות CORS
setCorsHeaders();

// api/solutions.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

try {
    // קבלת הגדרות חיבור מה-config manager
    $config = getDbConfig();
    $dsn = getDsn();
    
    $conn = new PDO($dsn, $config['username'], $config['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "שגיאת חיבור למסד הנתונים: " . $e->getMessage()]);
    exit();
}

try {
    // שליפת כל הפתרונות מהטבלה SOLUTIONS
    // ניתן להוסיף ORDER BY או WHERE במידת הצורך בעתיד
    $stmt = $conn->query("SELECT * FROM SOLUTIONS ORDER BY id ASC");
    
    $solutions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // החזרת הנתונים כ-JSON
    echo json_encode($solutions);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "שגיאה בשליפת נתונים: " . $e->getMessage()]);
}
?>