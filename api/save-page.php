<?php
/**
 * save-page.php – Create/update an HTML file in /pages/ directory
 * Receives: { "filename": "about-us", "titleHe": "...", "titleAr": "...", "content": "<p>...</p>" }
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

header('Access-Control-Allow-Methods: POST, OPTIONS, DELETE');
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

if (!$input || !isset($input['filename']) || !isset($input['content'])) {
    http_response_code(400);
    echo json_encode(['error' => 'נתונים לא תקינים'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Security: only allow safe filenames
$filename = basename($input['filename']);
if (!preg_match('/^[a-z0-9][a-z0-9-]*[a-z0-9]$/', $filename) && $filename !== preg_replace('/[^a-z0-9-]/', '', $filename)) {
    $filename = preg_replace('/[^a-z0-9-]/', '', $filename);
}
if (empty($filename)) {
    http_response_code(400);
    echo json_encode(['error' => 'שם קובץ לא תקין'], JSON_UNESCAPED_UNICODE);
    exit;
}

$titleHe = isset($input['titleHe']) ? $input['titleHe'] : '';
$titleAr = isset($input['titleAr']) ? $input['titleAr'] : '';
$content = $input['content'];
$action = isset($input['action']) ? $input['action'] : 'save'; // save or delete

// Pages directory
$pagesDir = dirname(__DIR__) . '/pages';
if (!is_dir($pagesDir)) {
    if (!mkdir($pagesDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'שגיאה ביצירת תיקיית pages'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if ($action === 'delete') {
    $targetPath = $pagesDir . '/' . $filename . '.html';
    if (file_exists($targetPath)) {
        unlink($targetPath);
    }
    echo json_encode(['success' => true, 'deleted' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

// Generate HTML file
$htmlContent = '<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . htmlspecialchars($titleHe || $titleAr || $filename) . '</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&family=Tajawal:wght@200;300;400;500;700;800&family=Noto+Sans+Hebrew:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧭</text></svg>">
    <link rel="stylesheet" href="./css/style.css">
    <style>
        .cp-header { background: linear-gradient(135deg, var(--primary, #0ca7aa) 0%, var(--primary-dark, #09787a) 100%); padding: 0; position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 16px rgba(0,0,0,.06); }
        .cp-header-inner { max-width: 1200px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .cp-logo { display: flex; align-items: center; gap: 12px; color: #fff; text-decoration: none; }
        .cp-logo-icon { font-size: 32px; line-height: 1; }
        .cp-logo-text { font-size: 20px; font-weight: 800; color: #fff; }
        .cp-btn-back { background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.3); color: #fff; padding: 8px 18px; border-radius: 20px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
        .cp-btn-back:hover { background: rgba(255,255,255,.3); }
        .cp-hero { max-width: 1200px; width: 100%; margin: 0 auto; padding: 32px 24px 8px; text-align: center; }
        .cp-hero-title { font-size: 28px; font-weight: 800; color: var(--gray-700, #24343f); margin-bottom: 6px; }
        .cp-hero-sub { font-size: 15px; color: var(--gray-400, #777); font-weight: 500; }
        .cp-content { flex: 1; max-width: 900px; width: 100%; margin: 0 auto; padding: 28px 24px 40px; }
        .cp-content img { max-width: 100%; height: auto; border-radius: 8px; }
        .cp-content table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        .cp-content td, .cp-content th { border: 1px solid var(--gray-200, #e5e5e5); padding: 10px 14px; text-align: right; }
        .cp-content th { background: var(--gray-50, #f7f7f7); font-weight: 700; }
        .cp-content a { color: var(--primary, #0ca7aa); text-decoration: underline; }
        .cp-content h1, .cp-content h2, .cp-content h3 { margin: 24px 0 12px; color: var(--gray-700, #24343f); line-height: 1.4; }
        .cp-content h1 { font-size: 26px; } .cp-content h2 { font-size: 22px; } .cp-content h3 { font-size: 18px; }
        .cp-content p { margin-bottom: 12px; line-height: 1.9; }
        .cp-content ul, .cp-content ol { margin: 12px 0; padding-right: 24px; }
        .cp-content li { margin-bottom: 6px; line-height: 1.8; }
        .cp-footer { text-align: center; padding: 18px; color: var(--gray-300, #999); font-size: 12px; border-top: 1px solid var(--gray-100, #f2f2f2); background: rgba(255,255,255,.7); flex-shrink: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Noto Sans Arabic", "Tajawal", "Noto Sans Hebrew", sans-serif; min-height: 100vh; background: var(--gray-50, #f3f3f3); display: flex; flex-direction: column; }
        @media (max-width: 768px) { .cp-header-inner { flex-wrap: wrap; } .cp-hero { padding: 24px 16px 4px; } .cp-hero-title { font-size: 24px; } .cp-content { padding: 22px 16px 32px; } }
    </style>
</head>
<body>
    <header class="cp-header">
        <div class="cp-header-inner">
            <a class="cp-logo" href="./index.html">
                <span class="cp-logo-icon">🧭</span>
                <div class="cp-logo-text">' . htmlspecialchars($titleAr || 'מצפן נט') . '</div>
            </a>
            <a href="./index.html" class="cp-btn-back">→ ' . ($titleAr ? 'الرئيسية' : 'ראשי') . '</a>
        </div>
    </header>
    <section class="cp-hero">
        <h1 class="cp-hero-title">' . htmlspecialchars($titleHe || $titleAr || '') . '</h1>
        ' . ($titleAr && $titleHe ? '<p class="cp-hero-sub">' . htmlspecialchars($titleAr) . '</p>' : '') . '
    </section>
    <main class="cp-content">' . $content . '</main>
    <footer class="cp-footer">מצפן נט © ' . date('Y') . '</footer>
</body>
</html>';

$targetPath = $pagesDir . '/' . $filename . '.html';
$result = file_put_contents($targetPath, $htmlContent);

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'שגיאה בשמירת הקובץ – ייתכן בעיה בהרשאות'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['success' => true, 'file' => $filename . '.html'], JSON_UNESCAPED_UNICODE);
