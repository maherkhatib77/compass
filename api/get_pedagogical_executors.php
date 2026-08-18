<?php
/**
* API Endpoint - מבצעים פדגוגיים
* משתמש ב-config-manager.php להגדרות גמישות בין סביבות
* מוסיף מיפוי שמות מ-snake_case ל-camelCase עבור התאמה ל-Frontend
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

    // שליפת כל המבצעים הפדגוגיים מהטבלה pedagogical_executors
    $stmt = $conn->query("SELECT * FROM pedagogical_executors ORDER BY id ASC");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // ✅ מיפוי שמות מ-snake_case ל-camelCase עבור התאמה ל-Frontend
    $mapped = array_map(function($row) {
        return [
            'id'              => $row['id'],
            'companyNumber'   => $row['company_number'] ?? '',
            'institutionName' => $row['institution_name'] ?? '',
            'groupName'       => $row['group_name'] ?? '',
            'hourlyCost'      => $row['hourly_cost'] ?? null,
            'notes'           => $row['notes'] ?? ''
        ];
    }, $results);
    
    echo json_encode($mapped);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "שגיאת מסד נתונים",
        "message" => $e->getMessage(),
        "sql_state" => $e->getCode()
    ]);
}
?>