<?php
/**
* API Endpoint - מפקחים (inspectors)
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

    // שליפת כל המפקחים מהטבלה inspectors
    $stmt = $conn->query("SELECT * FROM inspectors ORDER BY id ASC");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // ✅ מיפוי שמות מ-snake_case ל-camelCase עבור התאמה ל-Frontend
    $mapped = array_map(function($row) {
        // המרת school_ids ממחרוזת JSON למערך
        $schoolIds = [];
        if (!empty($row['school_ids'])) {
            $decoded = is_string($row['school_ids']) 
                ? json_decode($row['school_ids'], true) 
                : $row['school_ids'];
            if (is_array($decoded)) {
                $schoolIds = $decoded;
            }
        }
        
        return [
            'id'        => $row['id'],
            'fullName'  => $row['full_name'] ?? '',
            'phone'     => $row['phone'] ?? '',
            'email'     => $row['email'] ?? '',
            'district'  => $row['district'] ?? '',
            'schoolIds' => $schoolIds,
            // שמירה על השדות המקוריים לתאימות
            'full_name' => $row['full_name'] ?? '',
            'school_ids'=> $row['school_ids'] ?? null
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