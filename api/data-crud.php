<?php
/**
* data-crud.php — Unified CRUD API for all tables
*
* Handles field name mapping between generic client-side names
* (value, label, labelAr, isActive, order) and actual database column names.
*
* Supports: GET, POST (create/bulk), PUT (update), DELETE (single/bulk)
*/
require_once __DIR__ . '/../config-manager.php';
setCorsHeaders();
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

// ============================================================
// FIELD MAPPING TABLE
// Maps generic field names → actual database column names per table
// ============================================================
$FIELD_MAPS = [
    // ---- Lookup tables (all share same structure) ----
    'lookup_week_days' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_domains' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_education_stages' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_education_types' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_meeting_types' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_budget_types' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_allocation_status' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_performer_types' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_lecturer_status' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_certified_lecturer' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_expert_field' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_field_knowledge' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_role_holders' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_broad_topics' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_designated_programs' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_responsibility_types' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_solution_status' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_user_roles' => [
        'value'    => 'code',
        'label'    => 'name_he',
        'labelHe'  => 'name_he',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => '_extra_sort_order',
        'name_he'  => 'name_he',
        'name_ar'  => 'name_ar',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
    'lookup_schools' => [
        'value'    => 'code',
        'label'    => 'name',
        'labelHe'  => 'name',
        'labelAr'  => 'name_ar',
        'isActive' => 'is_active',
        'order'    => 'order',
        'name'     => 'name',
        'code'     => 'code',
        'is_active'=> 'is_active',
    ],
];

// ============================================================
// DEFAULT FIELD MAP — for tables not explicitly listed above
// Maps camelCase to snake_case generically
// ============================================================
function getDefaultMap($tableName) {
    return [
        'fullNameHe'         => 'full_name_he',
        'fullNameAr'         => 'full_name_ar',
        'fullName'           => 'full_name',
        'idNumber'           => 'id_number',
        'phone'              => 'phone',
        'email'              => 'email',
        'position'           => 'position',
        'specializations'    => 'specializations',
        'isCertifiedLecturer'=> 'is_certified_lecturer',
        'expertInField'      => 'expert_in_field',
        'lecturerStatus'     => 'lecturer_status',
        'performerType'      => 'performer_type',
        'organization'       => 'organization',
        'isActive'           => 'is_active',
        'createdAt'          => 'created_at',
        'updatedAt'          => 'updated_at',
        'hebrewYear'         => 'hebrew_year',
        'englishYear'        => 'english_year',
        'period'             => 'period',
        'estimationStatus'   => 'estimation_status',
        'moneyColor'         => 'money_color',
        'organizationalUnit' => 'organizational_unit',
        'budgetFor'          => 'budget_for',
        'description'        => 'description',
        'notes'              => 'notes',
        'amount'             => 'amount',
        'planningBalance'    => 'planning_balance',
        'managementBalance'  => 'management_balance',
        'freeBudgetBalance'  => 'free_budget_balance',
        'budgetCode'         => 'budget_code',
        'period1Label'       => 'period1_label',
        'period1Start'       => 'period1_start',
        'period1End'         => 'period1_end',
        'period2Label'       => 'period2_label',
        'period2Start'       => 'period2_start',
        'period2End'         => 'period2_end',
        'periodId'           => 'period_id',
        'schoolName'         => 'school_name',
        'schoolId'           => 'school_id',
        'schoolCode'         => 'school_code',
        'solutionNumber'     => 'solution_number',
        'guideId'            => 'guide_id',
        'topicType'          => 'topic_type',
        'topic'              => 'topic',
        'educationStage'     => 'education_stage',
        'educationType'      => 'education_type',
        'startDate'          => 'start_date',
        'endDate'            => 'end_date',
        'weekDay'            => 'week_day',
        'meetingType'        => 'meeting_type',
        'academicHours'      => 'academic_hours',
        'budgetType'         => 'budget_type',
        'budgetTypeValue'    => 'budget_type_value',
        'budgetedHours'      => 'budgeted_hours',
        'period1Hours'       => 'period1_hours',
        'period2Hours'       => 'period2_hours',
        'budgetAllocationStatus' => 'budget_allocation_status',
        'whatsappLink'       => 'whatsapp_link',
        'registrationLink'   => 'registration_link',
        'earlyRegistrationLink'  => 'early_registration_link',
        'showInCatalog'      => 'show_in_catalog',
        'showInPublicCatalog' => 'show_in_public_catalog',
        'responsibilityType' => 'responsibility_type',
        'createdBy'          => 'created_by',
        'status'             => 'status',
        'solutionId'         => 'solution_id',
        'mentorId'           => 'mentor_id',
        'mentorRepoId'       => 'mentor_repo_id',
        'totalAcademicHours' => 'total_academic_hours',
        'isAccompaniment'    => 'is_accompaniment',
        'pedagogicalExecutorId' => 'pedagogical_executor_id',
        'period1BudgetCode'  => 'period1_budget_code',
        'period2BudgetCode'  => 'period2_budget_code',
        'period1AllocStatus' => 'period1_alloc_status',
        'period2AllocStatus' => 'period2_alloc_status',
        'username'           => 'username',
        'password'           => 'password',
        'role'               => 'role',
        'institutionCode'    => 'institution_code',
        'institutionName'    => 'institution_name',
        'institutionCodes'   => 'institution_codes',
        'institutionNames'   => 'institution_names',
        'solutionName'       => 'solution_name',
        'titleHe'            => 'title_he',
        'titleAr'            => 'title_ar',
        'answerHe'           => 'answer_he',
        'answerAr'           => 'answer_ar',
        'order'              => 'sort_order',
        'siteNameHe'         => 'site_name_he',
        'siteNameAr'         => 'site_name_ar',
        'copyrightHe'        => 'copyright_he',
        'copyrightAr'        => 'copyright_ar',
        'logoUrl'            => 'logo_url',
        'language'           => 'language',
        'district'           => 'district',
        'schoolIds'          => 'school_ids',
        'companyNumber'      => 'company_number',
        'institutionName'    => 'institution_name',
        'groupName'          => 'group_name',
        'hourlyCost'         => 'hourly_cost',
        'legalStatus'        => 'legal_status',
        'principalName'      => 'principal_name',
        'inspectorName'      => 'inspector_name',
        'userName'           => 'user_name',
        'userRole'           => 'user_role',
        'actionType'         => 'action_type',
        'entityType'         => 'entity_type',
        'entityId'           => 'entity_id',
        'timestamp'          => 'timestamp',
        'originalId'         => 'original_id',
        'originalStoreKey'   => 'original_store_key',
        'originalEntityType' => 'original_entity_type',
        'data'               => 'data',
        'deletedBy'          => 'deleted_by',
        'deletedByName'      => 'deleted_by_name',
        'deletedAt'          => 'deleted_at',
        'filename'           => 'filename',
        'menuLocation'       => 'menu_location',
        'menuLabelHe'        => 'menu_label_he',
        'menuLabelAr'        => 'menu_label_ar',
        'content'            => 'content',
        'authorName'         => 'author_name',
    ];
}

// ============================================================
// HELPER: Get column mapping for a table
// ============================================================
function getFieldMap($tableName) {
    global $FIELD_MAPS;
    if (isset($FIELD_MAPS[$tableName])) {
        return $FIELD_MAPS[$tableName];
    }
    return getDefaultMap($tableName);
}

// ============================================================
// HELPER: Check if a column exists in the table
// ============================================================
function columnExists($pdo, $tableName, $columnName) {
    static $cache = [];
    if (!isset($cache[$tableName])) {
        try {
            $stmt = $pdo->query("DESCRIBE `$tableName`");
            $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $cache[$tableName] = $cols;
        } catch (PDOException $e) {
            $cache[$tableName] = [];
        }
    }
    return in_array($columnName, $cache[$tableName]);
}

// ============================================================
// HELPER: Translate client fields to DB columns, filtering unknown columns
// ============================================================
function mapFieldsToColumns($pdo, $tableName, $data) {
    $fieldMap = getFieldMap($tableName);
    $mapped = [];
    $extraDataFields = [];
    
    foreach ($data as $clientField => $value) {
        if ($clientField === 'id') continue;
        
        $dbColumn = null;
        
        // 1. Check explicit mapping
        if (isset($fieldMap[$clientField])) {
            $mapped_to = $fieldMap[$clientField];
            if ($mapped_to === '_extra_sort_order') {
                $extraDataFields['sort_order'] = $value;
                continue;
            }
            $dbColumn = $mapped_to;
        }
        // 2. Try the client field name directly
        else if (columnExists($pdo, $tableName, $clientField)) {
            $dbColumn = $clientField;
        }
        // 3. Try converting camelCase to snake_case
        else {
            $snake = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $clientField));
            if (columnExists($pdo, $tableName, $snake)) {
                $dbColumn = $snake;
            }
        }
        
        if ($dbColumn && columnExists($pdo, $tableName, $dbColumn)) {
            if (is_array($value)) {
                $mapped[$dbColumn] = json_encode($value, JSON_UNESCAPED_UNICODE);
            }
            else if (is_bool($value)) {
                $mapped[$dbColumn] = $value ? 1 : 0;
            }
            else {
                $mapped[$dbColumn] = $value;
            }
        }
    }
    
    if (!empty($extraDataFields)) {
        if (columnExists($pdo, $tableName, 'extra_data')) {
            $mapped['extra_data'] = json_encode($extraDataFields, JSON_UNESCAPED_UNICODE);
        }
    }
    
    return $mapped;
}

// ============================================================
// CONNECT TO DATABASE
// ============================================================
try {
    $config = getDbConfig();
    $dsn = getDsn();
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success'  => false,
        'error'    => 'שגיאת חיבור למסד הנתונים',
        'message'  => $e->getMessage(),
        'sql_state'=> $e->getCode()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================
// PARSE REQUEST
// ============================================================
$method = $_SERVER['REQUEST_METHOD'];
$tableName = $_GET['table'] ?? null;
$id = $_GET['id'] ?? null;
$isBulk = isset($_GET['bulk']) && $_GET['bulk'] === 'true';

$rawBody = file_get_contents('php://input');
$input = $rawBody ? json_decode($rawBody, true) : [];

if (!$tableName && isset($input['table'])) $tableName = $input['table'];
if (!$id && isset($input['id'])) $id = $input['id'];
if (!$id && isset($input['data']['id'])) $id = $input['data']['id'];

$data = isset($input['data']) ? $input['data'] : $input;

// ============================================================
// SECURITY: Whitelist allowed tables
// ============================================================
$ALLOWED_TABLES = [
    'lookup_week_days', 'lookup_domains', 'lookup_education_stages',
    'lookup_education_types', 'lookup_meeting_types', 'lookup_budget_types',
    'lookup_allocation_status', 'lookup_performer_types', 'lookup_lecturer_status',
    'lookup_certified_lecturer', 'lookup_expert_field', 'lookup_field_knowledge',
    'lookup_role_holders', 'lookup_broad_topics', 'lookup_designated_programs',
    'lookup_responsibility_types', 'lookup_solution_status', 'lookup_user_roles',
    'lookup_schools',
    'solutions', 'solution_instructors', 'solution_comments',
    'mentors', 'guides_repo', 'users', 'budgets', 'periods',
    'registrations', 'faq_data', 'inspectors', 'pedagogical_executors',
    'schools', 'activity_log', 'recycle_bin', 'custom_pages',
    'system_settings', 'homepage', 'learning_solutions', 'activity_logs'
];

if (!$tableName || !in_array($tableName, $ALLOWED_TABLES)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => 'שם טבלה לא תקין או לא מורשה',
        'table'   => $tableName
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================
// ROUTE BY METHOD
// ============================================================
try {
    switch ($method) {
        // =============================================
        // GET — Read all or single record
        // =============================================
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE id = ?");
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                echo json_encode([
                    'success' => !!$row,
                    'data'    => $row ?: null
                ], JSON_UNESCAPED_UNICODE);
            } else {
                $stmt = $pdo->query("SELECT * FROM `$tableName` ORDER BY id ASC");
                $rows = $stmt->fetchAll();
                echo json_encode([
                    'success' => true,
                    'data'    => $rows,
                    'count'   => count($rows)
                ], JSON_UNESCAPED_UNICODE);
            }
            break;

        // =============================================
        // POST — Create new record OR Bulk save
        // =============================================
        case 'POST':
            // ✅ NEW: Handle bulk save (replace all records)
            if ($isBulk) {
                if (!is_array($data)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Bulk save requires an array of records in "data" field'
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }
                
                // Start transaction for atomicity
                $pdo->beginTransaction();
                
                try {
                    // Delete all existing records
                    $pdo->query("DELETE FROM `$tableName`");
                    
                    $insertedCount = 0;
                    $errors = [];
                    
                    foreach ($data as $index => $record) {
                        if (!is_array($record)) continue;
                        
                        $mapped = mapFieldsToColumns($pdo, $tableName, $record);
                        if (empty($mapped)) continue;
                        
                        // Remove id if present (let auto-increment handle it)
                        unset($mapped['id']);
                        
                        $columns = array_keys($mapped);
                        if (empty($columns)) continue;
                        
                        $placeholders = array_fill(0, count($columns), '?');
                        $values = array_values($mapped);
                        
                        $sql = "INSERT INTO `$tableName` (`" . implode('`,`', $columns) . "`) VALUES (" . implode(',', $placeholders) . ")";
                        $stmt = $pdo->prepare($sql);
                        $stmt->execute($values);
                        $insertedCount++;
                    }
                    
                    $pdo->commit();
                    
                    echo json_encode([
                        'success'       => true,
                        'insertedCount' => $insertedCount,
                        'totalReceived' => count($data),
                        'message'       => "נשמרו $insertedCount רשומות בהצלחה (bulk)"
                    ], JSON_UNESCAPED_UNICODE);
                    
                } catch (Exception $e) {
                    $pdo->rollBack();
                    throw $e;
                }
                break;
            }
            
            // Standard single record create
            $mapped = mapFieldsToColumns($pdo, $tableName, $data);
            if (empty($mapped)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error'   => 'לא נמצאו שדות תקינים לשמירה',
                    'debug'   => array_keys($data)
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            $columns = array_keys($mapped);
            $placeholders = array_fill(0, count($columns), '?');
            $values = array_values($mapped);
            
            $sql = "INSERT INTO `$tableName` (`" . implode('`,`', $columns) . "`) VALUES (" . implode(',', $placeholders) . ")";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
            $newId = $pdo->lastInsertId();
            
            $fetchStmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE id = ?");
            $fetchStmt->execute([$newId]);
            $record = $fetchStmt->fetch();
            
            echo json_encode([
                'success'      => true,
                'id'           => $newId,
                'record'       => $record,
                'affectedRows' => 1,
                'message'      => 'הרשומה נשמרה בהצלחה'
            ], JSON_UNESCAPED_UNICODE);
            break;

        // =============================================
        // PUT — Update existing record
        // =============================================
case 'PUT':
case 'PATCH':
    // ===== תמיכה בעדכון מקטעי homepage_settings =====
    if ($tableName === 'homepage_settings' && isset($_GET['section'])) {
        $sectionKey = $_GET['section'];
        $contentJson = $data['content_json'] ?? '{}';

        // בדיקה אם המקטע קיים
        $stmt = $pdo->prepare("SELECT id FROM homepage_settings WHERE section_key = ?");
        $stmt->execute([$sectionKey]);
        $existing = $stmt->fetch();

        if ($existing) {
            // עדכון מקטע קיים
            $stmt = $pdo->prepare(
                "UPDATE homepage_settings SET content_json = ?, updated_at = NOW() WHERE section_key = ?"
            );
            $stmt->execute([$contentJson, $sectionKey]);
        } else {
            // יצירת מקטע חדש
            $stmt = $pdo->prepare(
                "INSERT INTO homepage_settings (section_key, content_json, is_visible, order_index) VALUES (?, ?, 1, 0)"
            );
            $stmt->execute([$sectionKey, $contentJson]);
        }

        echo json_encode([
            'success'      => true,
            'section_key'  => $sectionKey,
            'affectedRows' => 1,
            'message'      => 'המקטע נשמר בהצלחה'
        ], JSON_UNESCAPED_UNICODE);
        break;
    }

    // ===== עדכון רגיל (שאר הטבלאות) =====
    if (!$id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'חובה לציין ID לעדכון'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $mapped = mapFieldsToColumns($pdo, $tableName, $data);
    if (empty($mapped)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'לא נמצאו שדות תקינים לעדכון'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $setParts = [];
    $values = [];
    foreach ($mapped as $col => $val) {
        $setParts[] = "`$col` = ?";
        $values[] = $val;
    }
    $values[] = $id;

    $sql = "UPDATE `$tableName` SET " . implode(', ', $setParts) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    $fetchStmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE id = ?");
    $fetchStmt->execute([$id]);
    $record = $fetchStmt->fetch();

    echo json_encode([
        'success'      => true,
        'record'       => $record,
        'affectedRows' => $stmt->rowCount(),
        'message'      => 'הרשומה עודכנה בהצלחה'
    ], JSON_UNESCAPED_UNICODE);
    break;

        // =============================================
        // DELETE — Delete single record OR bulk delete
        // =============================================
        case 'DELETE':
            // Bulk delete
            if ($isBulk) {
                $stmt = $pdo->query("DELETE FROM `$tableName`");
                echo json_encode([
                    'success'      => true,
                    'affectedRows' => $stmt->rowCount(),
                    'message'      => 'כל הרשומות נמחקו'
                ], JSON_UNESCAPED_UNICODE);
                break;
            }
            
            // Single delete
            if (!$id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error'   => 'חובה לציין ID למחיקה'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM `$tableName` WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode([
                'success'      => true,
                'affectedRows' => $stmt->rowCount(),
                'message'      => 'הרשומה נמחקה בהצלחה'
            ], JSON_UNESCAPED_UNICODE);
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'error'   => 'שיטה לא נתמכת: ' . $method
            ], JSON_UNESCAPED_UNICODE);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success'   => false,
        'error'     => 'שגיאת מסד נתונים',
        'message'   => $e->getMessage(),
        'sql_state' => $e->getCode(),
        'table'     => $tableName,
        'method'    => $method
    ], JSON_UNESCAPED_UNICODE);
}
?>