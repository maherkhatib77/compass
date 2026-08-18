<?php
/**
* API Endpoint — institutions (בתי ספר / מוסדות)
* משתמש ב-config-manager.php להגדרות גמישות בין סביבות
*/
require_once __DIR__ . '/../config-manager.php';
setCorsHeaders();
header("Content-Type: application/json; charset=UTF-8");
try {
    $config = getDbConfig();
    $dsn = getDsn();
    $conn = new PDO($dsn, $config['username'], $config['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // הטבלה במסד נקראת lookup_schools
    $stmt = $conn->query("SELECT * FROM lookup_schools ORDER BY id ASC");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($results);
} catch(PDOException $e) {
    // אם הטבלה לא קיימת — החזר מערך ריק
    if (strpos($e->getMessage(), 'doesn\'t exist') !== false || 
        strpos($e->getMessage(), '1146') !== false) {
        echo json_encode([]);
    } else {
        http_response_code(500);
        echo json_encode([
            "error" => "שגיאת מסד נתונים",
            "message" => $e->getMessage(),
            "sql_state" => $e->getCode()
        ]);
    }
}
?>