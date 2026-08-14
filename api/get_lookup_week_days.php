<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// טיפול בבקשת OPTIONS (Pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// הגדרות חיבור למסד הנתונים
$host = 'localhost';
$db   = 'ejpisgaorg_matspanet_main'; // שם מסד הנתונים שלך
$user = 'root';      // משתמש ברירת מחדל של XAMPP
$pass = '';          // סיסמה ריקה ברירת מחדל של XAMPP
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

$tableName = 'lookup_week_days';
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // --- קריאת נתונים ---
        // סידור לפי ID אם אין עמודת מיון ייעודית, או לפי code אם קיים
        $stmt = $pdo->query("SELECT * FROM $tableName ORDER BY id ASC");
        $data = $stmt->fetchAll();
        
        echo json_encode([
            'status' => 'success',
            'data' => $data,
            'count' => count($data)
        ]);

    } elseif ($method === 'POST') {
        // --- הוספת רשומה חדשה ---
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'לא נשלחו נתונים תקינים']);
            exit;
        }

        // מיפוי שדות מהטופס לשמות העמודות בטבלה
        // וידוא שהשדות תואמים למה שביקשת: ערך, תווית עברית, תווית ערבית, סדר, פעיל
        $name_he = $input['name_he'] ?? $input['label_he'] ?? ''; // תומך גם ב-name_he וגם ב-label_he
        $name_ar = $input['name_ar'] ?? $input['label_ar'] ?? '';
        $code    = $input['code'] ?? $input['value'] ?? '';       // תומך ב-code או value
        $is_active = isset($input['is_active']) ? (int)$input['is_active'] : 1;
        
        // אם יש שדה sort_order נשמור אותו ב-extra_data כי אין עמודה כזו בטבלה
        $extra_data = null;
        if (isset($input['sort_order'])) {
            $extra_data = json_encode(['sort_order' => $input['sort_order']]);
        }

        if (empty($name_he)) {
            http_response_code(400);
            echo json_encode(['error' => 'שדה שם בעברית הוא חובה']);
            exit;
        }

        $sql = "INSERT INTO $tableName (name_he, name_ar, code, is_active, extra_data) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        $stmt->execute([
            $name_he,
            $name_ar,
            $code,
            $is_active,
            $extra_data
        ]);

        echo json_encode([
            'status' => 'success',
            'message' => 'הרשומה נשמרה בהצלחה',
            'id' => $pdo->lastInsertId()
        ]);

    } elseif ($method === 'PUT' || $method === 'PATCH') {
        // --- עדכון רשומה קיימת ---
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? 0;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'חובה לציין ID לעדכון']);
            exit;
        }

        $name_he = $input['name_he'] ?? $input['label_he'] ?? '';
        $name_ar = $input['name_ar'] ?? $input['label_ar'] ?? '';
        $code    = $input['code'] ?? $input['value'] ?? '';
        $is_active = isset($input['is_active']) ? (int)$input['is_active'] : 1;
        
        $extra_data = null;
        if (isset($input['sort_order'])) {
            $extra_data = json_encode(['sort_order' => $input['sort_order']]);
        }

        $sql = "UPDATE $tableName SET name_he = ?, name_ar = ?, code = ?, is_active = ?, extra_data = ? WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        
        $stmt->execute([
            $name_he,
            $name_ar,
            $code,
            $is_active,
            $extra_data,
            $id
        ]);

        echo json_encode([
            'status' => 'success',
            'message' => 'הרשומה עודכנה בהצלחה'
        ]);

    } elseif ($method === 'DELETE') {
        // --- מחיקת רשומה ---
        // קריאת ה-ID מה-URL או מה-body
        parse_str(file_get_contents('php://input'), $deleteData);
        $id = $_GET['id'] ?? $deleteData['id'] ?? 0;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'חובה לציין ID למחיקה']);
            exit;
        }

        $sql = "DELETE FROM $tableName WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id]);

        echo json_encode([
            'status' => 'success',
            'message' => 'הרשומה נמחקה בהצלחה'
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['error' => 'שיטה לא נתמכת']);
    }

} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'שגיאה פנימית: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString() // רק לפיתוח, להסיר בפרודקשן
    ]);
}
?>