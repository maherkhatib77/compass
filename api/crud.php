<?php
// api/crud.php - minimal PDO CRUD. Customize DB config & column lists.
header('Content-Type: application/json; charset=utf-8');
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? '';
$table = $input['table'] ?? '';
$payload = $input['payload'] ?? [];

// whitelist tables and optionally allowed columns
$ALLOWED = [
  'solutions' => ['id','name','academicHours','...'],
  'periods' => ['id','name','period1Start','period1End','period2Start','period2End','is_active'],
  'users' => ['id','username','fullName','role','password_hash'],
  'budgets' => ['id','budgetCode','amount','hebrewYear'],
  'registrations' => ['id','userId','solutionId','status']
];
if (!isset($ALLOWED[$table])) echo json_encode(['success'=>false,'error'=>'Table not allowed']), exit;

// PDO connect
$dsn = 'mysql:host=127.0.0.1;dbname=compass;charset=utf8mb4';
$user = 'dbuser'; $pass = 'dbpass';
try { $pdo = new PDO($dsn,$user,$pass, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]); }
catch(PDOException $e){ echo json_encode(['success'=>false,'error'=>'DB connect']); exit; }

try {
  if ($action === 'list') {
    $stmt = $pdo->query("SELECT * FROM `$table` ORDER BY id DESC LIMIT 1000");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success'=>true,'rows'=>$rows]); exit;
  }
  if ($action === 'get') {
    $id = $payload['id'] ?? null;
    $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE id = :id LIMIT 1");
    $stmt->execute([':id'=>$id]);
    echo json_encode(['success'=>true,'record'=>$stmt->fetch(PDO::FETCH_ASSOC)]); exit;
  }
  if ($action === 'create') {
    $rec = $payload['record'] ?? [];
    $cols = array_intersect(array_keys($rec), $ALLOWED[$table]);
    $place = array_map(fn($c)=>':'.$c,$cols);
    $sql = "INSERT INTO `$table` (`".implode('`,`',$cols)."`) VALUES (".implode(',',$place).")";
    $stmt = $pdo->prepare($sql);
    $params = []; foreach($cols as $c) $params[':'.$c] = $rec[$c];
    $stmt->execute($params);
    $id = $pdo->lastInsertId();
    $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE id=:id");
    $stmt->execute([':id'=>$id]);
    echo json_encode(['success'=>true,'record'=>$stmt->fetch(PDO::FETCH_ASSOC)]);
    exit;
  }
  if ($action === 'update') {
    $id = $payload['id'] ?? null; $rec = $payload['record'] ?? [];
    $cols = array_intersect(array_keys($rec), $ALLOWED[$table]);
    $set = implode(',', array_map(fn($c)=>"`$c` = :$c",$cols));
    $sql = "UPDATE `$table` SET $set WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $params = [':id'=>$id]; foreach($cols as $c) $params[':'.$c]=$rec[$c];
    $stmt->execute($params);
    $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE id=:id");
    $stmt->execute([':id'=>$id]);
    echo json_encode(['success'=>true,'record'=>$stmt->fetch(PDO::FETCH_ASSOC)]);
    exit;
  }
  if ($action === 'delete') {
    $id = $payload['id'] ?? null;
    $stmt = $pdo->prepare("DELETE FROM `$table` WHERE id = :id");
    $stmt->execute([':id'=>$id]);
    echo json_encode(['success'=>true,'deletedId'=>$id]); exit;
  }
  echo json_encode(['success'=>false,'error'=>'Unknown action']);
} catch(Exception $e){ echo json_encode(['success'=>false,'error'=>$e->getMessage()]); }