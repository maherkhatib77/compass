<?php
// api/manage_values.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// הגדרות DB
$host = 'localhost';
$db   = 'ejpisgaorg_matspanet_main'; // שם מסד הנתונים שלך
$user = 'root';       // משתמש ברירת מחדל של XAMPP
$pass = '';           // סיסמה ריקה ב-XAMPP
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'שגיאת חיבור למסד הנתונים: ' . $e->getMessage()]);
    exit;
}

// קבלת פרמטרים
$action = $_GET['action'] ?? '';
$table_map = [
    'supervisors' => 'supervisors',
    'executives' => 'pedagogical_executives',
    'solution_types' => 'solution_types',
    'regions' => 'regions'
];

$table = $_GET['table'] ?? '';

if (!array_key_exists($table, $table_map)) {
    http_response_code(400);
    echo json_encode(['error' => 'שם טבלה לא חוקי']);
    exit;
}

$real_table = $table_map[$table];

// --- טיפול בבקשות ---

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // קריאת נתונים
    try {
        $stmt = $pdo->query("SELECT * FROM $real_table ORDER BY id DESC");
        $data = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $data, 'count' => count($data)]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // הוספת נתון חדש
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'לא נשלחו נתונים']);
        exit;
    }

    // סינון שדות ריקים ובניית שאילתה דינמית בטוחה
    // הערה: לצורך הפשטות, אנו מניחים שהמשתמש שולח את השמות точно כמו במסד
    // בשלב מתקדם יותר נבצע ולידציה קשוחה יותר לכל טבלה.
    
    $fields = array_keys($input);
    $placeholders = array_fill(0, count($fields), '?');
    
    // הסרת שדות שלא אמורים להישמר ידנית (כמו id, created_at)
    $allowed_fields = array_diff($fields, ['id', 'created_at']);
    $final_fields = [];
    $values = [];
    
    foreach($allowed_fields as $f) {
        $final_fields[] = $f;
        $values[] = $input[$f];
    }

    if (empty($final_fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'אין שדות תקינים להוספה']);
        exit;
    }

    $sql = "INSERT INTO $real_table (" . implode(',', $final_fields) . ") VALUES (" . implode(',', $placeholders) . ")";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        echo json_encode(['status' => 'success', 'message' => 'נשמר בהצלחה', 'id' => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'שגיאה בשמירה: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'שיטה לא נתמכת']);
}
?>