SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. טבלאות ליבה משלימות (Categories, Periods, Settings)
-- ============================================

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(100) NOT NULL,
  `name_ar` VARCHAR(100) DEFAULT NULL,
  `parent_id` INT UNSIGNED DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT NULL,
  `color` VARCHAR(20) DEFAULT NULL,
  `order_index` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cat_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `periods` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `academic_year` VARCHAR(20) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT DEFAULT NULL,
  `type` ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. טבלאות תוכן וקטלוג (Catalog, Homepage, FAQ, Guides)
-- ============================================

CREATE TABLE IF NOT EXISTS `catalog_entries` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `category_id` INT UNSIGNED DEFAULT NULL,
  `link_url` VARCHAR(500) DEFAULT NULL,
  `file_path` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cat_entry` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `catalog_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `entry_id` INT UNSIGNED NOT NULL,
  `item_name` VARCHAR(100) NOT NULL,
  `item_value` TEXT DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  CONSTRAINT `fk_cat_item_entry` FOREIGN KEY (`entry_id`) REFERENCES `catalog_entries`(`id`) ON DELETE CASCADE,
  INDEX `idx_entry` (`entry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `faq_data` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `question_he` TEXT NOT NULL,
  `question_ar` TEXT DEFAULT NULL,
  `answer_he` TEXT NOT NULL,
  `answer_ar` TEXT DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `order_index` INT DEFAULT 0,
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `guides_repo` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT DEFAULT NULL,
  `author` VARCHAR(100) DEFAULT NULL,
  `version` VARCHAR(20) DEFAULT '1.0',
  `file_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `homepage_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `section_key` VARCHAR(50) NOT NULL UNIQUE,
  `content_json` JSON DEFAULT NULL,
  `is_visible` TINYINT(1) DEFAULT 1,
  `order_index` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `custom_pages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `title_he` VARCHAR(255) NOT NULL,
  `title_ar` VARCHAR(255) DEFAULT NULL,
  `content_he` LONGTEXT DEFAULT NULL,
  `content_ar` LONGTEXT DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. טבלאות תפעוליות (Comments, Instructors, Executors)
-- ============================================

CREATE TABLE IF NOT EXISTS `solution_comments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `solution_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `comment_text` TEXT NOT NULL,
  `rating` TINYINT UNSIGNED DEFAULT NULL,
  `is_approved` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_comment_sol` FOREIGN KEY (`solution_id`) REFERENCES `learning_solutions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_solution` (`solution_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `solution_instructors` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `solution_id` INT UNSIGNED NOT NULL,
  `instructor_name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'מרצה',
  `bio` TEXT DEFAULT NULL,
  `contact_info` VARCHAR(255) DEFAULT NULL,
  CONSTRAINT `fk_inst_sol` FOREIGN KEY (`solution_id`) REFERENCES `learning_solutions`(`id`) ON DELETE CASCADE,
  INDEX `idx_solution` (`solution_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pedagogical_executors` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `organization` VARCHAR(150) DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  INDEX `idx_org` (`organization`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. טבלאות משאבי אנוש (Inspectors, Mentors - הרחבה)
-- ============================================

-- Inspectors (מפקחים) - אם לא קיימת
CREATE TABLE IF NOT EXISTS `inspectors` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `region` VARCHAR(100) DEFAULT NULL,
  `specialization` VARCHAR(100) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mentors (מנטורים) - הרחבה לטבלה הקיימת או יצירה חדשה
-- הערה: אם הטבלה כבר קיימת מהסקריפט הקודם, הפקודה תדלג או תוסיף עמודות חסרות אם צריך
CREATE TABLE IF NOT EXISTS `mentors` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `school_id` INT UNSIGNED DEFAULT NULL, -- אם יש טבלת schools
  `subject` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  INDEX `idx_subject` (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. טבלאות לוג וארכיון (Activity Log, Recycle Bin)
-- ============================================

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `action` VARCHAR(50) NOT NULL,
  `table_name` VARCHAR(50) DEFAULT NULL,
  `record_id` INT UNSIGNED DEFAULT NULL,
  `details` JSON DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_log_user_act` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_action` (`action`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recycle_bin` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `original_table` VARCHAR(50) NOT NULL,
  `original_id` INT UNSIGNED NOT NULL,
  `deleted_data` JSON NOT NULL,
  `deleted_by` INT UNSIGNED DEFAULT NULL,
  `deleted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_table` (`original_table`, `original_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. טבלאות Lookup (גנריות או ספציפיות)
-- ============================================
-- הערה: סקריפט ההמרה יצר טבלאות אלו אוטומטית. 
-- כאן נוודא מבנה אחיד אם הן לא קיימות, או ניצור את החסרות במפורש אם צריך.
-- לדוגמה: lookup_schools, lookup_domains וכו'. 
-- מאחר והסקריפט הקודם יצר אותן דינמית, נסתפק ביצירת תבנית אחידה אם הטבלה לא קיימת.

-- דוגמה ליצירת טבלת Schools אם חסרה (ניתן לשכפל לשאר ה-Lookups אם צריך מבנה ספציפי)
CREATE TABLE IF NOT EXISTS `lookup_schools` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ניתן להוסיף כאן CREATE TABLE לכל אחד מקבצי ה-lookup האחרים אם רוצים מבנה קשיח ולא גנרי.
-- כרגע אנו סומכים על הסקריפט הקודם שיצר אותן, אלא אם כן תבקש אחרת.

SET FOREIGN_KEY_CHECKS = 1;

-- הודעת סיום
SELECT '✅ בניית סכימת מסד נתונים מלאה הושלמה בהצלחה!' AS status_message;