--- create_all_tables.sql (原始)


+++ create_all_tables.sql (修改后)
-- ============================================
-- Matspanet - Complete Database Schema
-- תואם לקבצי JSON במערכת
-- ============================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. USERS - משתמשים (תואם ל-users.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `role` ENUM('admin', 'manager', 'instructor', 'viewer') NOT NULL DEFAULT 'viewer',
  `department` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `last_login` DATETIME DEFAULT NULL,
  `failed_login_attempts` TINYINT DEFAULT 0,
  `locked_until` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. CATEGORIES - קטגוריות (תואם ל-categories.json)
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

-- ============================================
-- 3. SOLUTIONS - פתרונות למידה (תואם ל-solutions.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `learning_solutions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title_he` VARCHAR(255) NOT NULL,
  `title_ar` VARCHAR(255) DEFAULT NULL,
  `description_he` TEXT DEFAULT NULL,
  `description_ar` TEXT DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `subcategory` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('draft', 'pending_approval', 'active', 'paused', 'archived', 'cancelled') DEFAULT 'draft',
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `registration_deadline` DATE DEFAULT NULL,
  `budget_code` VARCHAR(50) DEFAULT NULL,
  `total_hours` DECIMAL(5,2) DEFAULT 0,
  `location` VARCHAR(255) DEFAULT NULL,
  `delivery_mode` ENUM('physical', 'online', 'hybrid') DEFAULT 'physical',
  `instructor_id` INT UNSIGNED DEFAULT NULL,
  `co_instructors` JSON DEFAULT NULL,
  `max_participants` INT DEFAULT 0,
  `current_participants` INT DEFAULT 0,
  `price_per_participant` DECIMAL(10,2) DEFAULT 0,
  `total_budget` DECIMAL(12,2) DEFAULT 0,
  `requirements` TEXT DEFAULT NULL,
  `learning_outcomes` TEXT DEFAULT NULL,
  `materials_url` VARCHAR(500) DEFAULT NULL,
  `certificate_template` VARCHAR(255) DEFAULT NULL,
  `created_by` INT UNSIGNED NOT NULL,
  `approved_by` INT UNSIGNED DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ls_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ls_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,

  INDEX `idx_status` (`status`),
  INDEX `idx_dates` (`start_date`, `end_date`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. GUIDES_REPO - מאגר מדריכים (תואם ל-guides_repo.json)
-- ============================================
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

-- ============================================
-- 5. BUDGETS - תקציבים (תואם ל-budgets.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `solution_id` INT UNSIGNED NOT NULL,
  `fiscal_year` YEAR NOT NULL,
  `budget_category` VARCHAR(100) DEFAULT 'general',
  `allocated_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `spent_amount` DECIMAL(12,2) DEFAULT 0.00,
  `committed_amount` DECIMAL(12,2) DEFAULT 0.00,
  `currency` CHAR(3) DEFAULT 'ILS',
  `cost_center` VARCHAR(50) DEFAULT NULL,
  `approval_status` ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
  `approved_by` INT UNSIGNED DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_budget_solution` FOREIGN KEY (`solution_id`) REFERENCES `learning_solutions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,

  INDEX `idx_year` (`fiscal_year`),
  INDEX `idx_category` (`budget_category`),
  UNIQUE KEY `unique_budget` (`solution_id`, `fiscal_year`, `budget_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. PERIODS - תקופות (תואם ל-periods.json)
-- ============================================
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

-- ============================================
-- 7. SOLUTION_INSTRUCTORS - מרצים לפתרון (תואם ל-solution_instructors.json)
-- ============================================
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

-- ============================================
-- 8. LOOKUP_DOMAINS - תחומים (תואם ל-lookup_domains.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_domains` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. LOOKUP_EDUCATION_STAGES - שלבי חינוך (תואם ל-lookup_education_stages.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_education_stages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. LOOKUP_EDUCATION_TYPES - סוגי חינוך (תואם ל-lookup_education_types.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_education_types` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. LOOKUP_BUDGET_TYPES - סוגי תקציב (תואם ל-lookup_budget_types.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_budget_types` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. LOOKUP_ALLOCATION_STATUS - סטטוס הקצאה (תואם ל-lookup_allocation_status.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_allocation_status` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. LOOKUP_SOLUTION_STATUS - סטטוס פתרון (תואם ל-lookup_solution_status.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_solution_status` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. LOOKUP_PERFORMER_TYPES - סוגי מבצע (תואם ל-lookup_performer_types.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_performer_types` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 15. LOOKUP_LECTURER_STATUS - סטטוס מרצה (תואם ל-lookup_lecturer_status.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_lecturer_status` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 16. LOOKUP_CERTIFIED_LECTURER - מרצים מוסמכים (תואם ל-lookup_certified_lecturer.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_certified_lecturer` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 17. LOOKUP_EXPERT_FIELD - תחומי מומחיות (תואם ל-lookup_expert_field.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_expert_field` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 18. LOOKUP_FIELD_KNOWLEDGE - תחומי ידע (תואם ל-lookup_field_knowledge.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_field_knowledge` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 19. LOOKUP_ROLE_HOLDERS - בעלי תפקידים (תואם ל-lookup_role_holders.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_role_holders` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 20. LOOKUP_BROAD_TOPICS - נושאים רחבים (תואם ל-lookup_broad_topics.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_broad_topics` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21. LOOKUP_DESIGNATED_PROGRAMS - תוכניות ייעודיות (תואם ל-lookup_designated_programs.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_designated_programs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 22. LOOKUP_WEEK_DAYS - ימי שבוע (תואם ל-lookup_week_days.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_week_days` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 23. LOOKUP_MEETING_TYPES - סוגי מפגשים (תואם ל-lookup_meeting_types.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_meeting_types` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 24. LOOKUP_SCHOOLS - בתי ספר (תואם ל-lookup_schools.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_schools` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 25. LOOKUP_RESPONSIBILITY_TYPES - סוגי אחריות (תואם ל-lookup_responsibility_types.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `lookup_responsibility_types` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name_he` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE DEFAULT NULL,
  `extra_data` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 26. SOLUTION_COMMENTS - הערות לפתרון (תואם ל-solution_comments.json)
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

-- ============================================
-- 27. CATALOG_ENTRIES - רשומות קטלוג (תואם ל-catalog_entries.json)
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

-- ============================================
-- 28. CATALOG_ITEMS - פריטי קטלוג (תואם ל-catalog_items.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `catalog_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `entry_id` INT UNSIGNED NOT NULL,
  `item_name` VARCHAR(100) NOT NULL,
  `item_value` TEXT DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  CONSTRAINT `fk_cat_item_entry` FOREIGN KEY (`entry_id`) REFERENCES `catalog_entries`(`id`) ON DELETE CASCADE,
  INDEX `idx_entry` (`entry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 29. REGISTRATIONS - רישומים (תואם ל-registrations.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `registrations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `solution_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `registration_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `registration_source` ENUM('web', 'api', 'admin', 'import') DEFAULT 'web',
  `attendance_status` ENUM('registered', 'confirmed', 'waitlisted', 'attended', 'absent', 'dropped', 'cancelled') DEFAULT 'registered',
  `registration_notes` TEXT DEFAULT NULL,
  `grade` DECIMAL(5,2) DEFAULT NULL,
  `feedback_score` TINYINT DEFAULT NULL,
  `feedback_comments` TEXT DEFAULT NULL,
  `certificate_issued` TINYINT(1) DEFAULT 0,
  `certificate_number` VARCHAR(50) DEFAULT NULL,
  `certificate_issued_at` DATETIME DEFAULT NULL,
  `payment_status` ENUM('not_required', 'pending', 'paid', 'refunded', 'exempt') DEFAULT 'not_required',
  `payment_amount` DECIMAL(10,2) DEFAULT 0,
  `payment_date` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_reg_solution` FOREIGN KEY (`solution_id`) REFERENCES `learning_solutions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reg_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_registration` (`solution_id`, `user_id`),
  INDEX `idx_attendance` (`attendance_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 30. SETTINGS - הגדרות מערכת (תואם ל-settings.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT DEFAULT NULL,
  `setting_type` ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  `category` VARCHAR(50) DEFAULT 'general',
  `description_he` VARCHAR(255) DEFAULT NULL,
  `is_public` TINYINT(1) DEFAULT 0,
  `last_updated_by` INT UNSIGNED DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_settings_user` FOREIGN KEY (`last_updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 31. ACTIVITY_LOG - יומן פעילות (תואם ל-activity_log.json)
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

-- ============================================
-- 32. RECYCLE_BIN - מחזור (תואם ל-recycle_bin.json)
-- ============================================
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
-- 33. INSPECTORS - מפקחים (תואם ל-inspectors.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `inspectors` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `region` VARCHAR(100) DEFAULT NULL,
  `specialization` VARCHAR(100) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 34. PEDAGOGICAL_EXECUTORS - מנחים פדגוגיים (תואם ל-pedagogical_executors.json)
-- ============================================
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
-- 35. MENTORS - מנטורים (תואם ל-mentors.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `mentors` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `school_id` INT UNSIGNED DEFAULT NULL,
  `subject` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  INDEX `idx_subject` (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 36. SESSIONS - ניהול סשנים (לצורך התחברות)
-- ============================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(128) PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_valid` TINYINT(1) DEFAULT 1,
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_expires` (`expires_at`),
  INDEX `idx_valid` (`is_valid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 37. FAQ_DATA - שאלות נפוצות (תואם ל-faq_data.json)
-- ============================================
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

-- ============================================
-- 38. HOMEPAGE_SETTINGS - הגדרות דף הבית (תואם ל-homepage.json)
-- ============================================
CREATE TABLE IF NOT EXISTS `homepage_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `section_key` VARCHAR(50) NOT NULL UNIQUE,
  `content_json` JSON DEFAULT NULL,
  `is_visible` TINYINT(1) DEFAULT 1,
  `order_index` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 39. CUSTOM_PAGES - דפים מותאמים אישית (תואם ל-custom_pages.json)
-- ============================================
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
-- INSERT DEFAULT DATA - נתוני התחלה
-- ============================================

-- משתמש admin ברירת מחדל (סיסמה: admin123)
-- חשוב לשנות סיסמה זו מיד לאחר ההתחברות הראשונה!
INSERT INTO `users` (`username`, `password_hash`, `full_name`, `email`, `role`, `department`, `is_active`)
VALUES ('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'מנהל מערכת', 'admin@matspanet.gov.il', 'admin', 'מנהל', 1)
ON DUPLICATE KEY UPDATE `username`=`username`;

-- הגדרות מערכת בסיסיות
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `category`, `description_he`) VALUES
('system_name_he', 'מצפן נט', 'string', 'general', 'שם המערכת בעברית'),
('system_name_ar', 'بوصلة نت', 'string', 'general', 'שם המערכת בערבית'),
('max_login_attempts', '5', 'number', 'security', 'מקסימום ניסיונות כניסה כושלים לפני נעילה'),
('lockout_duration_minutes', '15', 'number', 'security', 'משך נעילה בדקות'),
('session_timeout_minutes', '30', 'number', 'security', 'פג תוקף סשן בדקות'),
('default_language', 'he', 'string', 'general', 'שפת ברירת מחדל'),
('maintenance_mode', 'false', 'boolean', 'system', 'מצב תחזוקה')
ON DUPLICATE KEY UPDATE `setting_key`=`setting_key`;

-- סיסמה מוצפנת ל-admin: admin123
-- SHA256 של "admin123" = 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918

SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ בניית כל הטבלאות הושלמה בהצלחה!' AS status_message;