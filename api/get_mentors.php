<?php
require_once __DIR__ . '/../config-manager.php';
setCorsHeaders();
header("Content-Type: application/json; charset=UTF-8");

try {
    $config = getDbConfig();
    $dsn = getDsn();
    $conn = new PDO($dsn, $config['username'], $config['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conn->query("SELECT * FROM mentors ORDER BY id ASC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // מיפוי שמות עמודות מ-snake_case ל-camelCase
    $mapped = array_map(function($row) {
        return [
            'id'                 => (int)$row['id'],
            'idNumber'           => $row['id_number'] ?? '',
            'id_number'          => $row['id_number'] ?? '',
            'fullNameHe'         => $row['full_name_he'] ?? '',
            'full_name_he'       => $row['full_name_he'] ?? '',
            'fullNameAr'         => $row['full_name_ar'] ?? '',
            'full_name_ar'       => $row['full_name_ar'] ?? '',
            'fullName'           => $row['full_name_he'] ?? '',  // fallback
            'phone'              => $row['phone'] ?? '',
            'email'              => $row['email'] ?? '',
            'isCertifiedLecturer'=> $row['is_certified_lecturer'] ?? '',
            'is_certified_lecturer' => $row['is_certified_lecturer'] ?? '',
            'expertInField'      => $row['expert_in_field'] ?? '',
            'expert_in_field'    => $row['expert_in_field'] ?? '',
            'lecturerStatus'     => $row['lecturer_status'] ?? '',
            'lecturer_status'    => $row['lecturer_status'] ?? '',
            'performerType'      => $row['performer_type'] ?? '',
            'performer_type'     => $row['performer_type'] ?? '',
            'organization'       => $row['organization'] ?? '',
            'isActive'           => ($row['is_active'] ?? 1) == 1,
            'is_active'          => $row['is_active'] ?? 1
        ];
    }, $rows);

    echo json_encode($mapped, JSON_UNESCAPED_UNICODE);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "שגיאת מסד נתונים",
        "message" => $e->getMessage()
    ]);
}
?>