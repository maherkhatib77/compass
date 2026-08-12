<?php
/**
 * health-check.php – בדיקות תקינות שרת ל-cPanel/Apache/PHP
 * מטפל ב-POST /api/health-check
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

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 🛡️ SECURITY FIX: Add security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$dataDir = dirname(__DIR__) . '/data';
$errorLogPath = $dataDir . '/error_log.txt';
$results = [];
$allPassed = true;

// Helper: write to error log
function writeErrorLog($path, $entry) {
    $ts = gmdate('Y-m-d\TH:i:s') . 'Z';
    @file_put_contents($path, "[$ts] $entry\n", FILE_APPEND | LOCK_EX);
}

// Check A: Write permission on data directory
$testWritePath = $dataDir . '/test_write.tmp';
$writeOk = @file_put_contents($testWritePath, 'health-check-test');
if ($writeOk !== false) {
    @unlink($testWritePath);
    $results[] = ['id' => 'write_perms', 'label' => 'הרשאות כתיבה לתיקיית נתונים', 'labelAr' => 'صلاحيات الكتابة لمجلد البيانات', 'status' => 'ok', 'detail' => 'קיימת הרשאת כתיבה בתיקיית data/ – תקין', 'detailAr' => 'صلاحية الكتابة متوفرة في مجلد data/ – سليم'];
} else {
    $allPassed = false;
    $hint = 'יש לעדכן הרשאות תיקיית data/ ל-755';
    $results[] = ['id' => 'write_perms', 'label' => 'הרשאות כתיבה לתיקיית נתונים', 'labelAr' => 'صلاحيات الكتابة لمجلد البيانات', 'status' => 'fail', 'detail' => 'כשל בכתיבת קובץ טסט. ' . $hint, 'detailAr' => 'فشل في كتابة ملف اختبار. ' . $hint];
    writeErrorLog($errorLogPath, 'WRITE_PERM_CHECK: file_put_contents failed');
}

// Check B: Read + write-back on settings.json
$testJsonFile = 'settings.json';
$testJsonPath = $dataDir . '/' . $testJsonFile;
if (file_exists($testJsonPath)) {
    $origContent = @file_get_contents($testJsonPath);
    if ($origContent !== false && @file_put_contents($testJsonPath, $origContent) !== false) {
        $results[] = ['id' => 'json_rw', 'label' => 'קריאה וכתיבה ל-' . $testJsonFile, 'labelAr' => 'قراءة وكتابة لملف ' . $testJsonFile, 'status' => 'ok', 'detail' => 'קריאה וכתיבה תקינים – הקובץ נשמר בהצלחה', 'detailAr' => 'القراءة والكتابة سليمة – تم حفظ الملف بنجاح'];
    } else {
        $allPassed = false;
        $results[] = ['id' => 'json_rw', 'label' => 'קריאה וכתיבה ל-' . $testJsonFile, 'labelAr' => 'قراءة وكتابة لملف ' . $testJsonFile, 'status' => 'fail', 'detail' => "כשל בעדכון הקובץ '$testJsonFile' – ייתכן בעיית הרשאות או בעלות (Ownership). בשרתי cPanel יש לבדוק בעלות דרך File Manager.", 'detailAr' => 'فشل في تحديث الملف – يجب التحقق من الملكية والصلاحيات.' ];
        writeErrorLog($errorLogPath, 'JSON_RW_CHECK (' . $testJsonFile . '): write failed');
    }
} else {
    $allPassed = false;
    $results[] = ['id' => 'json_rw', 'label' => 'קריאה וכתיבה ל-' . $testJsonFile, 'labelAr' => 'قراءة وكتابة لملف ' . $testJsonFile, 'status' => 'fail', 'detail' => "הקובץ '$testJsonFile' לא נמצא בתיקיית data/", 'detailAr' => 'الملف غير موجود'];
}

// Check B2: All JSON files permissions
$permIssues = [];
$permChecked = 0;
$jsonFiles = @glob($dataDir . '/*.json');
if ($jsonFiles !== false) {
    foreach ($jsonFiles as $f) {
        $permChecked++;
        $fname = basename($f);
        if (!is_readable($f) || !is_writable($f)) {
            $permIssues[] = $fname;
        }
    }
}
if (empty($permIssues)) {
    $results[] = ['id' => 'all_json_perms', 'label' => 'הרשאות כל קבצי ה-JSON', 'labelAr' => 'صلاحيات جميع ملفات JSON', 'status' => 'ok', 'detail' => 'כל ' . $permChecked . ' קבצי JSON נבדקו – הרשאות קריאה/כתיבה תקינות', 'detailAr' => 'تم فحص ' . $permChecked . ' ملفات – صلاحيات القراءة/الكتابة سليمة'];
} else {
    $allPassed = false;
    $results[] = ['id' => 'all_json_perms', 'label' => 'הרשאות כל קבצי ה-JSON', 'labelAr' => 'صلاحيات جميع ملفات JSON', 'status' => 'fail', 'detail' => 'נמצאו ' . count($permIssues) . ' קבצים חסומים: ' . implode(', ', $permIssues), 'detailAr' => 'تم العثور على ' . count($permIssues) . ' ملفات محظورة: ' . implode(', ', $permIssues)];
    writeErrorLog($errorLogPath, 'JSON_PERM_ISSUES: ' . implode(', ', $permIssues));
}

// Check C: Absolute path
$results[] = ['id' => 'abs_path', 'label' => 'נתיב מוחלט של תיקיית הנתונים', 'labelAr' => 'المسار المطلق لمجلد البيانات', 'status' => 'info', 'detail' => realpath($dataDir) ?: $dataDir, 'detailAr' => realpath($dataDir) ?: $dataDir];

// Check D: Server resources (PHP info)
$memLimit = ini_get('memory_limit');
$memUsed = round(memory_get_usage(true) / 1024 / 1024, 1);
$memPeak = round(memory_get_peak_usage(true) / 1024 / 1024, 1);
$memStatus = 'ok';
$memDetail = 'זיכרון PHP: ' . $memUsed . 'MB בשימוש, שיא: ' . $memPeak . 'MB, הגבלה: ' . $memLimit . '. ';
if ($memPeak > 128) { $memStatus = 'warn'; $memDetail .= 'זיכרון שיא גבוה.'; }
$results[] = ['id' => 'memory', 'label' => 'זיכרון שרת', 'labelAr' => 'ذاكرة الخادم', 'status' => $memStatus, 'detail' => $memDetail, 'detailAr' => $memDetail];

// PHP version & web server
$results[] = ['id' => 'php_ver', 'label' => 'גרסת PHP', 'labelAr' => 'إصدار PHP', 'status' => 'info', 'detail' => PHP_VERSION, 'detailAr' => PHP_VERSION];
$webServer = $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown';
$results[] = ['id' => 'platform', 'label' => 'שרת אינטרנט', 'labelAr' => 'خادم الويب', 'status' => 'info', 'detail' => $webServer, 'detailAr' => $webServer];

// Check E: cPanel Ownership Check
$ownershipTestPath = $dataDir . '/_ownership_check_tmp.tmp';
$existingFiles = @glob($dataDir . '/*.json');
$existingOwner = null;
if (!empty($existingFiles)) {
    $existingStat = @stat($existingFiles[0]);
    if ($existingStat) {
        $existingOwner = ['uid' => $existingStat['uid'], 'gid' => $existingStat['gid']];
        $existingOwner['name'] = function_exists('posix_getpwuid') ? (posix_getpwuid($existingStat['uid'])['name'] ?? 'uid:' . $existingStat['uid']) : 'uid:' . $existingStat['uid'];
    }
}
$testWriteOk = @file_put_contents($ownershipTestPath, 'ownership-test');
if ($testWriteOk !== false) {
    $newStat = @stat($ownershipTestPath);
    @unlink($ownershipTestPath);
    if ($newStat && $existingOwner) {
        $newOwnerName = function_exists('posix_getpwuid') ? (posix_getpwuid($newStat['uid'])['name'] ?? 'uid:' . $newStat['uid']) : 'uid:' . $newStat['uid'];
        if ($newStat['uid'] !== $existingOwner['uid']) {
            $allPassed = false;
            $results[] = ['id' => 'cpanel_owner', 'label' => 'בדיקת בעלות (Ownership) – cPanel', 'labelAr' => 'فحص الملكية (Ownership) – cPanel', 'status' => 'fail', 'detail' => 'מתבצעת כתיבה תחת משתמש ' . $newOwnerName . ' (UID ' . $newStat['uid'] . ') בעוד קבצי המערכת שייכים ל-' . $existingOwner['name'] . ' (UID ' . $existingOwner['uid'] . '). ייתכן שהכתיבה מבוצעת תחת nobody/www-data. מומלץ לעדכן בעלות (Ownership/Chown) בתיקיית ה-JSON דרך cPanel > מנהל קבצים. לאחר מכן יש להגדיר הרשאות: תיקיות 755, קבצים 644 או 664. לא להשתמש ב-777 – בשרתי cPanel פעולה זו עלולה לחסום את האתר.', 'detailAr' => 'يتم الكتابة تحت مستخدم مختلف – يُنصح بتحديث الملكية عبر cPanel > مدير الملفات.'];
            writeErrorLog($errorLogPath, 'CPANEL_OWNERSHIP_MISMATCH: new UID=' . $newStat['uid'] . ' vs existing UID=' . $existingOwner['uid']);
        } else {
            $results[] = ['id' => 'cpanel_owner', 'label' => 'בדיקת בעלות (Ownership) – cPanel', 'labelAr' => 'فحص الملكية (Ownership) – cPanel', 'status' => 'ok', 'detail' => 'בעלות הקבצים תקינה (' . $newOwnerName . ', UID ' . $newStat['uid'] . ', GID ' . $newStat['gid'] . ').', 'detailAr' => 'ملكية الملفات سليمة (' . $newOwnerName . ', UID ' . $newStat['uid'] . ').'];
        }
    } else {
        $results[] = ['id' => 'cpanel_owner', 'label' => 'בדיקת בעלות (Ownership) – cPanel', 'labelAr' => 'فحص الملكية (Ownership) – cPanel', 'status' => 'ok', 'detail' => 'בעלות תקינה – כתיבה וקריאה עובדים תחת אותו משתמש.', 'detailAr' => 'الملكية سليمة – القراءة والكتابة تعملان تحت نفس المستخدم.'];
    }
} else {
    $results[] = ['id' => 'cpanel_owner', 'label' => 'בדיקת בעלות (Ownership) – cPanel', 'labelAr' => 'فحص الملكية (Ownership) – cPanel', 'status' => 'warn', 'detail' => 'לא ניתן היה לבצע בדיקת בעלות – ייתכן שחסרות הרשאות כתיבה.', 'detailAr' => 'لم يمكن إجراء فحص الملكية – ربما تفتقر صلاحيات الكتابة.'];
}

// Error log file status
$logExists = file_exists($errorLogPath);
if ($logExists) {
    $logStat = @stat($errorLogPath);
    $logSize = round($logStat['size'] / 1024, 1);
    $logMtime = date('Y-m-d H:i:s', $logStat['mtime']);
    $logDetail = 'קיים – גודל: ' . $logSize . 'KB, עודכן: ' . $logMtime;
} else {
    $logDetail = 'לא קיים – ייווצר אוטומטית עם השגיאה הראשונה';
}
$results[] = ['id' => 'error_log', 'label' => 'קובץ יומן שגיאות', 'labelAr' => 'ملف سجل الأخطاء', 'status' => 'info', 'detail' => $logDetail, 'detailAr' => $logDetail];

echo json_encode(['allPassed' => $allPassed, 'results' => $results, 'timestamp' => gmdate('Y-m-d\TH:i:s') . 'Z'], JSON_UNESCAPED_UNICODE);
