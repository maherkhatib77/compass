<?php
/**
 * API Endpoint
 * משתמש ב-config-manager.php להגדרות גמישות בין סביבות
 */

// טעינת הגדרות תצורה מרכזיות
require_once __DIR__ . '/../config-manager.php';

// הגדרת כותרות CORS
setCorsHeaders();

/**
* data-save.php – שמירת נתוני JSON לשרת cPanel/Apache
* גרסה מעודכנת: מאפשר כתיבה לכל קובץ .json (לאחר basename),
* כך שקבצים חדשים לא ייחסמו עוד עם "שם קובץ לא מורשה".
* מטפל ב-POST /api/data-save
* מקבל: { "filename": "users.json", "data": [...] }
*/
header('Content-Type: application/json; charset=utf-8');

// 🛡️ SECURITY FIX: Restrict CORS to specific allowed origins in production
// In development, allow localhost for testing
$allowedOrigins = [
    'http://localhost',
    'http://127.0.0.1',
    'https://your-production-domain.com' // TODO: Replace with actual production domain
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Block requests from unauthorized origins
    http_response_code(403);
    echo json_encode(['error' => 'Origin not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 🛡️ SECURITY FIX: Add security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!$input || !isset($input['filename']) || !isset($input['data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'נתונים לא תקינים'], JSON_UNESCAPED_UNICODE);
    exit;
}

// === בדיקת אבטחה: basename בלבד (חוסם ניסיונות ../) ===
$filename = basename($input['filename']);
$data = $input['data'];

// === הכלל החדש והגמיש: כל קובץ .json מותר ===
// basename כבר מונע כתיבה מחוץ לתיקיית data, ולכן אין צורך ברשימה קשיחה
// ש"שוכחת" קבצים חדשים וגורמת לשגיאת 400.
if (!preg_match('/\.json$/i', $filename)) {
    http_response_code(400);
    echo json_encode(['error' => 'סוג קובץ לא מורשה – חייב להסתיים ב-.json'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!is_array($data) && !is_object($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'נתונים לא תקינים – חייב להיות מערך'], JSON_UNESCAPED_UNICODE);
    exit;
}

// api/data-save.php נמצא ב-public_html/api/, הנתונים ב-public_html/data/
$dataDir = dirname(__DIR__) . '/data';
if (!is_dir($dataDir)) {
    http_response_code(500);
    echo json_encode(['error' => 'תיקיית data/ לא נמצאה'], JSON_UNESCAPED_UNICODE);
    exit;
}

$targetPath = $dataDir . '/' . $filename;
$jsonContent = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

$result = file_put_contents($targetPath, $jsonContent);

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'שגיאה בשמירת הקובץ – ייתכן בעיה בהרשאות או בבעלות'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
