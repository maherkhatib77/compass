<?php
/**
 * Unified CRUD API endpoint
 * Supports: GET (list or single by id), POST (create), PUT (update), DELETE (delete)
 * Uses config-manager.php for DB and CORS settings
 */

require_once __DIR__ . '/../config-manager.php';

// CORS + preflight handling
setCorsHeaders();
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

// Allowed tables (must mirror get_data.php list)
$allowed_tables = [
    'users', 'categories', 'learning_solutions', 'solution_instructors',
    'inspectors', 'budgets', 'periods', 'registrations', 'system_settings',
    'faq_data', 'activity_log', 'catalog_entries', 'catalog_items',
    'solution_comments', 'mentors', 'pedagogical_executors'
];

// Read raw input ONCE and decode for reuse (avoids php://input being drained)
$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true);

// Get table param (from query for GET/DELETE, from JSON body for POST/PUT if not present)
if (isset($_GET['table'])) {
    $table = $_GET['table'];
} else {
    $table = isset($body['table']) ? $body['table'] : '';
}

// Basic validation of table name
$allowed_lookup_pattern = '/^lookup_[a-z0-9_]+$/';
if (empty($table) || (!in_array($table, $allowed_tables, true) && !preg_match($allowed_lookup_pattern, $table))) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing table name']);
    exit;
}

// Ensure simple table name pattern
if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid table name characters']);
    exit;
}

try {
    $config = getDbConfig();
    $dsn = getDsn();
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $id = (int) $_GET['id'];
                $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE id = :id LIMIT 1");
                $stmt->execute([':id' => $id]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$row) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Not found']);
                    exit;
                }
                echo json_encode($row);
                exit;
            } else {
                $stmt = $pdo->query("SELECT * FROM `$table` ORDER BY id ASC");
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($rows);
                exit;
            }
            break;

        case 'POST':
            $input = $body;
            if (!$input || !isset($input['data']) || !is_array($input['data'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid request payload: missing data']);
                exit;
            }
            $data = $input['data'];

            // Normalize client keys for lookup_* tables so front-end can send { value,label,labelAr }
            if (strpos($table, 'lookup_') === 0 && is_array($data)) {
                $norm = [];
                // primary code/value
                if (isset($data['value'])) $norm['code'] = $data['value'];
                if (isset($data['code'])) $norm['code'] = $data['code'];
                // Hebrew label -> name_he
                if (isset($data['label'])) $norm['name_he'] = $data['label'];
                if (isset($data['label_he'])) $norm['name_he'] = $data['label_he'];
                if (isset($data['name_he'])) $norm['name_he'] = $data['name_he'];
                // Arabic label -> name_ar
                if (isset($data['labelAr'])) $norm['name_ar'] = $data['labelAr'];
                if (isset($data['label_ar'])) $norm['name_ar'] = $data['label_ar'];
                if (isset($data['name_ar'])) $norm['name_ar'] = $data['name_ar'];
                // isActive -> is_active
                if (isset($data['isActive'])) $norm['is_active'] = $data['isActive'] ? 1 : 0;
                if (isset($data['is_active'])) $norm['is_active'] = $data['is_active'] ? 1 : 0;
                // order -> extra_data.sort_order (to avoid failing on schemas without an 'order' column)
                if (isset($data['order'])) {
                    $norm['extra_data'] = json_encode(['sort_order' => $data['order']]);
                }
                // carry through any other server-expected fields
                foreach ($data as $k => $v) {
                    if (in_array($k, ['value','label','labelAr','label_he','label_ar','order','isActive','is_active','code','name_he','name_ar'])) continue;
                    $norm[$k] = $v;
                }
                $data = $norm;
            }

            // Validate column names
            $columns = [];
            $placeholders = [];
            $params = [];
            foreach ($data as $col => $val) {
                if (!preg_match('/^[a-zA-Z0-9_]+$/', $col)) continue; // skip invalid
                $columns[] = "`$col`";
                $placeholders[] = ':' . $col;
                $params[':' . $col] = $val;
            }
            if (empty($columns)) {
                http_response_code(400);
                echo json_encode(['error' => 'No valid columns provided']);
                exit;
            }

            $sql = "INSERT INTO `$table` (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $lastId = $pdo->lastInsertId();
            $affected = $stmt->rowCount();

            // Return created row
            $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $lastId]);
            $created = $stmt->fetch(PDO::FETCH_ASSOC);
            http_response_code(201);
            echo json_encode(['success' => true, 'id' => $lastId, 'affectedRows' => $affected, 'record' => $created]);
            exit;
            break;

        case 'PUT':
        case 'PATCH':
            // Expect id param either in query or in body
            $id = null;
            if (isset($_GET['id'])) $id = (int) $_GET['id'];
            
            $input = $body;
            // If not in query, try body
            if (!$id && $input && isset($input['id'])) $id = (int) $input['id'];
            
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing id for update']);
                exit;
            }

            if (!$input || !isset($input['data']) || !is_array($input['data'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid request payload: missing data']);
                exit;
            }
            $data = $input['data'];

            // Normalize client keys for lookup_* tables on update as well
            if (strpos($table, 'lookup_') === 0 && is_array($data)) {
                $norm = [];
                if (isset($data['value'])) $norm['code'] = $data['value'];
                if (isset($data['code'])) $norm['code'] = $data['code'];
                if (isset($data['label'])) $norm['name_he'] = $data['label'];
                if (isset($data['label_he'])) $norm['name_he'] = $data['label_he'];
                if (isset($data['name_he'])) $norm['name_he'] = $data['name_he'];
                if (isset($data['labelAr'])) $norm['name_ar'] = $data['labelAr'];
                if (isset($data['label_ar'])) $norm['name_ar'] = $data['label_ar'];
                if (isset($data['name_ar'])) $norm['name_ar'] = $data['name_ar'];
                if (isset($data['isActive'])) $norm['is_active'] = $data['isActive'] ? 1 : 0;
                if (isset($data['is_active'])) $norm['is_active'] = $data['is_active'] ? 1 : 0;
                if (isset($data['order'])) {
                    $norm['extra_data'] = json_encode(['sort_order' => $data['order']]);
                }
                foreach ($data as $k => $v) {
                    if (in_array($k, ['value','label','labelAr','label_he','label_ar','order','isActive','is_active','code','name_he','name_ar'])) continue;
                    $norm[$k] = $v;
                }
                $data = $norm;
            }

            $sets = [];
            $params = [':id' => $id];
            foreach ($data as $col => $val) {
                if (!preg_match('/^[a-zA-Z0-9_]+$/', $col)) continue;
                $sets[] = "`$col` = :$col";
                $params[':' . $col] = $val;
            }
            if (empty($sets)) {
                http_response_code(400);
                echo json_encode(['error' => 'No valid columns provided for update']);
                exit;
            }

            $sql = "UPDATE `$table` SET " . implode(', ', $sets) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $affected = $stmt->rowCount();

            // Return updated row - always fetch the current state regardless of affected rows
            $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $id]);
            $updated = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // For UPDATE, consider it successful even if affectedRows is 0
            // (MySQL returns 0 when the new values match existing values)
            echo json_encode(['success' => true, 'id' => $id, 'affectedRows' => $affected, 'record' => $updated]);
            exit;
            break;

        case 'DELETE':
            // Support single delete by id or bulk delete (all rows) by table
            if (isset($_GET['id'])) {
                // Single row delete
                $id = (int) $_GET['id'];
                $stmt = $pdo->prepare("DELETE FROM `$table` WHERE id = :id");
                $stmt->execute([':id' => $id]);
                $affected = $stmt->rowCount();
                echo json_encode(['success' => true, 'id' => $id, 'affectedRows' => $affected]);
            } elseif (isset($_GET['bulk']) && $_GET['bulk'] === 'true') {
                // Bulk delete - remove all rows from the table
                $stmt = $pdo->prepare("DELETE FROM `$table`");
                $stmt->execute();
                $affected = $stmt->rowCount();
                echo json_encode(['success' => true, 'affectedRows' => $affected, 'message' => 'All rows deleted']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Missing id for delete or bulk flag']);
            }
            exit;
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    exit;
}

?>