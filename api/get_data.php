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

// קבלת שם הטבלה מהפרמטר GET
$table = isset($_GET['table']) ? $_GET['table'] : '';

// רשימת טבלאות מותרות (אבטחה: מונע גישה לטבלאות לא מורשות)
$allowed_tables = [
    'users', 'categories', 'learning_solutions', 'solution_instructors', 
    'inspectors', 'budgets', 'periods', 'registrations', 'system_settings',
    'faq_data', 'activity_log', 'catalog_entries', 'catalog_items',
    'solution_comments', 'mentors', 'pedagogical_executors'
    // ניתן להוסיף כאן עוד טבלאות לפי הצורך
];

if (empty($table) || !in_array($table, $allowed_tables)) {
    http_response_code(400);
    echo json_encode(["error" => "שם טבלה לא חוקי או חסר"]);
    exit();
}

try {
    // קבלת הגדרות חיבור מה-config manager
    $config = getDbConfig();
    $dsn = getDsn();
    
    $conn = new PDO($dsn, $config['username'], $config['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // שימוש ב-backticks למניעת שגיאות עם שמות טבלאות
    $stmt = $conn->query("SELECT * FROM `$table` ORDER BY id ASC");
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