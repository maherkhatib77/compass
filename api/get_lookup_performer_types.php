<?php
/**
* API Endpoint - סוגי מבצע (lookup_performer_types)
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

    // שליפת סוגי המבצע מהטבלה lookup_performer_types
    $stmt = $conn->query("SELECT * FROM lookup_performer_types ORDER BY id ASC");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // ✅ מיפוי שמות מ-snake_case ל-camelCase עבור התאמה ל-Frontend
    $mapped = array_map(function($row) {
        // חילוץ order מתוך extra_data (JSON)
        $order = null;
        if (!empty($row['extra_data'])) {
            $extraData = is_string($row['extra_data']) 
                ? json_decode($row['extra_data'], true) 
                : $row['extra_data'];
            if ($extraData && isset($extraData['sort_order'])) {
                $order = $extraData['sort_order'];
            } elseif ($extraData && isset($extraData['order'])) {
                $order = $extraData['order'];
            }
        }
        
        return [
            'id'        => $row['id'],
            'value'     => $row['code'] ?? '',
            'label'     => $row['name_he'] ?? '',
            'labelHe'   => $row['name_he'] ?? '',
            'labelAr'   => $row['name_ar'] ?? '',
            'order'     => $order,
            'isActive'  => isset($row['is_active']) ? (bool)$row['is_active'] : true,
            // שמירה על השדות המקוריים לתאימות
            'code'      => $row['code'] ?? '',
            'name_he'   => $row['name_he'] ?? '',
            'name_ar'   => $row['name_ar'] ?? '',
            'extra_data'=> $row['extra_data'] ?? null,
            'is_active' => $row['is_active'] ?? 1
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