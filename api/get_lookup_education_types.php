<?php
require_once __DIR__ . '/../config-manager.php';
setCorsHeaders();
header("Content-Type: application/json; charset=UTF-8");

try {
    $config = getDbConfig();
    $dsn = getDsn();
    $conn = new PDO($dsn, $config['username'], $config['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conn->query("SELECT * FROM lookup_education_types ORDER BY id ASC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $mapped = array_map(function($row) {
        $order = null;
        if (!empty($row['extra_data'])) {
            $extra = is_string($row['extra_data']) ? json_decode($row['extra_data'], true) : $row['extra_data'];
            $order = $extra['sort_order'] ?? $extra['order'] ?? null;
        }
        return [
            'id'        => (int)$row['id'],
            'value'     => $row['code'] ?? '',
            'label'     => $row['name_he'] ?? '',
            'labelHe'   => $row['name_he'] ?? '',
            'labelAr'   => $row['name_ar'] ?? '',
            'code'      => $row['code'] ?? '',
            'name_he'   => $row['name_he'] ?? '',
            'name_ar'   => $row['name_ar'] ?? '',
            'order'     => $order,
            'isActive'  => ($row['is_active'] ?? 1) == 1,
            'is_active' => $row['is_active'] ?? 1,
            'extra_data'=> $row['extra_data'] ?? null
        ];
    }, $rows);

    echo json_encode($mapped, JSON_UNESCAPED_UNICODE);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "שגיאת מסד נתונים", "message" => $e->getMessage()]);
}
?>