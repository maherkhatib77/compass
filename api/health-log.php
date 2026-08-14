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
 * health-log.php – יומן שגיאות ותיקון הרשאות ל-cPanel/Apache/PHP
 * מטפל ב-GET/POST /api/health-log
 */

header('Content-Type: application/json; charset=utf-8');

// 🛡️ SECURITY FIX: Restrict CORS to specific allowed origins
$allowedOrigins = [
    'http://localhost',
    'http://127.0.0.1',
    'https://your-production-domain.com' // TODO: Replace with actual production domain
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    http_response_code(403);
    echo json_encode(['error' => 'Origin not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 🛡️ SECURITY FIX: Add security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$dataDir = dirname(__DIR__) . '/data';
$errorLogPath = $dataDir . '/error_log.txt';

// GET: Read last 10 entries
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($errorLogPath)) {
        echo json_encode(['entries' => [], 'message' => 'אין שגיאות מתועדות', 'messageAr' => 'لا توجد أخطاء مسجلة'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $content = @file_get_contents($errorLogPath);
    $lines = array_filter(explode("\n", trim($content)), function($l) { return trim($l) !== ''; });
    $last10 = array_slice($lines, -10);
    echo json_encode(['entries' => $last10, 'total' => count($lines)], JSON_UNESCAPED_UNICODE);
    exit;
}

// POST: Clear log or fix permissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    // Clear error log
    if ($action === 'clear') {
        if (file_exists($errorLogPath)) @unlink($errorLogPath);
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Fix permissions
    if ($action === 'fix_perms') {
        $fixed = [];
        $failed = [];
        $ownershipWarning = null;

        // Fix data directory
        if (@chmod($dataDir, 0755)) {
            $fixed[] = 'data/ → 755';
        } else {
            $failed[] = 'data/: chmod failed';
        }

        // Fix JSON files
        $files = @glob($dataDir . '/*.{json,txt}', GLOB_BRACE);
        if ($files !== false) {
            foreach ($files as $f) {
                $fname = basename($f);
                if (@chmod($f, 0664)) {
                    $fixed[] = $fname . ' → 664';
                } else {
                    $failed[] = $fname . ': chmod failed';
                }
            }
        }

        // Check ownership mismatch
        $existingFiles = @glob($dataDir . '/*.json');
        if (!empty($existingFiles)) {
            $existingStat = @stat($existingFiles[0]);
            $testPath = $dataDir . '/_ownership_fix_check.tmp';
            $testWrite = @file_put_contents($testPath, 'test');
            if ($testWrite !== false) {
                $newStat = @stat($testPath);
                @unlink($testPath);
                if ($newStat && $existingStat && $newStat['uid'] !== $existingStat['uid']) {
                    $newName = function_exists('posix_getpwuid') ? (posix_getpwuid($newStat['uid'])['name'] ?? 'uid:' . $newStat['uid']) : 'uid:' . $newStat['uid'];
                    $existingName = function_exists('posix_getpwuid') ? (posix_getpwuid($existingStat['uid'])['name'] ?? 'uid:' . $existingStat['uid']) : 'uid:' . $existingStat['uid'];
                    $ownershipWarning = 'מתבצעת כתיבה תחת משתמש ' . $newName . ' (UID ' . $newStat['uid'] . ') לעומת ' . $existingName . ' (UID ' . $existingStat['uid'] . '). ייתכן שהבעיה היא בעלות (Ownership) ולא בהרשאות בלבד. יש לתקן זאת דרך cPanel > מנהל קבצים > שנה בעלות (Change Owner) למשתמש החשבון שלכם. לאחר מכן: תיקיות 755, קבצים 644/664. לא להשתמש ב-777 – ב-cPanel פעולה זו עלולה לחסום את האתר.';
                }
            }
        }

        echo json_encode([
            'success' => empty($failed) && $ownershipWarning === null,
            'fixed' => $fixed,
            'failed' => $failed,
            'ownershipWarning' => $ownershipWarning
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'פעולה לא מוכרת'], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
