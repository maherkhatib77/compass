<?php
/**
* API Endpoint — system_settings
* ממפה הגדרות key-value לאובייקט שטוח שהלקוח מצפה לו
*
* פורמט פלט:
* {
*   "siteNameHe": "...",
*   "siteNameAr": "...",
*   "copyrightHe": "...",
*   "copyrightAr": "...",
*   "logoUrl": "...",
*   "language": "he",
*   ...
* }
*/
require_once __DIR__ . '/../config-manager.php';
setCorsHeaders();
header("Content-Type: application/json; charset=UTF-8");

try {
    $config = getDbConfig();
    $dsn = getDsn();
    $conn = new PDO($dsn, $config['username'], $config['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // שליפת כל ההגדרות מהטבלה
    $stmt = $conn->query("SELECT setting_key, setting_value FROM system_settings ORDER BY id ASC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // מיפוי הגדרות key-value לאובייקט שטוח
    $settingsMap = [];
    foreach ($rows as $row) {
        $settingsMap[$row['setting_key']] = $row['setting_value'];
    }

    // ============================================================
    // בניית אובייקט ההגדרות בפורמט שהלקוח מצפה לו
    // ============================================================
    $settings = [
        // חלק ראשון: כותרת אתר וזכויות יוצרים
        'siteNameHe'    => $settingsMap['site_name_he'] ?? '',
        'siteNameAr'    => $settingsMap['site_name_ar'] ?? '',
        'copyrightHe'   => $settingsMap['copyright_he'] ?? '',
        'copyrightAr'   => $settingsMap['copyright_ar'] ?? '',
        'logoUrl'       => $settingsMap['logo_url'] ?? '',
        
        // הגדרות מערכת כלליות
        'systemNameHe'  => $settingsMap['system_name_he'] ?? '',
        'systemNameAr'  => $settingsMap['system_name_ar'] ?? '',
        'language'      => $settingsMap['default_language'] ?? 'he',
        
        // הגדרות אבטחה
        'maxLoginAttempts'       => (int)($settingsMap['max_login_attempts'] ?? 5),
        'lockoutDurationMinutes' => (int)($settingsMap['lockout_duration_minutes'] ?? 15),
        'sessionTimeoutMinutes'  => (int)($settingsMap['session_timeout_minutes'] ?? 30),
        'maintenanceMode'        => ($settingsMap['maintenance_mode'] ?? 'false') === 'true',
    ];

    echo json_encode($settings, JSON_UNESCAPED_UNICODE);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error"     => "שגיאת מסד נתונים",
        "message"   => $e->getMessage(),
        "sql_state" => $e->getCode()
    ], JSON_UNESCAPED_UNICODE);
}
?>