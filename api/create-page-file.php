<?php
/**
 * create-page-file.php
 * 
 * Creates a physical HTML file in the pages/ directory
 * The generated page matches the site's design system:
 * - Same header/footer/structure as page.html, faq.html, team.html
 * - Loads ../css/style.css for design tokens
 * - Loads DataStore (data.js + global-ui.js) for dynamic settings
 * - Uses Arabic (ar) as default front-end language
 * 
 * Expected POST body (JSON):
 * {
 *   "filename": "teachers.html",   // Required
 *   "title": "Teachers Page",       // Required
 *   "content": "<p>HTML content</p>" // Required
 * }
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
    echo json_encode(['success' => false, 'error' => 'Origin not allowed']);
    exit;
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 🛡️ SECURITY FIX: Add security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Diagnostic: if action=diag, return environment info for debugging
$input_raw = file_get_contents('php://input');
$input = json_decode($input_raw, true);

if ($input && isset($input['action']) && $input['action'] === 'diag') {
    $pagesDir = dirname(__DIR__) . '/pages/';
    $diag = [
        'php_version' => PHP_VERSION,
        'script_path' => __FILE__,
        'base_dir' => dirname(__DIR__),
        'pages_dir' => $pagesDir,
        'pages_exists' => is_dir($pagesDir),
        'pages_writable' => is_writable($pagesDir),
        'pages_perms' => is_dir($pagesDir) ? substr(sprintf('%o', fileperms($pagesDir)), -4) : 'N/A',
        'pages_owner' => (function_exists('posix_getpwuid') && is_dir($pagesDir)) ? posix_getpwuid(fileowner($pagesDir))['name'] : (is_dir($pagesDir) ? fileowner($pagesDir) : 'N/A'),
        'current_user' => function_exists('posix_getpwuid') ? posix_getpwuid(posix_geteuid())['name'] : get_current_user(),
        'doc_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'N/A',
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'N/A'
    ];
    // Try a test write
    if (is_dir($pagesDir) && is_writable($pagesDir)) {
        $testFile = $pagesDir . '_diag_test_' . time() . '.tmp';
        $testWrite = @file_put_contents($testFile, 'test');
        $diag['test_write'] = $testWrite !== false;
        if ($testWrite !== false) @unlink($testFile);
    } else {
        $diag['test_write'] = false;
        $diag['test_write_reason'] = !is_dir($pagesDir) ? 'Directory does not exist' : 'Directory not writable';
    }
    echo json_encode(['success' => true, 'diag' => $diag]);
    exit;
}

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

// Handle delete action
$action = isset($input['action']) ? $input['action'] : 'save';

if ($action === 'delete') {
    $filename = isset($input['filename']) ? basename(trim($input['filename'])) : '';
    
    // Support both with and without .html extension
    if (!empty($filename) && substr($filename, -5) !== '.html') {
        $filename .= '.html';
    }
    
    if (empty($filename)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Filename is required']);
        exit;
    }
    
    $pagesDir = dirname(__DIR__) . '/pages/';
    $filePath = $pagesDir . $filename;
    
    if (file_exists($filePath)) {
        if (unlink($filePath)) {
            echo json_encode(['success' => true, 'message' => 'Page file deleted successfully', 'filename' => $filename]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to delete page file']);
        }
    } else {
        echo json_encode(['success' => true, 'message' => 'File did not exist', 'filename' => $filename]);
    }
    exit;
}

// Validate required fields for save
$filename = isset($input['filename']) ? trim($input['filename']) : '';
$title = isset($input['title']) ? trim($input['title']) : '';
$content = isset($input['content']) ? $input['content'] : '';

if (empty($filename)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Filename is required']);
    exit;
}

if (empty($title)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Title is required']);
    exit;
}

// Security: sanitize filename
$filename = basename($filename);
if (!preg_match('/^[a-zA-Z0-9_-]+\.html$/', $filename)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid filename. Only alphanumeric, hyphens, underscores allowed with .html extension']);
    exit;
}

// Ensure pages directory exists
$pagesDir = dirname(__DIR__) . '/pages/';
if (!is_dir($pagesDir)) {
    if (!mkdir($pagesDir, 0775, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to create pages directory. Please create it manually and set permissions to 775 (chmod 775 pages/). Path: ' . $pagesDir]);
        exit;
    }
}

// Check write permissions
if (!is_writable($pagesDir)) {
    $owner = function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($pagesDir))['name'] : 'unknown';
    $perms = substr(sprintf('%o', fileperms($pagesDir)), -4);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Pages directory is not writable. Current permissions: ' . $perms . ', Owner: ' . $owner . '. Run: chmod 775 ' . basename($pagesDir) . '/']);
    exit;
}

// ── Read site settings ──
$basePath = dirname(__DIR__);
$siteNameAr = 'بوصلة نت';
$siteNameHe = 'מצפן נט';
$siteLogo = '';
$footerTextAr = '';
$footerTextHe = '';

// Read settings.json
$settingsPath = $basePath . '/data/settings.json';
if (file_exists($settingsPath)) {
    $settings = json_decode(file_get_contents($settingsPath), true);
    if ($settings) {
        if (isset($settings['siteNameAr'])) $siteNameAr = $settings['siteNameAr'];
        if (isset($settings['siteNameHe'])) $siteNameHe = $settings['siteNameHe'];
        if (isset($settings['logoUrl'])) $siteLogo = $settings['logoUrl'];
        if (isset($settings['copyrightAr'])) $footerTextAr = $settings['copyrightAr'];
        if (isset($settings['copyrightHe'])) $footerTextHe = $settings['copyrightHe'];
    }
}

// Read homepage.json for richer settings (logo, footerText, siteName)
$homepagePath = $basePath . '/data/homepage.json';
if (file_exists($homepagePath)) {
    $homepage = json_decode(file_get_contents($homepagePath), true);
    if ($homepage) {
        if (isset($homepage['logo']) && !empty($homepage['logo'])) {
            $siteLogo = $homepage['logo'];
        }
        if (isset($homepage['siteName']['ar'])) $siteNameAr = $homepage['siteName']['ar'];
        if (isset($homepage['siteName']['he'])) $siteNameHe = $homepage['siteName']['he'];
        if (isset($homepage['footerText']['ar'])) $footerTextAr = $homepage['footerText']['ar'];
        if (isset($homepage['footerText']['he'])) $footerTextHe = $homepage['footerText']['he'];
    }
}

// Default footer fallback
if (empty($footerTextAr)) {
    $footerTextAr = $siteNameAr . ' © ' . date('Y') . ' | وزارة التربية والتعليم';
}

// Build the HTML page
$htmlContent = buildHtmlPage($filename, $title, $content, $siteNameAr, $siteNameHe, $siteLogo, $footerTextAr, $footerTextHe);

// Write the file
$filePath = $pagesDir . $filename;
$result = file_put_contents($filePath, $htmlContent);

if ($result === false) {
    $dirPerms = is_dir($pagesDir) ? substr(sprintf('%o', fileperms($pagesDir)), -4) : 'N/A';
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to write HTML file. Check that the web server user has write access to: ' . basename($pagesDir) . '/ (current perms: ' . $dirPerms . ')']);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Page file created successfully',
    'filename' => $filename,
    'filepath' => 'pages/' . $filename,
    'size' => $result
]);


/**
 * Builds an HTML page matching the site design system
 * (same structure as page.html, faq.html, team.html)
 */
function buildHtmlPage($filename, $title, $content, $siteNameAr, $siteNameHe, $siteLogo, $footerTextAr, $footerTextHe) {
    $logoHtml = '🧭';
    if (!empty($siteLogo)) {
        $logoHtml = '<img src="' . htmlspecialchars($siteLogo) . '" alt="logo">';
    }

    $html = '<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . htmlspecialchars($title) . ' — ' . htmlspecialchars($siteNameAr) . '</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800;900&family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>🧭</text></svg>">
    <link rel="stylesheet" href="../css/style.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: \'Noto Sans Arabic\', \'Tajawal\', sans-serif;
            min-height: 100vh;
            background: var(--gray-50, #f3f3f3);
            display: flex;
            flex-direction: column;
        }
        .cp-header {
            background: linear-gradient(135deg, var(--primary, #0ca7aa) 0%, var(--primary-dark, #09787a) 100%);
            padding: 0; position: sticky; top: 0; z-index: 100;
            box-shadow: 0 4px 16px rgba(0,0,0,.06);
        }
        .cp-header-inner {
            max-width: 1200px; margin: 0 auto; padding: 16px 24px;
            display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .cp-logo { display: flex; align-items: center; gap: 12px; color: #fff; text-decoration: none; }
        .cp-logo-icon { font-size: 32px; line-height: 1; overflow: hidden; width: 52px; height: 52px; border-radius: 8px; border: 3px solid rgba(255,255,255,.4); background: rgba(255,255,255,.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cp-logo-icon img { width: 100%; height: 100%; object-fit: cover; }
        .cp-logo-text { font-size: 20px; font-weight: 800; color: #fff; }
        .cp-btn-back {
            background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.3);
            color: #fff; padding: 8px 18px; border-radius: 20px; font-size: 14px;
            font-weight: 600; cursor: pointer; transition: all .2s;
            font-family: \'Noto Sans Arabic\', \'Tajawal\', sans-serif;
            text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
        }
        .cp-btn-back:hover { background: rgba(255,255,255,.3); }
        .cp-hero { max-width: 1200px; width: 100%; margin: 0 auto; padding: 32px 24px 8px; text-align: center; }
        .cp-hero-title { font-size: 28px; font-weight: 800; color: var(--gray-700, #24343f); margin-bottom: 6px; }
        .cp-content {
            flex: 1; max-width: 900px; width: 100%; margin: 0 auto; padding: 28px 24px 40px;
        }
        .cp-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
        .cp-content table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        .cp-content td, .cp-content th { border: 1px solid var(--gray-200, #e5e5e5); padding: 10px 14px; text-align: right; }
        .cp-content th { background: var(--gray-50, #f7f7f7); font-weight: 700; }
        .cp-content a { color: var(--primary, #0ca7aa); text-decoration: underline; }
        .cp-content h1, .cp-content h2, .cp-content h3 { margin: 24px 0 12px; color: var(--gray-700, #24343f); line-height: 1.4; }
        .cp-content h1 { font-size: 26px; }
        .cp-content h2 { font-size: 22px; }
        .cp-content h3 { font-size: 18px; }
        .cp-content p { margin-bottom: 12px; line-height: 1.9; }
        .cp-content ul, .cp-content ol { margin: 12px 0; padding-right: 24px; }
        .cp-content li { margin-bottom: 6px; line-height: 1.8; }
        .cp-content blockquote { border-right: 4px solid var(--primary, #0ca7aa); padding: 12px 20px; margin: 16px 0; background: #e9f6fb; border-radius: 0 8px 8px 0; color: var(--gray-600, #4c6373); }
        .cp-content strong { font-weight: 700; }
        .cp-content em { font-style: italic; }
        .cp-footer {
            text-align: center; padding: 18px; color: var(--gray-300, #999999); font-size: 12px;
            border-top: 1px solid var(--gray-100, #f2f2f2); background: rgba(255,255,255,.7); flex-shrink: 0;
        }
        @media (max-width: 768px) {
            .cp-header-inner { flex-wrap: wrap; }
            .cp-hero { padding: 24px 16px 4px; }
            .cp-hero-title { font-size: 24px; }
            .cp-content { padding: 22px 16px 32px; }
            .cp-logo-icon { width: 44px; height: 44px; font-size: 24px; }
        }
    </style>
</head>
<body>
    <header class="cp-header">
        <div class="cp-header-inner">
            <a class="cp-logo" href="../index.html">
                <span class="cp-logo-icon" id="globalHeaderLogo">' . $logoHtml . '</span>
                <div class="cp-logo-text" id="globalHeaderName">' . htmlspecialchars($siteNameAr) . '</div>
            </a>
            <a href="../index.html" class="cp-btn-back">→ ' . ('الرئيسية') . '</a>
        </div>
    </header>
    <main class="cp-content" id="pageContent">
        ' . $content . '
    </main>
    <footer class="cp-footer" id="globalFooterText">
        ' . htmlspecialchars($footerTextAr) . '
    </footer>
    <script src="../js/data.js?v=4.10.0"></script>
    <script src="../js/global-ui.js?v=1.0.0"></script>
    <script>
        function initPage() {
            var hp = DataStore.getHomepage();
            // Update header logo
            if (hp && hp.logo) {
                var logoEl = document.getElementById(\'globalHeaderLogo\');
                if (logoEl) logoEl.innerHTML = \'<img src="\' + hp.logo + \'" alt="logo">\';
            }
            // Update header site name
            if (hp && hp.siteName) {
                var nameEl = document.getElementById(\'globalHeaderName\');
                if (nameEl) nameEl.textContent = hp.siteName.ar || hp.siteName.he || \'\';
            }
            // Update footer
            if (hp && hp.footerText) {
                var footerEl = document.getElementById(\'globalFooterText\');
                if (footerEl) footerEl.innerHTML = hp.footerText.ar || hp.footerText.he || footerEl.innerHTML;
            }
            if (typeof GlobalUI !== \'undefined\') GlobalUI.apply(\'ar\');
        }
        if (DataStore.init && typeof DataStore.init === \'function\') {
            var _t = setTimeout(initPage, 5000);
            DataStore.init().then(function() { clearTimeout(_t); initPage(); }).catch(function() { clearTimeout(_t); initPage(); });
        } else {
            initPage();
        }
    </script>
</body>
</html>';

    return $html;
}
?>