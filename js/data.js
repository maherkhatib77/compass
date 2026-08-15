/**
 * data.js - גרסת מסד נתונים (DB First) - מתוקן
 * טוען רק טבלאות שקיימות כרגע כקבצי API או JSON.
 */

const DataStore = {
    data: {},
    isInitialized: false,

    // Compatibility keys used across the app (map logical keys to table/file names)
    KEYS: {
        USERS: 'users',
        SOLUTIONS: 'solutions',
        PERIODS: 'periods',
        BUDGETS: 'budgets',
        REGISTRATIONS: 'registrations',
        GUIDES_REPO: 'guides_repo',
        FAQ_DATA: 'faq',
        LOOKUP_WEEK_DAYS: 'lookup_week_days',
        LOOKUP_DOMAINS: 'lookup_domains',
        LOOKUP_MEETING_TYPES: 'lookup_meeting_types',
        LOOKUP_BUDGET_TYPES: 'lookup_budget_types',
        LOOKUP_RESPONSIBILITY_TYPES: 'lookup_responsibility_types',
        LOOKUP_EDUCATION_STAGES: 'lookup_education_stages',
        LOOKUP_EDUCATION_TYPES: 'lookup_education_types',
        LOOKUP_FIELD_KNOWLEDGE: 'lookup_field_knowledge',
        LOOKUP_ROLE_HOLDERS: 'lookup_role_holders',
        SOLUTION_INSTRUCTORS: 'solution_instructors',
        MENTORS: 'mentors',
        INSTITUTIONS: 'institutions',
        CUSTOM_PAGES: 'custom_pages',
        HOMEPAGE: 'homepage',
        SETTINGS: 'settings',
        ACTIVITY_LOG: 'activity_log'
    },


    async init(useCache = false) {
        console.log('🔄 DataStore: מאתחל מול מסד נתונים (API)...');
        
        // רשימת טבלאות קריטיות + טבלאות קיימות ב-API/JSON
        // הוספנו 'periods' כדי לתקן את שגיאת App.init
        // הסרנו טבלאות שעדיין אין להן קובץ PHP כדי למנוע 404 ברעש
        const tables = [
            'lookup_week_days',
            'solutions',
            'users',
            'periods',        // חובה לדשבורד!
            'budgets',
            'registrations'
            // הערה: supervisors, regions וכו' יתווספו ברגע שניצור להם קבצי PHP
        ];

        try {
            for (const table of tables) {
                await this.loadTable(table);
            }
            this.isInitialized = true;
            console.log('✅ DataStore: אתחול הושלם.');
        } catch (error) {
            console.error('❌ DataStore: שגיאה באתחול:', error);
            tables.forEach(t => this.data[t] = []);
        }
    },

    async loadTable(tableName) {
        if (this.data[tableName] && this.data[tableName].length > 0) {
            return this.data[tableName];
        }

        try {
            const apiUrl = this.getApiUrl(tableName);
            const response = await fetch(apiUrl);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const result = await response.json();
            
            if (result.status === 'success') {
                this.data[tableName] = result.data || [];
            } else if (Array.isArray(result)) {
                this.data[tableName] = result;
            } else if (result.data) {
                this.data[tableName] = result.data;
            } else {
                this.data[tableName] = [];
            }

            // If the users table came from an API that omits passwords (production DB hashes),
            // prefer the developer local JSON fallback for offline login during localhost.
            if (tableName === 'users' && Array.isArray(this.data[tableName]) && this.data[tableName].length) {
                const first = this.data[tableName][0];
                if (first && !Object.prototype.hasOwnProperty.call(first, 'password')) {
                    console.warn("⚠️ API 'users' response lacks password field — attempting local JSON fallback for users (dev mode)");
                    try {
                        const fallbackRes = await fetch(`./data/users.json`);
                        if (fallbackRes.ok) {
                            this.data[tableName] = await fallbackRes.json();
                            console.log(`💾 נטען גיבוי מ-JSON עבור 'users' (local dev).`);
                        }
                    } catch (e) {
                        // keep API data if fallback fails
                    }
                }
            }

            console.log(`📥 נטענה טבלה '${tableName}': ${this.data[tableName].length} רשומות.`);
            return this.data[tableName];

        } catch (error) {
            console.warn(`⚠️ נכשלה טעינת '${tableName}' מה-API, מנסה fallback ל-JSON...`);
            try {
                const fallbackRes = await fetch(`./data/${tableName}.json`);
                if (fallbackRes.ok) {
                    this.data[tableName] = await fallbackRes.json();
                    console.log(`💾 נטען גיבוי מ-JSON עבור '${tableName}'.`);
                } else {
                    this.data[tableName] = [];
                }
            } catch (e) {
                this.data[tableName] = [];
            }
            return this.data[tableName];
        }
    },

    getApiUrl(tableName) {
        const path = window.location.pathname;
        let baseDir = '';
        
        if (path.includes('/compass/')) {
            baseDir = '/compass';
        } else if (path !== '/' && !path.endsWith('.html')) {
             const parts = path.split('/').filter(p => p);
             if (parts.length > 0 && window.location.hostname === 'localhost') {
                 baseDir = '/' + parts[0];
             }
        }

        return `${baseDir}/api/get_${tableName}.php`;
    },

    get(tableName) {
        return this.data[tableName] || [];
    },

    getCrudUrl(tableName) {
        const path = window.location.pathname;
        let baseDir = '';
        if (path.includes('/compass/')) {
            baseDir = '/compass';
        } else if (path !== '/' && !path.endsWith('.html')) {
            const parts = path.split('/').filter(p => p);
            if (parts.length > 0 && window.location.hostname === 'localhost') {
                baseDir = '/' + parts[0];
            }
        }
        return `${baseDir}/api/data-crud.php`;
    },

    async save(tableName, action, payload) {
        // Use unified CRUD endpoint
        const apiUrl = this.getCrudUrl(tableName);
        let method = 'POST';
        if (action === 'update') method = 'PUT';
        if (action === 'delete') method = 'DELETE';

        // Ensure payload is an object
        const dataWrapper = { table: tableName, data: payload };

        console.log(`📡 שולח בקשה ל-CRUD API: ${method} ${apiUrl}`, dataWrapper);

        try {
            let urlToFetch = apiUrl;
            const options = { method, headers: { 'Content-Type': 'application/json' } };

            if (method === 'DELETE') {
                // prefer query param for id on DELETE for compatibility
                if (payload && payload.id) {
                    urlToFetch = `${apiUrl}?table=${encodeURIComponent(tableName)}&id=${encodeURIComponent(payload.id)}`;
                    // some servers ignore body on DELETE; include minimal body anyway
                    options.body = JSON.stringify({ id: payload.id });
                } else {
                    options.body = JSON.stringify(dataWrapper);
                }
            } else {
                options.body = JSON.stringify(dataWrapper);
            }

            const response = await fetch(urlToFetch, options);
            const result = await response.json();

            // Accept either { success: true } or any 2xx response
            if ((result && result.success === true) || response.ok) {
                console.log(`✅ נשמר בהצלחה ל-${tableName}`);

                // Normalize created/updated return values from data-crud.php
                if (action === 'create') {
                    const newId = result.id || (result.record && result.record.id) || null;
                    if (newId) {
                        const newItem = { ...payload, id: newId };
                        if (!this.data[tableName]) this.data[tableName] = [];
                        this.data[tableName].push(newItem);
                        return { success: true, id: newId, record: newItem };
                    }
                }

                if (action === 'update') {
                    const id = payload && payload.id;
                    if (id != null && this.data[tableName]) {
                        const index = this.data[tableName].findIndex(item => item && (item.id == id));
                        if (index !== -1) {
                            this.data[tableName][index] = { ...this.data[tableName][index], ...payload };
                        }
                    }
                    return { success: true, record: result.record || payload };
                }

                if (action === 'delete') {
                    const id = payload && payload.id;
                    if (id != null && this.data[tableName]) {
                        this.data[tableName] = this.data[tableName].filter(item => item && item.id != id);
                    }
                    return { success: true, id: id };
                }

                // Fallback: return server result
                return { success: true, data: result };
            } else {
                const errMsg = (result && (result.error || result.message)) || `HTTP ${response.status}`;
                throw new Error(errMsg);
            }

        } catch (error) {
            console.error(`❌ כשל בשמירה ל-${tableName}:`, error);
            try { alert('שגיאה בשמירת הנתונים לשרת.\n' + error.message); } catch(e) {}
            return { success: false, error: error.message };
        }
    },

    async saveAll(key, records) {
        const safeRecords = Array.isArray(records) ? records : [];
        this.data[key] = safeRecords;

        try {
            const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '/';
            const match = path.match(/^(?:\/[^\/]+)?/);
            const baseDir = match && match[0] && match[0] !== '/' ? match[0] : '';
            const saveUrl = `${baseDir}/api/data-save.php`;
            const response = await fetch(saveUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: `${key}.json`, data: safeRecords })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || result.success !== true) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }
            return safeRecords;
        } catch (error) {
            try {
                localStorage.setItem(`compass_data_${key}`, JSON.stringify(safeRecords));
            } catch (e) {}
            console.warn(`⚠️ saveAll failed for '${key}', kept in memory/local fallback:`, error);
            return safeRecords;
        }
    },

    addRecord(tableName, recordData) {
        return this.save(tableName, 'create', recordData);
    },

    updateRecord(tableName, recordData) {
        return this.save(tableName, 'update', recordData);
    },

    deleteRecord(tableName, id) {
        return this.save(tableName, 'delete', { id: id });
    },
    
    set(tableName, dataArray) {
        this.data[tableName] = dataArray;
    },

    // Compatibility helpers expected by legacy modules
    getAll(key) {
        return this.data[key] || [];
    },

    getById(key, id) {
        const arr = this.getAll(key);
        return arr.find(item => item && (item.id == id || item.id === id)) || null;
    },

    create(key, record) {
        if (!this.data[key]) this.data[key] = [];
        const id = record.id || (Date.now() + Math.floor(Math.random()*1000));
        const newItem = { ...record, id };
        this.data[key].push(newItem);
        return newItem;
    },

    remove(key, id) {
        if (!this.data[key]) return false;
        const before = this.data[key].length;
        this.data[key] = this.data[key].filter(item => item && item.id != id);
        return this.data[key].length < before;
    },

    update(key, id, patch) {
        const item = this.getById(key, id);
        if (!item) return null;
        Object.assign(item, patch);
        return item;
    },

    getSettings() {
        return this.data['settings'] && Object.keys(this.data['settings']).length ? this.data['settings'] : (this.data['settings'] || {});
    },

    getHomepage() {
        return this.data['homepage'] || {};
    },

    setSession(user) {
        try {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        } catch (e) { return null; }
    },

    getSession() {
        try {
            return JSON.parse(localStorage.getItem('currentUser')) || null;
        } catch(e){ return null; }
    },

    clearSession() {
        try { localStorage.removeItem('currentUser'); } catch(e) {}
    },

    getStats() {
        return { tablesLoaded: Object.keys(this.data).length };
    }
};

// Expose DataStore on window for scripts that check window.DataStore
try {
    if (typeof window !== 'undefined') {
        window.DataStore = DataStore;
    }
} catch (e) {}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataStore;
}