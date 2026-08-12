-- ============================================
-- Matspanet Database Schema
-- Database: ejpisgaorg_matspanet_main
-- User: ejpisgaorg_matspanet_app
-- Character Set: utf8mb4 (Hebrew/Arabic support)
-- ============================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- --------------------------------------------
-- 1. USERS TABLE - משתמשי מערכת
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT 'שם משתמש לכניסה',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'bcrypt/Argon2 hash - NEVER plain text',
  `full_name` VARCHAR(100) NOT NULL COMMENT 'שם מלא בעברית/ערבית',
  `email` VARCHAR(100) NOT NULL UNIQUE COMMENT 'דואר אלקטרוני',
  `role` ENUM('admin', 'manager', 'instructor', 'viewer') NOT NULL DEFAULT 'viewer' COMMENT 'תפקיד במערכת',
  `department` VARCHAR(100) DEFAULT NULL COMMENT 'מחלקה/אגף',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT 'מספר טלפון',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '1=פעיל, 0=חסום',
  `last_login` DATETIME DEFAULT NULL COMMENT 'כניסה אחרונה',
  `failed_login_attempts` TINYINT DEFAULT 0 COMMENT 'ניסיונות כניסה כושלים (לאבטחה)',
  `locked_until` DATETIME DEFAULT NULL COMMENT 'נעול עד תאריך (לאבטחה)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='טבלת משתמשי המערכת עם הרשאות ואבטחה';
-- --------------------------------------------
-- 2. LEARNING SOLUTIONS - פתרונות למידה והשתלמויות
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_solutions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title_he` VARCHAR(255) NOT NULL COMMENT 'שם הפתרון בעברית',
  `title_ar` VARCHAR(255) DEFAULT NULL COMMENT 'שם הפתרון בערבית',
  `description_he` TEXT DEFAULT NULL COMMENT 'תיאור בעברית',
  `description_ar` TEXT DEFAULT NULL COMMENT 'תיאור בערבית',
  `category` VARCHAR(100) DEFAULT NULL COMMENT 'קטגוריה: טכנולוגיה, מנהיגות, פדגוגיה וכו',
  `subcategory` VARCHAR(100) DEFAULT NULL COMMENT 'תת-קטגוריה',
  `status` ENUM('draft', 'pending_approval', 'active', 'paused', 'archived', 'cancelled') DEFAULT 'draft' COMMENT 'סטטוס הפתרון',
  `start_date` DATE DEFAULT NULL COMMENT 'תאריך התחלה',
  `end_date` DATE DEFAULT NULL COMMENT 'תאריך סיום',
  `registration_deadline` DATE DEFAULT NULL COMMENT 'מועד אחרון להרשמה',
  `budget_code` VARCHAR(50) DEFAULT NULL COMMENT 'קוד תקציבי',
  `total_hours` DECIMAL(5,2) DEFAULT 0 COMMENT 'סהכ שעות השתלמות',
  `location` VARCHAR(255) DEFAULT NULL COMMENT 'מיקום פיזי או מקוון',
  `delivery_mode` ENUM('physical', 'online', 'hybrid') DEFAULT 'physical' COMMENT 'אופן העברה',
  `instructor_id` INT UNSIGNED DEFAULT NULL COMMENT 'מרצה אחראי',
  `co_instructors` JSON DEFAULT NULL COMMENT 'מרצים נוספים (JSON array)',
  `max_participants` INT DEFAULT 0 COMMENT 'מספר משתתפים מקסימלי',
  `current_participants` INT DEFAULT 0 COMMENT 'מספר משתתפים נוכחי (מאוטר)',
  `price_per_participant` DECIMAL(10,2) DEFAULT 0 COMMENT 'מחיר למשתתף',
  `total_budget` DECIMAL(12,2) DEFAULT 0 COMMENT 'תקציב כולל',
  `requirements` TEXT DEFAULT NULL COMMENT 'דרישות קדם',
  `learning_outcomes` TEXT DEFAULT NULL COMMENT 'תוצרי למידה',
  `materials_url` VARCHAR(500) DEFAULT NULL COMMENT 'קישור לחומרי למידה',
  `certificate_template` VARCHAR(255) DEFAULT NULL COMMENT 'תבנית תעודה',
  `created_by` INT UNSIGNED NOT NULL COMMENT 'יוצר הפתרון',
  `approved_by` INT UNSIGNED DEFAULT NULL COMMENT 'מאשר הפתרון',
  `approved_at` DATETIME DEFAULT NULL COMMENT 'תאריך אישור',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ls_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ls_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ls_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  
  INDEX `idx_status` (`status`),
  INDEX `idx_dates` (`start_date`, `end_date`),
  INDEX `idx_category` (`category`),
  INDEX `idx_delivery` (`delivery_mode`),
  INDEX `idx_instructor` (`instructor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='טבלת פתרונות למידה והשתלמויות';
-- --------------------------------------------
-- 3. REGISTRATIONS - רישומים והשתתפות
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `registrations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `solution_id` INT UNSIGNED NOT NULL COMMENT 'מזהה פתרון למידה',
  `user_id` INT UNSIGNED NOT NULL COMMENT 'מזהה משתמש נרשם',
  `registration_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'תאריך הרשמה',
  `registration_source` ENUM('web', 'api', 'admin', 'import') DEFAULT 'web' COMMENT 'מקור ההרשמה',
  `attendance_status` ENUM('registered', 'confirmed', 'waitlisted', 'attended', 'absent', 'dropped', 'cancelled') DEFAULT 'registered' COMMENT 'סטטוס נוכחות',
  `registration_notes` TEXT DEFAULT NULL COMMENT 'הערות הרשמה',
  `grade` DECIMAL(5,2) DEFAULT NULL COMMENT 'ציון סופי (אם רלוונטי)',
  `feedback_score` TINYINT DEFAULT NULL COMMENT 'דירוג המשתתף (1-5)',
  `feedback_comments` TEXT DEFAULT NULL COMMENT 'משוב המשתתף',
  `certificate_issued` TINYINT(1) DEFAULT 0 COMMENT 'האם הונפקה תעודה',
  `certificate_number` VARCHAR(50) DEFAULT NULL COMMENT 'מספר תעודה ייחודי',
  `certificate_issued_at` DATETIME DEFAULT NULL COMMENT 'תאריך הנפקת תעודה',
  `payment_status` ENUM('not_required', 'pending', 'paid', 'refunded', 'exempt') DEFAULT 'not_required',
  `payment_amount` DECIMAL(10,2) DEFAULT 0,
  `payment_date` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_reg_solution` FOREIGN KEY (`solution_id`) REFERENCES `learning_solutions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reg_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  
  UNIQUE KEY `unique_registration` (`solution_id`, `user_id`),
  INDEX `idx_attendance` (`attendance_status`),
  INDEX `idx_payment` (`payment_status`),
  INDEX `idx_certificate` (`certificate_issued`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='טבלת רישומים והשתתפות בהשתלמויות';
-- --------------------------------------------
-- 4. BUDGETS - תקציבים ומעקב הוצאות
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `solution_id` INT UNSIGNED NOT NULL COMMENT 'מזהה פתרון קשור',
  `fiscal_year` YEAR NOT NULL COMMENT 'שנת תקציב',
  `budget_category` VARCHAR(100) DEFAULT 'general' COMMENT 'קטגוריית תקציב',
  `allocated_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'סכום שהוקצה',
  `spent_amount` DECIMAL(12,2) DEFAULT 0.00 COMMENT 'סכום שהוצא',
  `committed_amount` DECIMAL(12,2) DEFAULT 0.00 COMMENT 'סכום מחויב (טרם שולם)',
  `available_amount` DECIMAL(12,2) GENERATED ALWAYS AS (allocated_amount - spent_amount - committed_amount) STORED COMMENT 'סכום זמין (מחושב)',
  `currency` CHAR(3) DEFAULT 'ILS' COMMENT 'מטבע',
  `cost_center` VARCHAR(50) DEFAULT NULL COMMENT 'מרכז עלות',
  `approval_status` ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
  `approved_by` INT UNSIGNED DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_budget_solution` FOREIGN KEY (`solution_id`) REFERENCES `learning_solutions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  
  INDEX `idx_year` (`fiscal_year`),
  INDEX `idx_category` (`budget_category`),
  INDEX `idx_status` (`approval_status`),
  UNIQUE KEY `unique_budget` (`solution_id`, `fiscal_year`, `budget_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='טבלת תקציבים ומעקב הוצאות';
-- --------------------------------------------
-- 5. BUDGET TRANSACTIONS - תנועות תקציביות
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `budget_transactions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `budget_id` INT UNSIGNED NOT NULL COMMENT 'מזהה תקציב קשור',
  `transaction_type` ENUM('allocation', 'expense', 'commitment', 'release', 'refund') NOT NULL COMMENT 'סוג תנועה',
  `amount` DECIMAL(12,2) NOT NULL COMMENT 'סכום התנועה',
  `balance_after` DECIMAL(12,2) DEFAULT NULL COMMENT 'יתרה לאחר התנועה',
  `description` VARCHAR(255) NOT NULL COMMENT 'תיאור התנועה',
  `reference_number` VARCHAR(100) DEFAULT NULL COMMENT 'מספר אסמכתא',
  `vendor_name` VARCHAR(255) DEFAULT NULL COMMENT 'שם ספק',
  `invoice_number` VARCHAR(100) DEFAULT NULL COMMENT 'מספר חשבונית',
  `transaction_date` DATE NOT NULL COMMENT 'תאריך ביצוע',
  `created_by` INT UNSIGNED NOT NULL COMMENT 'יוצר התנועה',
  `approved_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_trans_budget` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trans_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_trans_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  
  INDEX `idx_type` (`transaction_type`),
  INDEX `idx_date` (`transaction_date`),
  INDEX `idx_budget` (`budget_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='טבלת תנועות תקציביות מפורטות';
-- --------------------------------------------
-- 6. INSTRUCTORS - מאגר מרצים וספקים
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `instructors` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED DEFAULT NULL COMMENT 'קישור למשתמש אם קיים',
  `full_name_he` VARCHAR(255) NOT NULL COMMENT 'שם מלא בעברית',
  `full_name_ar` VARCHAR(255) DEFAULT NULL COMMENT 'שם מלא בערבית',
  `company_name` VARCHAR(255) DEFAULT NULL COMMENT 'שם חברה/עסק',
  `expertise_areas` JSON DEFAULT NULL COMMENT 'תחומי התמחות (JSON array)',
  `bio_he` TEXT DEFAULT NULL COMMENT 'ביוגרפיה בעברית',
  `bio_ar` TEXT DEFAULT NULL COMMENT 'ביוגרפיה בערבית',
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `hourly_rate` DECIMAL(10,2) DEFAULT 0 COMMENT 'תעריף לשעה',
  `rating_avg` DECIMAL(3,2) DEFAULT 0 COMMENT 'דירוג ממוצע',
  `total_courses` INT DEFAULT 0 COMMENT 'סהכ קורסים שהועברו',
  `is_approved` TINYINT(1) DEFAULT 0 COMMENT 'מאושר ללימוד',
  `documents` JSON DEFAULT NULL COMMENT 'מסמכים מצורפים (תעודות, קורות חיים)',
  `bank_details_encrypted` TEXT DEFAULT NULL COMMENT 'פרטי בנק מוצפנים',
  `tax_id` VARCHAR(50) DEFAULT NULL COMMENT 'ח.פ./ע.מ.',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_inst_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  
  INDEX `idx_approved` (`is_approved`),
  INDEX `idx_rating` (`rating_avg`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='מאגר מרצים וספקי הדרכה חיצוניים';
-- --------------------------------------------
-- 7. AUDIT LOGS - יומני רישום לאבטחה
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED DEFAULT NULL COMMENT 'מבצע הפעולה',
  `action_type` VARCHAR(50) NOT NULL COMMENT 'סוג פעולה: LOGIN, CREATE, UPDATE, DELETE, EXPORT',
  `table_name` VARCHAR(50) DEFAULT NULL COMMENT 'טבלה מושפעת',
  `record_id` INT UNSIGNED DEFAULT NULL COMMENT 'מזהה רשומה',
  `action_details` JSON DEFAULT NULL COMMENT 'פרטי הפעולה ב-JSON',
  `old_values` JSON DEFAULT NULL COMMENT 'ערכים קודמים (לעדכון/מחיקה)',
  `new_values` JSON DEFAULT NULL COMMENT 'ערכים חדשים (ליצירה/עדכון)',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'כתובת IP',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT 'דפדפן/מכשיר',
  `session_id` VARCHAR(100) DEFAULT NULL,
  `request_method` VARCHAR(10) DEFAULT NULL COMMENT 'GET/POST/PUT/DELETE',
  `request_url` VARCHAR(500) DEFAULT NULL,
  `response_status` SMALLINT DEFAULT NULL COMMENT 'קוד תגובה HTTP',
  `execution_time_ms` INT DEFAULT NULL COMMENT 'זמן ביצוע במילישניות',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  
  INDEX `idx_action` (`action_type`),
  INDEX `idx_created` (`created_at`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_table` (`table_name`),
  INDEX `idx_ip` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='יומן רישום מלא של כל פעולות המערכת לאבטחה וביקורת';
-- --------------------------------------------
-- 8. SESSIONS MANAGEMENT - ניהול סשנים
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(128) PRIMARY KEY COMMENT 'Session ID (JWT JTI or random token)',
  `user_id` INT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL COMMENT 'Hash of session token',
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `expires_at` DATETIME NOT NULL COMMENT 'תאריך תפוגה',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_valid` TINYINT(1) DEFAULT 1,
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  
  INDEX `idx_user` (`user_id`),
  INDEX `idx_expires` (`expires_at`),
  INDEX `idx_valid` (`is_valid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='ניהול סשנים פעילים למשתמשים';
-- --------------------------------------------
-- 9. NOTIFICATIONS - התראות והודעות
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `notification_type` ENUM('info', 'success', 'warning', 'error', 'system') DEFAULT 'info',
  `title_he` VARCHAR(255) NOT NULL,
  `title_ar` VARCHAR(255) DEFAULT NULL,
  `message_he` TEXT NOT NULL,
  `message_ar` TEXT DEFAULT NULL,
  `action_url` VARCHAR(500) DEFAULT NULL COMMENT 'קישור לפעולה',
  `is_read` TINYINT(1) DEFAULT 0,
  `read_at` DATETIME DEFAULT NULL,
  `expires_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  
  INDEX `idx_user_read` (`user_id`, `is_read`),
  INDEX `idx_type` (`notification_type`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='מערכת התראות והודעות למשתמשים';
-- --------------------------------------------
-- 10. SYSTEM SETTINGS - הגדרות מערכת
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE COMMENT 'מפתח הגדרה',
  `setting_value` TEXT DEFAULT NULL COMMENT 'ערך הגדרה (JSON או טקסט)',
  `setting_type` ENUM('string', 'number', 'boolean', 'json', 'encrypted') DEFAULT 'string',
  `category` VARCHAR(50) DEFAULT 'general' COMMENT 'קטגוריית הגדרה',
  `description_he` VARCHAR(255) DEFAULT NULL,
  `description_ar` VARCHAR(255) DEFAULT NULL,
  `is_public` TINYINT(1) DEFAULT 0 COMMENT 'נגיש לכל המשתמשים',
  `last_updated_by` INT UNSIGNED DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_setting_updater` FOREIGN KEY (`last_updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  
  INDEX `idx_category` (`category`),
  INDEX `idx_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='הגדרות מערכת גלובליות';
-- --------------------------------------------
-- 11. FILE UPLOADS - ניהול קבצים מצורפים
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `file_uploads` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `entity_type` VARCHAR(50) NOT NULL COMMENT 'סוג ישות: solution, user, budget, etc',
  `entity_id` INT UNSIGNED NOT NULL COMMENT 'מזהה הישות',
  `file_name_original` VARCHAR(255) NOT NULL COMMENT 'שם קובץ מקורי',
  `file_name_stored` VARCHAR(255) NOT NULL COMMENT 'שם קובץ מאוחסן',
  `file_path` VARCHAR(500) NOT NULL COMMENT 'נתיב אחסון',
  `file_size` BIGINT DEFAULT 0 COMMENT 'גודל בקבוצים',
  `mime_type` VARCHAR(100) DEFAULT NULL,
  `uploaded_by` INT UNSIGNED NOT NULL,
  `download_count` INT DEFAULT 0,
  `is_public` TINYINT(1) DEFAULT 0,
  `virus_scan_status` ENUM('pending', 'clean', 'infected', 'error') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_file_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  
  INDEX `idx_entity` (`entity_type`, `entity_id`),
  INDEX `idx_uploader` (`uploaded_by`),
  INDEX `idx_virus` (`virus_scan_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='ניהול קבצים מצורפים במערכת';
-- --------------------------------------------
-- INSERT DEFAULT DATA - נתוני התחלה
-- --------------------------------------------
-- Insert default admin user (PASSWORD MUST BE CHANGED IMMEDIATELY)
-- Default password: ChangeMe123! (must be hashed with bcrypt before use)
-- This is a PLACEHOLDER - you MUST generate proper hash in Python/PHP
INSERT INTO `users` (`username`, `password_hash`, `full_name`, `email`, `role`, `department`, `is_active`) 
VALUES ('admin', '$2y$10$PLACEHOLDER_REPLACE_WITH_BCRYPT_HASH', 'מנהל מערכת', 'admin@matspanet.gov.il', 'admin', 'מנהל', 1)
ON DUPLICATE KEY UPDATE `username`=`username`;
-- Insert system settings defaults
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `category`, `description_he`) VALUES
('system_name_he', 'מצפן נט', 'string', 'general', 'שם המערכת בעברית'),
('system_name_ar', 'بوصلة نت', 'string', 'general', 'שם המערכת בערבית'),
('max_login_attempts', '5', 'number', 'security', 'מקסימום ניסיונות כניסה כושלים לפני נעילה'),
('lockout_duration_minutes', '15', 'number', 'security', 'משך נעילה בדקות'),
('session_timeout_minutes', '30', 'number', 'security', 'פג תוקף סשן בדקות'),
('password_min_length', '8', 'number', 'security', 'אורך מינימלי לסיסמה'),
('require_password_complexity', 'true', 'boolean', 'security', 'חייב סיסמה מורכבת'),
('default_language', 'he', 'string', 'general', 'שפת ברירת מחדל'),
('maintenance_mode', 'false', 'boolean', 'system', 'מצב תחזוקה'),
('allow_registration', 'false', 'boolean', 'general', 'אפשר הרשמה עצמית')
ON DUPLICATE KEY UPDATE `setting_key`=`setting_key`;
-- --------------------------------------------
-- VIEWS FOR ANALYTICS - תצוגות לניתוח נתונים
-- --------------------------------------------
-- View: Active Solutions Summary
CREATE OR REPLACE VIEW `view_active_solutions_summary` AS
SELECT 
    ls.id,
    ls.title_he,
    ls.title_ar,
    ls.category,
    ls.status,
    ls.start_date,
    ls.end_date,
    ls.max_participants,
    ls.current_participants,
    (ls.max_participants - ls.current_participants) as available_spots,
    ROUND((ls.current_participants * 100.0 / NULLIF(ls.max_participants, 0)), 2) as occupancy_rate,
    u.full_name as instructor_name,
    b.allocated_amount as budget_allocated,
    b.spent_amount as budget_spent
FROM learning_solutions ls
LEFT JOIN users u ON ls.instructor_id = u.id
LEFT JOIN budgets b ON ls.id = b.solution_id AND b.fiscal_year = YEAR(CURDATE())
WHERE ls.status = 'active';
-- View: User Activity Summary
CREATE OR REPLACE VIEW `view_user_activity_summary` AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    u.role,
    u.department,
    COUNT(DISTINCT r.solution_id) as total_registrations,
    SUM(CASE WHEN r.attendance_status = 'attended' THEN 1 ELSE 0 END) as attended_count,
    SUM(CASE WHEN r.certificate_issued = 1 THEN 1 ELSE 0 END) as certificates_count,
    AVG(r.feedback_score) as avg_feedback_score,
    MAX(r.registration_date) as last_registration,
    u.last_login
FROM users u
LEFT JOIN registrations r ON u.id = r.user_id
WHERE u.is_active = 1
GROUP BY u.id, u.username, u.full_name, u.role, u.department, u.last_login;
-- View: Budget Overview by Year
CREATE OR REPLACE VIEW `view_budget_overview` AS
SELECT 
    fiscal_year,
    budget_category,
    COUNT(*) as total_budgets,
    SUM(allocated_amount) as total_allocated,
    SUM(spent_amount) as total_spent,
    SUM(committed_amount) as total_committed,
    SUM(allocated_amount - spent_amount - committed_amount) as total_available,
    ROUND((SUM(spent_amount) * 100.0 / NULLIF(SUM(allocated_amount), 0)), 2) as spending_percentage
FROM budgets
GROUP BY fiscal_year, budget_category
ORDER BY fiscal_year DESC, budget_category;
-- --------------------------------------------
-- TRIGGERS FOR DATA INTEGRITY
-- --------------------------------------------
-- Trigger: Update current_participants on registration
DELIMITER $$
CREATE TRIGGER `trg_update_participants_on_register`
AFTER INSERT ON registrations
FOR EACH ROW
BEGIN
    UPDATE learning_solutions 
    SET current_participants = current_participants + 1
    WHERE id = NEW.solution_id;
END$$
DELIMITER ;
-- Trigger: Update current_participants on cancellation
DELIMITER $$
CREATE TRIGGER `trg_update_participants_on_cancel`
AFTER UPDATE ON registrations
FOR EACH ROW
BEGIN
    IF OLD.attendance_status IN ('registered', 'confirmed', 'waitlisted') 
       AND NEW.attendance_status IN ('dropped', 'cancelled', 'absent') THEN
        UPDATE learning_solutions 
        SET current_participants = current_participants - 1
        WHERE id = NEW.solution_id;
    END IF;
END$$
DELIMITER ;
-- Trigger: Auto-update budget spent_amount from transactions
DELIMITER $$
CREATE TRIGGER `trg_update_budget_spent`
AFTER INSERT ON budget_transactions
FOR EACH ROW
BEGIN
    IF NEW.transaction_type IN ('expense', 'commitment') THEN
        UPDATE budgets 
        SET spent_amount = spent_amount + NEW.amount
        WHERE id = NEW.budget_id;
    END IF;
END$$
DELIMITER ;
SET FOREIGN_KEY_CHECKS = 1;
-- ============================================
-- END OF SCHEMA
-- ============================================