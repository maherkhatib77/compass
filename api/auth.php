<?php
/**
 * API Endpoint
 * משתמש ב-config-manager.php להגדרות גמישות בין סביבות
 */

// טעינת הגדרות תצורה מרכזיות
require_once __DIR__ . '/../config-manager.php';

// הגדרת כותרות CORS
setCorsHeaders();

// api/auth.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// הגדרות חיבור למסד הנתונים (XAMPP)
try {
    // קבלת הגדרות חיבור מה-config manager
    $config = getDbConfig();
    $dsn = getDsn();
    
    $conn = new PDO($dsn, $config['username'], $config['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "שגיאת חיבור למסד הנתונים: " . $e->getMessage()]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($data->action)) {
    
    if ($data->action === 'login') {
        $inputUser = trim($data->username ?? '');
        $inputPass = trim($data->password ?? '');

        if (empty($inputUser) || empty($inputPass)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "נא למלא שם משתמש וסיסמה"]);
            exit();
        }

        try {
            // יצירת גיבוב SHA256 מהסיסמה שהוזנה כדי להשוות למסד הנתונים
            $hashedInput = hash('sha256', $inputPass);

            // שליפת המשתמש מהטבלה USERS
            $stmt = $conn->prepare("SELECT id, username, password_hash, full_name, role, is_active FROM USERS WHERE username = ? LIMIT 1");
            $stmt->execute([$inputUser]);
            
            if ($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // בדיקה אם המשתמש פעיל
                if ($row['is_active'] == 0) {
                    http_response_code(403);
                    echo json_encode(["success" => false, "message" => "חשבון זה חסום או לא פעיל"]);
                    exit();
                }

                // השוואת הסיסמה המוצפנת (SHA256) לזו שבמסד הנתונים
                if ($hashedInput === $row['password_hash']) {
                    
                    // עדכון זמן כניסה אחרונה
                    $updateStmt = $conn->prepare("UPDATE USERS SET last_login = NOW(), failed_login_attempts = 0 WHERE id = ?");
                    $updateStmt->execute([$row['id']]);
                    
                    echo json_encode([
                        "success" => true,
                        "message" => "התחברות מוצלחת",
                        "user" => [
                            "id" => $row['id'],
                            "username" => $row['username'],
                            "full_name" => $row['full_name'],
                            "role" => $row['role']
                        ]
                    ]);
                } else {
                    // סיסמה שגויה
                    echo json_encode(["success" => false, "message" => "שם משתמש או סיסמה שגויים"]);
                }
            } else {
                // משתמש לא נמצא
                echo json_encode(["success" => false, "message" => "משתמש לא נמצא במערכת"]);
            }
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "שגיאה פנימית: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "פעולה לא מוכרת"]);
    }
} else {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "בקשה לא חוקית"]);
}
?>