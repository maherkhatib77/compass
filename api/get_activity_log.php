<?php
/**
 * API Endpoint
 * משתמש ב-config-manager.php להגדרות גמישות בין סביבות
 */

// טעינת הגדרות תצורה מרכזיות
require_once __DIR__ . '/../config-manager.php';

// הגדרת כותרות CORS
setCorsHeaders();

// הפעלת הצגת שגיאות לצורך איתור תקלות (יש להסיר בסביבת ייצור)
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=UTF-8");

try {
    // קבלת הגדרות חיבור מה-config manager
    $config = getDbConfig();
    $dsn = getDsn();
    
    $conn = new PDO($dsn, $config['username'], $config['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // שליפת כל רשומות היומן מהטבלה activity_log
    // סדר מיון לפי ID יורד כדי לראות את הפעולות האחרונות ראשונות
    $stmt = $conn->query("SELECT * FROM activity_logs ORDER BY id DESC");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // אם אין נתונים, נדפיס הודעה ברורה בתוך ה-JSON
    if (empty($results)) {
        echo json_encode([
            "status" => "success",
            "message" => "הטבלה ריקה",
            "data" => []
        ]);
    } else {
        echo json_encode($results);
    }
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "שגיאת מסד נתונים",
        "message" => $e->getMessage(),
        "sql_state" => $e->getCode()
    ]);
}
?>