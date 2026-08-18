<?php
/**
* API Endpoint — שמירת הגדרות מערכת
* מקבל אובייקט הגדרות ושומר לטבלת system_settings (key-value)
*
* פורמט קלט:
* {
*   "siteNameHe": "...",
*   "siteNameAr": "...",
*   "copyrightHe": "...",
*   "copyrightAr": "...",
*   "logoUrl": "..."
* }
*/
require_once __DIR__ . '/../config-manager.php';
setCorsHeaders();
header("Content-Type: application/json; charset=UTF-8");

// קבלת נתונים
$rawBody = file_get_contents('php://input');
$input = $rawBody ? json_decode($rawBody, true) : [];

if (empty($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'לא נשלחו נתונים'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $config = getDbConfig();
    $dsn = getDsn();
    $conn = new PDO($dsn, $config['username'], $config['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // מיפוי שמות שדות מהלקוח למפתחות בטבלה
    $fieldToKeyMap = [
        'siteNameHe'    => 'site_name_he',
        'siteNameAr'    => 'site_name_ar',
        'copyrightHe'   => 'copyright_he',
        'copyrightAr'   => 'copyright_ar',
        'logoUrl'       => 'logo_url',
        'systemNameHe'  => 'system_name_he',
        'systemNameAr'  => 'system_name_ar',
        'language'      => 'default_language',
    ];

    $savedCount = 0;
    foreach ($fieldToKeyMap as $clientField => $settingKey) {
        if (isset($input[$clientField])) {
            $value = $input[$clientField];
            
            // UPSERT: עדכון אם קיים, הכנסה אם לא
            $sql = "INSERT INTO system_settings (setting_key, setting_value) 
                    VALUES (?, ?) 
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([$settingKey, $value]);
            $savedCount++;
        }
    }

    echo json_encode([
        'success' => true,
        'saved'   => $savedCount,
        'message' => "נשמרו $savedCount הגדרות"
    ], JSON_UNESCAPED_UNICODE);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'שגיאה בשמירת הגדרות',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>