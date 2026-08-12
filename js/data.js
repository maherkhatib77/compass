/**
 * ============================================================================
 * מצפן נט - מודול ניהול נתונים (Data Management Layer)
 * ============================================================================
 * מנהל את כל הנתונים באמצעות localStorage עם אחסון JSON.
 * כל המפתחות מקבלים את הקידומת 'matspanet_'.
 *
 * חנויות נתונים (Data Stores):
 *   USERS, CATEGORIES, SOLUTIONS, MENTORS, GUIDES_REPO, BUDGETS,
 *   PERIODS, SOLUTION_INSTRUCTORS, SOLUTION_COMMENTS,
 *   REGISTRATIONS, SETTINGS, SESSION
 *
 * טבלאות עזר (Lookup Tables):
 *   LOOKUP_DOMAINS, LOOKUP_EDUCATION_STAGES, LOOKUP_EDUCATION_TYPES,
 *   LOOKUP_BUDGET_TYPES, LOOKUP_ALLOCATION_STATUS, LOOKUP_SOLUTION_STATUS,
 *   LOOKUP_PERFORMER_TYPES, LOOKUP_LECTURER_STATUS,
 *   LOOKUP_FIELD_KNOWLEDGE, LOOKUP_ROLE_HOLDERS, LOOKUP_BROAD_TOPICS,
 *   LOOKUP_DESIGNATED_PROGRAMS, LOOKUP_WEEK_DAYS, LOOKUP_MEETING_TYPES
 *
 * אתחול:
 *   המודול מנסה לטעון נתונים מקבצי JSON ב-/data/.
 *   אם הטעינה מצליחה, הנתונים משמשים כמקור הנתונים הראשוני.
 *   אם הטעינה נכשלת, נעשה שימוש בנתוני ברירת המחדל המובנים.
 *   DataStore.init() מחזיר Promise כך שניתן להמתין לסיומו.
 * ============================================================================
 */

const DataStore = (() => {

    // ======================== מפתחות אחסון (Storage Keys) ========================
    const STORAGE_PREFIX = 'matspanet_';

    const KEYS = {
        USERS:                   'users',
        CATEGORIES:              'categories',
        SOLUTIONS:                'solutions',
        MENTORS:                 'mentors',
        GUIDES_REPO:             'guides_repo',
        BUDGETS:                 'budgets',
        PERIODS:                 'periods',
        INSTITUTIONS:            'institutions',
        SOLUTION_INSTRUCTORS:    'solution_instructors',
        LOOKUP_DOMAINS:          'lookup_domains',
        LOOKUP_EDUCATION_STAGES: 'lookup_education_stages',
        LOOKUP_EDUCATION_TYPES:  'lookup_education_types',
        LOOKUP_BUDGET_TYPES:     'lookup_budget_types',
        LOOKUP_ALLOCATION_STATUS:'lookup_allocation_status',
        LOOKUP_SOLUTION_STATUS:  'lookup_solution_status',
        LOOKUP_PERFORMER_TYPES:  'lookup_performer_types',
        LOOKUP_LECTURER_STATUS:  'lookup_lecturer_status',
        LOOKUP_CERTIFIED_LECTURER: 'lookup_certified_lecturer',
        LOOKUP_EXPERT_FIELD:     'lookup_expert_field',
        LOOKUP_FIELD_KNOWLEDGE:  'lookup_field_knowledge',
        LOOKUP_ROLE_HOLDERS:     'lookup_role_holders',
        LOOKUP_BROAD_TOPICS:     'lookup_broad_topics',
        LOOKUP_DESIGNATED_PROGRAMS: 'lookup_designated_programs',
        LOOKUP_WEEK_DAYS:       'lookup_week_days',
        LOOKUP_MEETING_TYPES:   'lookup_meeting_types',
        LOOKUP_SCHOOLS:          'lookup_schools',
        SOLUTION_COMMENTS:      'solution_comments',
        CATALOG_ENTRIES:         'catalog_entries',
        CATALOG_ITEMS:           'catalog_items',
        REGISTRATIONS:           'registrations',
        SETTINGS:                'settings',
        SESSION:                 'session',
        ACTIVITY_LOG:            'activity_log',
        RECYCLE_BIN:             'recycle_bin',
        INSPECTORS:              'inspectors',
        PEDAGOGICAL_EXECUTORS:   'pedagogical_executors',
        LOOKUP_RESPONSIBILITY_TYPES: 'lookup_responsibility_types',
        HOMEPAGE:                'homepage',
        FAQ_DATA:                'faq_data',
        CUSTOM_PAGES:            'custom_pages'
    };

    // מיפוי מפתח → שם קובץ JSON
    const KEY_TO_FILE = {
        [KEYS.USERS]:                   'users.json',
        [KEYS.CATEGORIES]:              'categories.json',
        [KEYS.SOLUTIONS]:                'solutions.json',
        // [KEYS.MENTORS]:                 'mentors.json', // הוסר - הקובץ גדול מדי ל-localStorage (5.6MB)
        [KEYS.GUIDES_REPO]:             'guides_repo.json',
        [KEYS.BUDGETS]:                 'budgets.json',
        [KEYS.PERIODS]:                 'periods.json',
        [KEYS.SOLUTION_INSTRUCTORS]:    'solution_instructors.json',
        [KEYS.LOOKUP_DOMAINS]:          'lookup_domains.json',
        [KEYS.LOOKUP_EDUCATION_STAGES]: 'lookup_education_stages.json',
        [KEYS.LOOKUP_EDUCATION_TYPES]:  'lookup_education_types.json',
        [KEYS.LOOKUP_BUDGET_TYPES]:     'lookup_budget_types.json',
        [KEYS.LOOKUP_ALLOCATION_STATUS]:'lookup_allocation_status.json',
        [KEYS.LOOKUP_SOLUTION_STATUS]:  'lookup_solution_status.json',
        [KEYS.LOOKUP_PERFORMER_TYPES]:  'lookup_performer_types.json',
        [KEYS.LOOKUP_LECTURER_STATUS]:  'lookup_lecturer_status.json',
        [KEYS.LOOKUP_CERTIFIED_LECTURER]: 'lookup_certified_lecturer.json',
        [KEYS.LOOKUP_EXPERT_FIELD]:     'lookup_expert_field.json',
        [KEYS.LOOKUP_FIELD_KNOWLEDGE]:  'lookup_field_knowledge.json',
        [KEYS.LOOKUP_ROLE_HOLDERS]:     'lookup_role_holders.json',
        [KEYS.LOOKUP_BROAD_TOPICS]:     'lookup_broad_topics.json',
        [KEYS.LOOKUP_DESIGNATED_PROGRAMS]: 'lookup_designated_programs.json',
        [KEYS.LOOKUP_WEEK_DAYS]:       'lookup_week_days.json',
        [KEYS.LOOKUP_MEETING_TYPES]:   'lookup_meeting_types.json',
        [KEYS.LOOKUP_SCHOOLS]:          'lookup_schools.json',
        // [KEYS.INSTITUTIONS]:            'institutions.json', // הוסר - קובץ לא קיים, גורם לשגיאת 404
        [KEYS.SOLUTION_COMMENTS]:      'solution_comments.json',
        [KEYS.CATALOG_ENTRIES]:         'catalog_entries.json',
        [KEYS.CATALOG_ITEMS]:           'catalog_items.json',
        [KEYS.REGISTRATIONS]:           'registrations.json',
        [KEYS.SETTINGS]:                'settings.json',
        [KEYS.ACTIVITY_LOG]:            'activity_log.json',
        [KEYS.RECYCLE_BIN]:             'recycle_bin.json',
        [KEYS.INSPECTORS]:              'inspectors.json',
        [KEYS.PEDAGOGICAL_EXECUTORS]:   'pedagogical_executors.json',
        [KEYS.LOOKUP_RESPONSIBILITY_TYPES]: 'lookup_responsibility_types.json',
        [KEYS.HOMEPAGE]: 'homepage.json',
        [KEYS.FAQ_DATA]: 'faq_data.json',
        [KEYS.CUSTOM_PAGES]: 'custom_pages.json'
    };

    // מיפוי מפתח → שם טבלה במסד הנתונים
    const KEY_TO_TABLE = {
        [KEYS.USERS]:                   'users',
        [KEYS.CATEGORIES]:              'learning_solutions',
        [KEYS.SOLUTIONS]:               'learning_solutions',
        [KEYS.GUIDES_REPO]:             'instructors',
        [KEYS.BUDGETS]:                 'budgets',
        [KEYS.PERIODS]:                 'system_settings',
        [KEYS.SOLUTION_INSTRUCTORS]:    'instructors',
        [KEYS.SOLUTION_COMMENTS]:       'audit_logs',
        [KEYS.CATALOG_ENTRIES]:         'file_uploads',
        [KEYS.CATALOG_ITEMS]:           'file_uploads',
        [KEYS.REGISTRATIONS]:           'registrations',
        [KEYS.SETTINGS]:                'system_settings',
        [KEYS.ACTIVITY_LOG]:            'audit_logs',
        [KEYS.RECYCLE_BIN]:             'audit_logs',
        [KEYS.INSPECTORS]:              'users',
        [KEYS.PEDAGOGICAL_EXECUTORS]:   'users',
        [KEYS.HOMEPAGE]:                'system_settings',
        [KEYS.FAQ_DATA]:                'system_settings',
        [KEYS.CUSTOM_PAGES]:            'system_settings'
    };

    // ======================== מיפוי שנים עבריות (Hebrew Year Mapping) ========================
    const HEBREW_YEARS = {
        'תשפ"ד': '2023-2024',
        'תשפ"ה': '2024-2025',
        'תשפ"ו': '2025-2026',
        'תשפ"ז': '2026-2027',
        'תשפ"ח': '2027-2028'
    };

    // ======================== פונקציות עזר (Utility Functions) ========================

    /**
     * מייצר מזהה ייחודי (UUID-like)
     * @returns {string} מזהה ייחודי
     */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * מחזיר את מפתח האחסון המלא עם קידומת
     * @param {string} key - מפתח בסיסי
     * @returns {string} מפתח מלא עם קידומת
     */
    function getKey(key) {
        return STORAGE_PREFIX + key;
    }

    /**
     * מחזיר את שנת לועזית מתוך שנה עברית (אוטומטי)
     * @param {string} hebrewYear - שנה עברית (למשל 'תשפ"ה')
     * @returns {string} שנה לועזית (למשל '2024-2025') או מחרוזת ריקה
     */
    function getEnglishYear(hebrewYear) {
        return HEBREW_YEARS[hebrewYear] || '';
    }

    /**
     * מחזיר את חותמת הזמן הנוכחית ב-ISO
     * @returns {string} ISO timestamp
     */
    function now() {
        return new Date().toISOString();
    }

    // ======================== נתוני ברירת מחדל (Default Data) ========================

    /**
     * נתוני ברירת מחדל – מאותחלים רק אם המפתח לא קיים ב-localStorage.
     * משמשים להפעלה ראשונה של המערכת.
     */
    const DEFAULT_DATA = {};

    // --- משתמשים (USERS) ---
    DEFAULT_DATA[KEYS.USERS] = [
        {
            id: 'usr_admin_001',
            username: 'admin',
            password: 'admin123',
            fullName: 'מנהל מערכת',
            email: 'admin@matspanet.co.il',
            role: 'admin',
            isActive: true,
            createdAt: '2024-09-01T00:00:00.000Z',
            updatedAt: '2024-09-01T00:00:00.000Z'
        },
        {
            id: 'usr_guide1_001',
            username: 'guide1',
            password: 'guide123',
            fullName: 'רחל כהן',
            email: 'rachel@education.gov.il',
            role: 'guide',
            isActive: true,
            createdAt: '2024-09-01T00:00:00.000Z',
            updatedAt: '2024-09-01T00:00:00.000Z'
        },
        {
            id: 'usr_guide2_001',
            username: 'guide2',
            password: 'guide123',
            fullName: 'דוד לוי',
            email: 'david@education.gov.il',
            role: 'guide',
            isActive: true,
            createdAt: '2024-09-01T00:00:00.000Z',
            updatedAt: '2024-09-01T00:00:00.000Z'
        }
    ];

    // --- קטגוריות (CATEGORIES) ---
    DEFAULT_DATA[KEYS.CATEGORIES] = [
        {
            id: 'cat_001',
            name: 'תחום דעת',
            description: 'פתרונות בתחום דעת ספציפי – מתמטיקה, היסטוריה, אנגלית, ספרות וכו\'',
            color: '#3b82f6',
            order: 1,
            isActive: true,
            createdAt: '2024-09-01T00:00:00.000Z',
            updatedAt: '2024-09-01T00:00:00.000Z'
        },
        {
            id: 'cat_002',
            name: 'أصحاب الأدوار',
            description: 'פתרונות לאנשי מקצוע בעלי אחריות ניהולית והדרכתית',
            color: '#10b981',
            order: 2,
            isActive: true,
            createdAt: '2024-09-01T00:00:00.000Z',
            updatedAt: '2024-09-01T00:00:00.000Z'
        },
        {
            id: 'cat_003',
            name: 'נושא רוחב',
            description: 'תחומים אסטרטגיים ורוחביים לכלל עובדי ההוראה',
            color: '#f59e0b',
            order: 3,
            isActive: true,
            createdAt: '2024-09-01T00:00:00.000Z',
            updatedAt: '2024-09-01T00:00:00.000Z'
        },
        {
            id: 'cat_004',
            name: 'תוכניות ייעודיות',
            description: 'מסלולי הכשרה ממוקדים לצרכים ספציפיים',
            color: '#8b5cf6',
            order: 4,
            isActive: true,
            createdAt: '2024-09-01T00:00:00.000Z',
            updatedAt: '2024-09-01T00:00:00.000Z'
        }
    ];

    // --- פתרונות למידה (SOLUTIONS) – רשימה ריקה ---
    DEFAULT_DATA[KEYS.SOLUTIONS] = [];

    // --- מאגר מנחים/מרצים (MENTORS) ---
    // הערה: מאגר המרצים מאותחל כמערך ריק כדי למנוע בעיות אחסון ב-localStorage
    // נתוני המרצים מיובאים על ידי המשתמש דרך ממשק הייבוא
    DEFAULT_DATA[KEYS.MENTORS] = [];

    // --- מאגר מדריכים – אנשי סגל פסג"ה (GUIDES_REPO) ---
    DEFAULT_DATA[KEYS.GUIDES_REPO] = [
        {
            id: 'guide_repo_001',
            idNumber: '11111111',
            fullName: 'רחל כהן',
            phone: '054-1111111',
            email: 'rachel@education.gov.il',
            position: 'מנחה ראשית – תחום מתמטיקה',
            isActive: true,
            userId: 'usr_guide1_001',
            createdAt: '2024-09-01T00:00:00.000Z',
            updatedAt: '2024-09-01T00:00:00.000Z'
        },
        {
            id: 'guide_repo_002',
            idNumber: '22222222',
            fullName: 'דוד לוי',
            phone: '054-2222222',
            email: 'david@education.gov.il',
            position: 'מנחה ראשי – תחום היסטוריה',
            isActive: true,
            userId: 'usr_guide2_001',
            createdAt: '2024-09-01T00:00:00.000Z',
            updatedAt: '2024-09-01T00:00:00.000Z'
        }
    ];

    // --- תקציבים (BUDGETS) – רשימה ריקה ---
    DEFAULT_DATA[KEYS.BUDGETS] = [];

    // --- תקופות (PERIODS) ---
    DEFAULT_DATA[KEYS.PERIODS] = [
        {
            id: 'period_001',
            hebrewYear: 'תשפ"ו',
            englishYear: '2025-2026',
            period1Label: 'תקופה א׳',
            period1Start: '2025-09-01',
            period1End: '2026-01-31',
            period2Label: 'תקופה ב׳',
            period2Start: '2026-02-01',
            period2End: '2026-08-31',
            isActive: true,
            createdAt: '2024-09-01T00:00:00.000Z',
            updatedAt: '2024-09-01T00:00:00.000Z'
        }
    ];

    // --- מדריכים-מרצים בפתרונות למידה (SOLUTION_INSTRUCTORS) – רשימה ריקה ---
    DEFAULT_DATA[KEYS.SOLUTION_INSTRUCTORS] = [];

    // --- שאלות נפוצות (FAQ_DATA) – רשימה ריקה ---
    DEFAULT_DATA[KEYS.FAQ_DATA] = [];

    // --- דפים מותאמים אישית (CUSTOM_PAGES) – רשימה ריקה ---
    DEFAULT_DATA[KEYS.CUSTOM_PAGES] = [];

    // --- פריטי קטלוג פתרונות למידה (CATALOG_ITEMS) – רשימה ריקה ---
    DEFAULT_DATA[KEYS.CATALOG_ITEMS] = [];

    // --- תחום פתרון למידה (LOOKUP_DOMAINS) ---
    DEFAULT_DATA[KEYS.LOOKUP_DOMAINS] = [
        { id: 'ld_001', value: 'مجال المعرفة',        label: 'مجال المعرفة',        order: 1, isActive: true },
        { id: 'ld_002', value: 'أصحاب الأدوار',    label: 'أصحاب الأدوار',    order: 2, isActive: true },
        { id: 'ld_003', value: 'موضوع عرضي',        label: 'موضوع عرضي',        order: 3, isActive: true },
        { id: 'ld_004', value: 'برامج مخصصة', label: 'برامج مخصصة', order: 4, isActive: true },
        { id: 'ld_005', value: 'مدرسي',        label: 'مدرسي',        order: 5, isActive: true }
    ];

    // --- שלב חינוך (LOOKUP_EDUCATION_STAGES) ---
    DEFAULT_DATA[KEYS.LOOKUP_EDUCATION_STAGES] = [
        { id: 'les_001', value: 'קדם-יסודי',     label: 'קדם-יסודי',     order: 1, isActive: true },
        { id: 'les_002', value: 'יסודי',          label: 'יסודי',          order: 2, isActive: true },
        { id: 'les_003', value: 'חטיבת ביניים',   label: 'חטיבת ביניים',   order: 3, isActive: true },
        { id: 'les_004', value: 'חטיבה עליונה',   label: 'חטיבה עליונה',   order: 4, isActive: true },
        { id: 'les_005', value: 'אקדמי',          label: 'אקדמי',          order: 5, isActive: true }
    ];

    // --- סוג חינוך (LOOKUP_EDUCATION_TYPES) ---
    DEFAULT_DATA[KEYS.LOOKUP_EDUCATION_TYPES] = [
        { id: 'let_001', value: 'רגיל',          label: 'רגיל',          order: 1, isActive: true },
        { id: 'let_002', value: 'חינוך מיוחד',   label: 'חינוך מיוחד',   order: 2, isActive: true },
        { id: 'let_003', value: 'חרדי',          label: 'חרדי',          order: 3, isActive: true },
        { id: 'let_004', value: 'ערבי',          label: 'ערבי',          order: 4, isActive: true }
    ];

    // --- מתוקצב? (LOOKUP_BUDGET_TYPES) ---
    DEFAULT_DATA[KEYS.LOOKUP_BUDGET_TYPES] = [
        { id: 'lbt_001', value: 'תקציב רגיל',  label: 'תקציב רגיל',  order: 1, isActive: true },
        { id: 'lbt_002', value: 'חומש',         label: 'חומש',         order: 2, isActive: true },
        { id: 'lbt_003', value: 'לא מתוקצב',    label: 'לא מתוקצב',    order: 3, isActive: true }
    ];

    // --- סטטוס שיוך תקציב (LOOKUP_ALLOCATION_STATUS) ---
    DEFAULT_DATA[KEYS.LOOKUP_ALLOCATION_STATUS] = [
        { id: 'las_001', value: 'שיוך מלא',    label: 'שיוך מלא',    order: 1, isActive: true },
        { id: 'las_002', value: 'שיוך חלקי',  label: 'שיוך חלקי',  order: 2, isActive: true },
        { id: 'las_003', value: 'לא שויך',     label: 'לא שויך',     order: 3, isActive: true }
    ];

    // --- סטטוס פתרון למידה (LOOKUP_SOLUTION_STATUS) ---
    DEFAULT_DATA[KEYS.LOOKUP_SOLUTION_STATUS] = [
        { id: 'lss_001', value: 'פעיל',           label: 'פעיל',           order: 1, isActive: true },
        { id: 'lss_002', value: 'ממתין לאישור',    label: 'ממתין לאישור',    order: 2, isActive: true },
        { id: 'lss_003', value: 'בתכנון',         label: 'בתכנון',         order: 3, isActive: true },
        { id: 'lss_004', value: 'הושלם',          label: 'הושלם',          order: 4, isActive: true },
        { id: 'lss_005', value: 'בוטל',           label: 'בוטל',           order: 5, isActive: true }
    ];

    // --- סוג מבצע (LOOKUP_PERFORMER_TYPES) ---
    DEFAULT_DATA[KEYS.LOOKUP_PERFORMER_TYPES] = [
        { id: 'lpt_001', value: 'external',    label: 'מנחה חיצוני',       order: 1, isActive: true },
        { id: 'lpt_002', value: 'internal',    label: 'מנחה פנימי',       order: 2, isActive: true },
        { id: 'lpt_003', value: 'pedagogical', label: 'מבצע פדגוגי',     order: 3, isActive: true }
    ];

    // --- סטטוס מרצה (LOOKUP_LECTURER_STATUS) ---
    DEFAULT_DATA[KEYS.LOOKUP_LECTURER_STATUS] = [
        { id: 'lls_001', value: 'אושר',           label: 'אושר',           order: 1, isActive: true },
        { id: 'lls_002', value: 'ממתין לאישור',    label: 'ממתין לאישור',    order: 2, isActive: true },
        { id: 'lls_003', value: 'נדחה',           label: 'נדחה',           order: 3, isActive: true }
    ];

    // --- מרצה מוסב (LOOKUP_CERTIFIED_LECTURER) ---
    DEFAULT_DATA[KEYS.LOOKUP_CERTIFIED_LECTURER] = [
        { id: 'lcl_001', value: 'מוסב', label: 'מוסב', order: 1, isActive: true }
    ];

    // --- מומחה בתחומו (LOOKUP_EXPERT_FIELD) ---
    DEFAULT_DATA[KEYS.LOOKUP_EXPERT_FIELD] = [
        { id: 'lef_001', value: 'הוגשה בקשה', label: 'הוגשה בקשה', order: 1, isActive: true },
        { id: 'lef_002', value: 'מומחה בתחומו', label: 'מומחה בתחומו', order: 2, isActive: true },
        { id: 'lef_003', value: 'נדחתה הבקשה', label: 'נדחתה הבקשה', order: 3, isActive: true }
    ];

    // --- תחום דעת (LOOKUP_FIELD_KNOWLEDGE) ---
    DEFAULT_DATA[KEYS.LOOKUP_FIELD_KNOWLEDGE] = [
        { id: 'lfk_001', value: 'מתמטיקה',     label: 'מתמטיקה',     order: 1, isActive: true },
        { id: 'lfk_002', value: 'היסטוריה',     label: 'היסטוריה',     order: 2, isActive: true },
        { id: 'lfk_003', value: 'אנגלית',      label: 'אנגלית',      order: 3, isActive: true },
        { id: 'lfk_004', value: 'ספרות',       label: 'ספרות',       order: 4, isActive: true },
        { id: 'lfk_005', value: 'תנ"ך',         label: 'תנ\"ך',         order: 5, isActive: true },
        { id: 'lfk_006', value: 'מדעים',       label: 'מדעים',       order: 6, isActive: true },
        { id: 'lfk_007', value: 'גאוגרפיה',    label: 'גאוגרפיה',    order: 7, isActive: true },
        { id: 'lfk_008', value: 'חינוך גופני', label: 'חינוך גופני', order: 8, isActive: true },
        { id: 'lfk_009', value: 'אמנות',       label: 'אמנות',       order: 9, isActive: true },
        { id: 'lfk_010', value: 'מוזיקה',      label: 'מוזיקה',      order: 10, isActive: true },
        { id: 'lfk_011', value: 'אזרחות',      label: 'אזרחות',      order: 11, isActive: true },
        { id: 'lfk_012', value: 'חברה',        label: 'חברה',        order: 12, isActive: true },
        { id: 'lfk_013', value: 'מדעי המחשב', label: 'מדעי המחשב', order: 13, isActive: true },
        { id: 'lfk_014', value: 'ערבית',       label: 'ערבית',       order: 14, isActive: true },
        { id: 'lfk_015', value: 'אנגלית מוגברת', label: 'אנגלית מוגברת', order: 15, isActive: true },
        { id: 'lfk_016', value: 'פיזיקה',      label: 'פיזיקה',      order: 16, isActive: true }
    ];

    // --- בעלי תפקידים (LOOKUP_ROLE_HOLDERS) ---
    // הערה: הנתונים נטענים מקובץ data/lookup_role_holders.json בלבד
    DEFAULT_DATA[KEYS.LOOKUP_ROLE_HOLDERS] = [];

    // --- נושא רוחב (LOOKUP_BROAD_TOPICS) ---
    DEFAULT_DATA[KEYS.LOOKUP_BROAD_TOPICS] = [
        { id: 'lbt_001', value: 'חשיבה ביקורתית',       label: 'חשיבה ביקורתית',       order: 1, isActive: true },
        { id: 'lbt_002', value: 'אוריינות דיגיטלית',     label: 'אוריינות דיגיטלית',     order: 2, isActive: true },
        { id: 'lbt_003', value: 'חינוך פיננסי',        label: 'חינוך פיננסי',        order: 3, isActive: true },
        { id: 'lbt_004', value: 'מנהיגות חינוכית',     label: 'מנהיגות חינוכית',     order: 4, isActive: true },
        { id: 'lbt_005', value: 'למידה מבוססת פרויקטים', label: 'למידה מבוססת פרויקטים', order: 5, isActive: true },
        { id: 'lbt_006', value: 'הערכה ומדידה',        label: 'הערכה ומדידה',        order: 6, isActive: true },
        { id: 'lbt_007', value: 'חינוך מרחוקי',         label: 'חינוך מרחוקי',         order: 7, isActive: true },
        { id: 'lbt_008', value: 'כישורי חיים',          label: 'כישורי חיים',          order: 8, isActive: true }
    ];

    // --- תוכניות ייעודיות (LOOKUP_DESIGNATED_PROGRAMS) ---
    DEFAULT_DATA[KEYS.LOOKUP_DESIGNATED_PROGRAMS] = [
        { id: 'ldp_001', value: 'תוכנית מנהיגות חינוכית', label: 'תוכנית מנהיגות חינוכית', order: 1, isActive: true },
        { id: 'ldp_002', value: 'תוכנית חדשנות פדגוגית',  label: 'תוכנית חדשנות פדגוגית',  order: 2, isActive: true },
        { id: 'ldp_003', value: 'תוכנית קידום אקדמי',    label: 'תוכנית קידום אקדמי',    order: 3, isActive: true },
        { id: 'ldp_004', value: 'תוכנית אנגלית',         label: 'תוכנית אנגלית',         order: 4, isActive: true },
        { id: 'ldp_005', value: 'תוכנית מדעים וטכנולוגיה', label: 'תוכנית מדעים וטכנולוגיה', order: 5, isActive: true }
    ];

    // --- ימי שבוע (LOOKUP_WEEK_DAYS) ---
    DEFAULT_DATA[KEYS.LOOKUP_WEEK_DAYS] = [
        { id: 'lwd_001', value: 'א\'', label: 'א\'', order: 1, isActive: true },
        { id: 'lwd_002', value: 'ב\'', label: 'ב\'', order: 2, isActive: true },
        { id: 'lwd_003', value: 'ג\'', label: 'ג\'', order: 3, isActive: true },
        { id: 'lwd_004', value: 'ד\'', label: 'ד\'', order: 4, isActive: true },
        { id: 'lwd_005', value: 'ה\'', label: 'ה\'', order: 5, isActive: true },
        { id: 'lwd_006', value: 'ו\'', label: 'ו\'', order: 6, isActive: true }
    ];

    // --- סוג מפגש (LOOKUP_MEETING_TYPES) ---
    DEFAULT_DATA[KEYS.LOOKUP_MEETING_TYPES] = [
        { id: 'lmt_001', value: 'פנים אל פנים', label: 'פנים אל פנים', order: 1, isActive: true },
        { id: 'lmt_002', value: 'סינכרוני',     label: 'סינכרוני',     order: 2, isActive: true },
        { id: 'lmt_003', value: 'א-סינכרוני',   label: 'א-סינכרוני',   order: 3, isActive: true },
        { id: 'lmt_004', value: 'היברידי',       label: 'היברידי',       order: 4, isActive: true }
    ];

    // --- סוג אחריות פתרון למידה (LOOKUP_RESPONSIBILITY_TYPES) ---
    DEFAULT_DATA[KEYS.LOOKUP_RESPONSIBILITY_TYPES] = [
        { id: 'resp_001', value: 'psagati',          label: 'פסג"תי',                          labelAr: 'بيسغاتي',         description: 'אחריות מלאה של הפסג"ה',         order: 1, isActive: true },
        { id: 'resp_002', value: 'school',            label: 'בית-ספרי',                       labelAr: 'مدرسي',           description: 'אחריות מלאה של בית הספר',     order: 2, isActive: true },
        { id: 'resp_003', value: 'school_managed',    label: 'בית-ספרי (מנוהל פסג"ה)',       labelAr: 'مدرسي (يدار بواسطة بييسغاه)', description: 'אחריות בית הספר, תוך ניהול של הפסג"ה', order: 3, isActive: true }
    ];

    DEFAULT_DATA[KEYS.LOOKUP_SCHOOLS] = [];

    // --- הגדרות מערכת (SETTINGS) ---
    DEFAULT_DATA[KEYS.SETTINGS] = {
        systemName: 'מצפן נט',
        organizationName: 'פסג"ה – תכנון ופיתוח ארגוני',
        currentPeriod: 'period_001',
        language: 'ar',
        theme: 'light'
    };

    // --- שיעור (SESSION) – אין ברירת מחדל ---
    DEFAULT_DATA[KEYS.SESSION] = null;

    // ======================== פעולות CRUD כלליות (Generic CRUD) ========================

    /**
     * מחזיר את כל הפריטים מחנות נתונים מסוימת.
     * @param {string} key - מפתח החנות (מתוך KEYS)
     * @returns {Array|Object|null} מערך פריטים או אובייקט (SETTINGS) או null
     */
    function getAll(key) {
        try {
            const raw = localStorage.getItem(getKey(key));
            if (raw === null) return null;
            const parsed = JSON.parse(raw);
            // הגדרות ושיעור הם אובייקטים, לא מערכים
            if (key === KEYS.SETTINGS || key === KEYS.SESSION || key === KEYS.HOMEPAGE) {
                return parsed;
            }
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            // טיפול מיוחד למאגר מרצים - אם יש שגיאת Quota או parsing, מאפסים את המאגר
            if (key === KEYS.MENTORS) {
                console.warn('[DataStore] ⚠️ מאגר המרצים פגום או חורג מהמכסה. מאפסים מאגר.');
                try {
                    localStorage.removeItem(getKey(KEYS.MENTORS));
                } catch (removeErr) {
                    console.error('[DataStore] ❌ לא ניתן לאפס מאגר מרצים:', removeErr);
                }
                return [];
            }
            console.error('[DataStore] Error parsing data for key:', key, e);
            return (key === KEYS.SETTINGS || key === KEYS.SESSION || key === KEYS.HOMEPAGE) ? null : [];
        }
    }

    /**
     * מחזיר פריט בודד לפי מזהה.
     * @param {string} key - מפתח החנות
     * @param {string} id - מזהה הפריט
     * @returns {Object|null} הפריט או null
     */
    function getById(key, id) {
        const items = getAll(key);
        if (!Array.isArray(items)) return null;
        return items.find(item => item.id === id) || null;
    }

    /**
     * יוצר פריט חדש בחנות נתונים.
     * מוסיף אוטומטית id, createdAt ו-updatedAt.
     * @param {string} key - מפתח החנות
     * @param {Object} item - נתוני הפריט
     * @returns {Object} הפריט שנוצר (עם id ו-timestamps)
     */
    function create(key, item) {
        const items = getAll(key) || [];
        const newItem = {
            ...item,
            id: item.id || generateId(),
            createdAt: item.createdAt || now(),
            updatedAt: now()
        };
        items.push(newItem);
        localStorage.setItem(getKey(key), JSON.stringify(items));
        _syncToServer(key, items);
        return newItem;
    }

    /**
     * מעדכן פריט קיים לפי מזהה.
     * @param {string} key - מפתח החנות
     * @param {string} id - מזהה הפריט
     * @param {Object} updates - השדות לעדכון
     * @returns {Object|null} הפריט המעודכן או null אם לא נמצא
     */
    function update(key, id, updates) {
        const items = getAll(key);
        if (!Array.isArray(items)) return null;
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return null;
        items[index] = { ...items[index], ...updates, id, updatedAt: now() };
        localStorage.setItem(getKey(key), JSON.stringify(items));
        _syncToServer(key, items);
        return items[index];
    }

    /**
     * מוחק פריט לפי מזהה.
     * @param {string} key - מפתח החנות
     * @param {string} id - מזהה הפריט
     * @returns {boolean} true אם הפריט נמחק בהצלחה
     */
    function remove(key, id) {
        const items = getAll(key);
        if (!Array.isArray(items)) return false;
        const filtered = items.filter(item => item.id !== id);
        if (filtered.length === items.length) return false;
        localStorage.setItem(getKey(key), JSON.stringify(filtered));
        _syncToServer(key, filtered);
        return true;
    }

    /**
     * שומר מערך פריטים שלם לחנות נתונים (מחליף את הקיים).
     * @param {string} key - מפתח החנות
     * @param {Array|Object} items - מערך פריטים או אובייקט הגדרות
     */
    function saveAll(key, items) {
        localStorage.setItem(getKey(key), JSON.stringify(items));
        // Sync to server JSON file
        _syncToServer(key, items);
    }

    /**
     * שולח נתונים לשרת לשמירה במסד הנתונים (API).
     */
    function _syncToServer(key, items) {
        var table = KEY_TO_TABLE[key];
        if (!table) return;
        
        // קבלת הטוקן מה-session
        var session = getAll(KEYS.SESSION);
        var token = session ? session.token : null;
        if (!token) return;
        
        // שלח כל פריט כבקשה נפרדת (לצורך פשטות)
        var dataArray = Array.isArray(items) ? items : [items];
        
        dataArray.forEach(function(item) {
            var action = 'insert';
            if (item.id) {
                // אם יש ID, נניח שזה עדכון
                action = 'update';
            }
            
            try {
                fetch('/api/data-save', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ 
                        table: table, 
                        action: action,
                        data: item 
                    })
                }).then(function(response) {
                    if (response.ok) {
                        console.log('נשמר בהצלחה לטבלה ' + table + ':', item);
                    } else {
                        console.error('שמירה נכשלה לטבלה ' + table, response.status);
                    }
                }).catch(function(err) { 
                    console.error('שגיאה בשמירה לשרת:', err);
                });
            } catch(e) { 
                console.error('שגיאה ב-_syncToServer:', e); 
            }
        });
    }

    // ======================== הגדרות מערכת (Settings) ========================

    /**
     * מחזיר את הגדרות המערכת.
     * @returns {Object} אובייקט ההגדרות
     */
    function getSettings() {
        const settings = getAll(KEYS.SETTINGS);
        return settings || { ...DEFAULT_DATA[KEYS.SETTINGS] };
    }

    /**
     * מעדכן הגדרות מערכת (partial update).
     * @param {Object} updates - שדות לעדכון
     * @returns {Object} ההגדרות המעודכנות
     */
    function updateSettings(updates) {
        const current = getSettings();
        const updated = { ...current, ...updates };
        saveAll(KEYS.SETTINGS, updated);
        return updated;
    }

    // ======================== דף שער (Homepage) ========================

    DEFAULT_DATA[KEYS.HOMEPAGE] = {
        siteName: { he: 'מצפן נט', ar: 'بوصلة نت' },
        logo: '',
        navItems: [
            { id: 'hpnav_001', labelHe: 'לוח בקרה', labelAr: 'لوحة التحكم', url: './dashboard.html', order: 1, isActive: true },
            { id: 'hpnav_002', labelHe: 'צוות מדריכים', labelAr: 'فريق المرشدين', url: './team.html', order: 2, isActive: true },
            { id: 'hpnav_003', labelHe: 'קטלוג ציבורי', labelAr: 'الكتالوج العام', url: './catalog.html', order: 3, isActive: true }
        ],
        sidebarItems: [],
        mainContent: { he: 'ברוכים הבאים למצפן נט\n\nמערכת מצפן נט היא כלי מרכזי של פסג"ה – תכנון ופיתוח ארגוני, משרד החינוך, המשמש לניהול, מעקב ובקרה של פתרונות למידה.\n\nהמערכת מאפשרת ניהול יעיל של תהליכי הלמידה, רישום משתתפים, מעקב אחר תקציבים ושעות, והפקת דוחות מקיפים.', ar: 'مرحباً بكم في بوصلة نت\n\nنظام بوصلة نت هو أداة مركزية تابعة لبيسغاه – التخطيط والتطوير التنظيمي، وزارة التربية والتعليم، والمستخدمة لإدارة ومتابعة ومراقبة حلول التعلم.\n\nيتيح النظام إدارة فعّالة لعمليات التعلم، تسجيل المشاركين، متابعة الميزات والساعات، وإنتاج تقارير شاملة.' },
        footerText: { he: '© כל הזכויות שמורות – משרד החינוך | פסג"ה – תכנון ופיתוח ארגוני', ar: '© جميع الحقوق محفوظة – وزارة التربية والتعليم | بييسغاه – التخطيط والتطوير التنظيمي' }
    };

    function getHomepage() {
        const data = getAll(KEYS.HOMEPAGE);
        return data || { ...DEFAULT_DATA[KEYS.HOMEPAGE] };
    }

    function updateHomepage(updates) {
        const current = getHomepage();
        const updated = { ...current, ...updates };
        saveAll(KEYS.HOMEPAGE, updated);
        return updated;
    }

    // ======================== ניהול שיעור (Session) ========================

    /**
     * יוצר שיעור משתמש חדש (login).
     * @param {Object} user - נתוני המשתמש
     * @returns {Object} אובייקט השיעור
     */
    function setSession(user) {
        const session = {
            userId: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email || '',
            role: user.role,
            loginTime: now()
        };
        saveAll(KEYS.SESSION, session);
        return session;
    }

    /**
     * מחזיר את השיעור הנוכחי.
     * @returns {Object|null} אובייקט השיעור או null
     */
    function getSession() {
        return getAll(KEYS.SESSION);
    }

    /**
     * מנקה את השיעור הנוכחי (logout).
     */
    function clearSession() {
        localStorage.removeItem(getKey(KEYS.SESSION));
    }

    // ======================== סטטיסטיקות (Statistics) ========================

    /**
     * מחזיר סטטיסטיקות כלליות של המערכת.
     * @returns {Object} אובייקט עם סטטיסטיקות
     */
    function getStats() {
        const solutions           = getAll(KEYS.SOLUTIONS)              || [];
        const categories          = getAll(KEYS.CATEGORIES)             || [];
        const mentors             = getAll(KEYS.MENTORS)                || [];
        const guidesRepo          = getAll(KEYS.GUIDES_REPO)             || [];
        const budgets             = getAll(KEYS.BUDGETS)                 || [];
        const solutionInstructors = getAll(KEYS.SOLUTION_INSTRUCTORS)    || [];
        const periods             = getAll(KEYS.PERIODS)                || [];

        // ספירה כללית
        const totalSolutions       = solutions.length;

        // ספירת שעות
        const totalAcademicHours   = solutions.reduce((s, x) => s + (parseFloat(x.academicHours)   || 0), 0);
        const totalBudgetedHours   = solutions.reduce((s, x) => s + (parseFloat(x.budgetedHours)   || 0), 0);
        const totalPeriod1Hours    = solutions.reduce((s, x) => s + (parseFloat(x.period1Hours)    || 0), 0);
        const totalPeriod2Hours    = solutions.reduce((s, x) => s + (parseFloat(x.period2Hours)    || 0), 0);

        // סטטוסים
        const activeSolutions      = solutions.filter(s => s.status === 'פעיל'              || s.status === 'active').length;
        const pendingSolutions     = solutions.filter(s => s.status === 'ממתין לאישור'    || s.status === 'pending').length;
        const planningSolutions    = solutions.filter(s => s.status === 'בתכנון'           || s.status === 'planning').length;
        const completedSolutions   = solutions.filter(s => s.status === 'הושלם'            || s.status === 'completed').length;

        // תקציב
        const totalBudgetAmount    = budgets.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
        const totalFreeBudget      = budgets.reduce((s, x) => s + (parseFloat(x.freeBudgetBalance) || 0), 0);

        // מנחים פעילים
        const activeMentors        = mentors.filter(m => m.isActive !== false).length;
        const activeGuides         = guidesRepo.filter(g => g.isActive !== false).length;

        return {
            // פתרונות למידה
            totalSolutions,
            activeSolutions,
            pendingSolutions,
            planningSolutions,
            completedSolutions,

            // שעות
            totalAcademicHours,
            totalBudgetedHours,
            totalPeriod1Hours,
            totalPeriod2Hours,

            // תקציבים
            totalBudgets: budgets.length,
            totalBudgetAmount,
            totalFreeBudget,

            // ספירות כלליות
            totalCategories:    categories.length,
            totalMentors:       mentors.length,
            activeMentors,
            totalGuidesRepo:    guidesRepo.length,
            activeGuides,
            totalSolutionInstructors: solutionInstructors.length,

            // תקופות
            activePeriods:      periods.filter(p => p.isActive).length,
            periods
        };
    }

    // ======================== ייצוא וייבוא נתונים (Export / Import) ========================

    /**
     * מייצא את כל נתוני המערכת.
     * @returns {Object} אובייקט עם כל החנויות
     */
    function exportAllData() {
        const allData = {};
        const allKeys = Object.values(KEYS);

        allKeys.forEach(key => {
            allData[key] = getAll(key);
        });

        // מוסיף מטא-נתונים
        allData._meta = {
            exportedAt: now(),
            version: '2.0.0',
            systemName: getSettings().systemName
        };

        return allData;
    }

    /**
     * מייבא נתונים למערכת (מחליף קיים).
     * @param {Object} data - אובייקט נתונים לייבוא
     * @param {boolean} [replace=false] - האם להחליף הכל או למזג
     */
    function importData(data, replace) {
        if (!data || typeof data !== 'object') {
            console.error('[DataStore] importData: invalid data');
            return;
        }

        const allKeys = Object.values(KEYS);
        let importedCount = 0;

        allKeys.forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                if (replace) {
                    // החלפה מלאה
                    saveAll(key, data[key]);
                } else {
                    // מיזוג: מערכים מתמזגים לפי id, אובייקטים מוחלפים
                    const existing = getAll(key);
                    if (Array.isArray(existing) && Array.isArray(data[key])) {
                        const existingMap = new Map(existing.map(item => [item.id, item]));
                        data[key].forEach(item => {
                            existingMap.set(item.id, item);
                        });
                        saveAll(key, Array.from(existingMap.values()));
                    } else {
                        // אובייקט בודד (SETTINGS וכו')
                        saveAll(key, data[key]);
                    }
                }
                importedCount++;
            }
        });

        console.log(`[DataStore] Import completed: ${importedCount} stores imported.`);
    }

    // ======================== אתחול מערכת (Initialization) ========================

    const DATA_VERSION = '3.0.0';
    const VERSION_KEY = STORAGE_PREFIX + '_version';

    /**
     * מנקה את כל הנתונים ומאתחל מחדש (לשימוש במעבר גרסאות).
     * גרסה סינכרונית – משמשת לאתחול מיידי ללא טעינת קבצים.
     */
    function clearAndReinit() {
        // מחק את כל המפתחות הישנים עם הקידומת
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(STORAGE_PREFIX)) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        // מאתחל מחדש מנתוני ברירת מחדל
        const allKeys = Object.values(KEYS);
        allKeys.forEach(key => {
            if (DEFAULT_DATA[key] !== undefined) {
                saveAll(key, DEFAULT_DATA[key]);
            }
        });
        localStorage.setItem(VERSION_KEY, DATA_VERSION);
        console.log('[DataStore] 🔄 Data cleared and reinitialized (version migration).');
    }

    /**
     * מנסה לטעון קובץ JSON יחיד מ-./data/.
     * @param {string} filename - שם הקובץ (למשל 'users.json')
     * @returns {Promise<Array|Object|null>} הנתונים שנטענו, או null אם נכשל
     */
    async function fetchJsonFile(filename) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch('./data/' + filename + '?t=' + Date.now(), { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) {
                console.warn(`[DataStore] Failed to fetch ${filename}: HTTP ${response.status}`);
                return null;
            }
            const data = await response.json();
            // תמיכה במבנה עוטף: אם יש שדה 'data', נחזיר אותו; אחרת נחזיר את כל האובייקט
            const extractedData = (data && typeof data === 'object' && Array.isArray(data.data)) ? data.data : data;
            console.log(`[DataStore] ✅ Loaded ${filename} from server (${Array.isArray(extractedData) ? extractedData.length + ' items' : 'object'}).`);
            return extractedData;
        } catch (e) {
            console.warn(`[DataStore] Could not load ${filename} from server:`, e.message);
            return null;
        }
    }

    /**
     * מאתחל את כל חנויות הנתונים (אסינכרוני).
     * 1. בודק גרסה – מעבר גרסאות חכם: לא מוחק נתונים קיימים, רק ממלא חסרים.
     * 2. טבלאות ערכים (lookup) נטענות תמיד מ-JSON כדי לקבל ערכים עדכניים.
     * 3. יתר הנתונים נטענים מ-JSON רק אם חסרים ב-localStorage (ללא דריסה!).
     * 4. מפתחות חסרים מקבלים נתוני ברירת מחדל.
     *
     * @returns {Promise<void>}
     */
    async function init(forceReloadFromServer = false) {
        // בדיקת גרסה – מעבר גרסאות חכם (ללא מחיקת נתוני משתמש)
        const storedVersion = localStorage.getItem(VERSION_KEY);
        if (storedVersion && storedVersion !== DATA_VERSION) {
            // גרסה השתנתה – אין מחיקת נתונים! רק מילוי מפתחות חסרים להלן.
            console.log(`[DataStore] 🔄 Version changed: ${storedVersion} → ${DATA_VERSION}. Preserving existing data, filling missing keys.`);
        }

        // אם forceReloadFromServer=true, ננקה את כל ה-localStorage ונטען הכל מחדש מהשרת
        if (forceReloadFromServer) {
            console.log('[DataStore] 🔄 Force reloading all data from server...');
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        }

        // טעינת טבלאות ערכים תמיד מ-JSON (כדי לקבל labelAr עדכני) - תמיד טוענים מחדש מהשרת!
        const lookupKeys = [
            KEYS.LOOKUP_DOMAINS, KEYS.LOOKUP_EDUCATION_STAGES, KEYS.LOOKUP_EDUCATION_TYPES,
            KEYS.LOOKUP_BUDGET_TYPES, KEYS.LOOKUP_ALLOCATION_STATUS, KEYS.LOOKUP_SOLUTION_STATUS,
            KEYS.LOOKUP_PERFORMER_TYPES, KEYS.LOOKUP_LECTURER_STATUS,
            KEYS.LOOKUP_FIELD_KNOWLEDGE, KEYS.LOOKUP_ROLE_HOLDERS, KEYS.LOOKUP_BROAD_TOPICS,
            KEYS.LOOKUP_DESIGNATED_PROGRAMS, KEYS.LOOKUP_WEEK_DAYS, KEYS.LOOKUP_MEETING_TYPES,
            KEYS.LOOKUP_RESPONSIBILITY_TYPES, KEYS.LOOKUP_SCHOOLS
        ];
        const loadedFromFiles = new Set();

        console.log('Loading lookup tables from server (forcing reload to ensure correct language)...');
        // Load lookup files sequentially - FORCE reload from server to ensure correct language labels
        for (const key of lookupKeys) {
            const filename = KEY_TO_FILE[key];
            if (!filename) continue;
            
            try {
                // Force fetch from server directly, bypassing any caching in fetchJsonFile
                const response = await fetch(`data/${filename}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                
                // Update localStorage with fresh data from server immediately
                localStorage.setItem(getKey(key), JSON.stringify(data));
                loadedFromFiles.add(key);
                console.log(`✓ Loaded ${key} (${filename}) from server.`);
            } catch (error) {
                console.error(`✗ Failed to load ${filename} from server:`, error);
                // Fallback to localStorage only if server fails completely
                const cached = localStorage.getItem(getKey(key));
                if (cached) {
                    loadedFromFiles.add(key);
                    console.warn(`⚠ Using cached data for ${key} due to server error.`);
                }
            }
        }

        // טעינת יתר הנתונים רק אם לא קיימים ב-localStorage (ללא דריסה!)
        const allKeys = Object.values(KEYS);
        const fileKeys = Object.keys(KEY_TO_FILE);
        const nonLookupKeys = fileKeys.filter(k => !lookupKeys.includes(k));

        // Load non-lookup files sequentially (only if not in localStorage)
        for (const key of nonLookupKeys) {
            const stored = localStorage.getItem(getKey(key));
            if (stored !== null) continue; // Skip if already in localStorage
            
            const filename = KEY_TO_FILE[key];
            if (!filename) continue;
            
            const data = await fetchJsonFile(filename);
            if (data !== null) {
                localStorage.setItem(getKey(key), JSON.stringify(data));
                loadedFromFiles.add(key);
            }
        }

        // אתחול מפתחות חסרים מברירת מחדל
        allKeys.forEach(key => {
            const stored = localStorage.getItem(getKey(key));
            if (stored === null && DEFAULT_DATA[key] !== undefined) {
                saveAll(key, DEFAULT_DATA[key]);
            }
        });

        localStorage.setItem(VERSION_KEY, DATA_VERSION);
        console.log(`[DataStore] ✅ Init complete. Loaded ${loadedFromFiles.size} stores from JSON.`);
    }; // ======================== ממשק ציבורי (Public API) ========================
    return {
        // מפתחות ומיפויים
        KEYS,
        HEBREW_YEARS,
        getEnglishYear,

        // פונקציות עזר
        generateId,

        // CRUD כללי
        getAll,
        getById,
        create,
        update,
        remove,
        saveAll,
        get: getAll,  // כינוי ל-getAll לתאימות
        set: saveAll,  // כינוי ל-saveAll לתאימות

        // הגדרות מערכת
        getSettings,
        updateSettings,

        // דף שער
        getHomepage,
        updateHomepage,

        // שיעור משתמש
        setSession,
        getSession,
        clearSession,

        // סטטיסטיקות
        getStats,

        // ייצוא / ייבוא
        exportAllData,
        importData,

        // אתחול (מחזיר Promise)
        init
    };

})();
