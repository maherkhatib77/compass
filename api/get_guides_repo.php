<?php
/**
* API Endpoint — get_guides_repo.php
* משתמש ב-config-manager.php להגדרות גמישות בין סביבות
* כולל מיפוי שמות עמודות מ-snake_case ל-camelCase עבור הקליינט
*/
// טעינת הגדרות תצורה מרכזיות
require_once __DIR__ . '/../config-manager.php';
// הגדרת כותרות CORS
setCorsHeaders();
header("Content-Type: application/json; charset=UTF-8");
try {
    // קבלת הגדרות חיבור מה-config manager
    $config = getDbConfig();
    $dsn = getDsn();
    $conn = new PDO($dsn, $config['username'], $config['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // שליפת כל הרשומות מהטבלה guides_repo
    $stmt = $conn->query("SELECT * FROM guides_repo ORDER BY id ASC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // מיפוי שמות עמודות מ-snake_case (DB) ל-camelCase (Client)
    $results = array_map(function($row) {
        return [
            'id'              => (int)($row['id'] ?? 0),
            // שמות — camelCase לקליינט + snake_case לתאימות לאחור
            'fullName'        => $row['full_name'] ?? '',
            'full_name'       => $row['full_name'] ?? '',
            'fullNameAr'      => $row['full_name_ar'] ?? '',
            'full_name_ar'    => $row['full_name_ar'] ?? '',
            // תעודת זהות
            'idNumber'        => $row['id_number'] ?? '',
            'id_number'       => $row['id_number'] ?? '',
            // תפקיד
            'position'        => $row['position'] ?? '',
            // פרטי התקשרות
            'phone'           => $row['phone'] ?? '',
            'email'           => $row['email'] ?? '',
            // תחומי התמחות
            'specializations' => $row['specializations'] ?? '',
            // תמונות פרופיל — כל הווריאנטים שהקליינט מצפה להם
            'avatar_thumb'    => $row['avatar_thumb'] ?? '',
            'avatarThumb'     => $row['avatar_thumb'] ?? '',
            'avatar_retina'   => $row['avatar_retina'] ?? '',
            'avatarRetina'    => $row['avatar_retina'] ?? '',
            'profileImage'    => $row['profile_image'] ?? '',
            'profile_image'   => $row['profile_image'] ?? '',
            // סטטוס פעיל — בוליאני + מספרי
            'isActive'        => ($row['is_active'] ?? 1) == 1,
            'is_active'       => (int)($row['is_active'] ?? 1),
            // שדות נוספים שהקליינט מצפה להם (ברירת מחדל)
            'order'           => (int)($row['order'] ?? 0),
            'createdAt'       => $row['created_at'] ?? null,
            'created_at'      => $row['created_at'] ?? null,
            'updatedAt'       => $row['updated_at'] ?? null,
            'updated_at'      => $row['updated_at'] ?? null,
        ];
    }, $rows);
    
    echo json_encode($results);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error"     => "שגיאת מסד נתונים",
        "message"   => $e->getMessage(),
        "sql_state" => $e->getCode()
    ]);
}
?>