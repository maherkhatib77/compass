<?php
/**
* API Endpoint — homepage_settings
* מחזיר את נתוני דף השער כאובייקט שטוח (flat object)
* ממפה את מבנה section_key/content_json לאובייקט שהקליינט מצפה לו
*
* פורמט פלט:
* {
*   "logo": "",
*   "siteName": {"he": "...", "ar": "..."},
*   "footerText": {"he": "...", "ar": "..."},
*   "mainContent": {"combined": "...", "he": "...", "ar": "..."},
*   "navItems": [...],
*   "sidebarItems": [...]
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

    // שליפת כל המקטעים מטבלת homepage_settings
    $stmt = $conn->query("SELECT * FROM homepage_settings ORDER BY order_index ASC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // בניית אובייקט שטוח מהמקטעים
    $flat = [
        'logo'         => '',
        'siteName'     => ['he' => '', 'ar' => ''],
        'footerText'   => ['he' => '', 'ar' => ''],
        'mainContent'  => ['combined' => '', 'he' => '', 'ar' => ''],
        'navItems'     => [],
        'sidebarItems' => []
    ];

    foreach ($rows as $row) {
        $key = $row['section_key'];
        $content = null;

        if (!empty($row['content_json'])) {
            $content = is_string($row['content_json'])
                ? json_decode($row['content_json'], true)
                : $row['content_json'];
        }

        if ($content === null) continue;

        switch ($key) {
            case 'site_info':
                if (isset($content['logo']))       $flat['logo']       = $content['logo'];
                if (isset($content['siteName']))   $flat['siteName']   = $content['siteName'];
                if (isset($content['footerText'])) $flat['footerText'] = $content['footerText'];
                break;

            case 'main_content':
                $flat['mainContent'] = $content;
                break;

            case 'nav_items':
                $flat['navItems'] = is_array($content) ? $content : [];
                break;

            case 'sidebar_items':
                $flat['sidebarItems'] = is_array($content) ? $content : [];
                break;
        }
    }

    echo json_encode($flat, JSON_UNESCAPED_UNICODE);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error"     => "שגיאת מסד נתונים",
        "message"   => $e->getMessage(),
        "sql_state" => $e->getCode()
    ], JSON_UNESCAPED_UNICODE);
}
?>