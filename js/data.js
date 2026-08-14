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

    async save(tableName, action, payload) {
        const apiUrl = this.getApiUrl(tableName);
        let method = 'POST';
        let body = payload;

        if (action === 'update') method = 'PUT';
        if (action === 'delete') method = 'DELETE';

        console.log(`📡 שולח בקשה ל-API: ${method} ${apiUrl}`, payload);

        try {
            const options = {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            };

            let urlToFetch = apiUrl;
            if (method === 'DELETE' && payload.id) {
                urlToFetch = `${apiUrl}?id=${payload.id}`;
                options.body = JSON.stringify({ id: payload.id });
            }

            const response = await fetch(urlToFetch, options);
            const result = await response.json();

            if (result.status === 'success' || response.ok) {
                console.log(`✅ נשמר בהצלחה ל-${tableName}`);
                
                if (action === 'create' && result.id) {
                    const newItem = { ...payload, id: result.id };
                    this.data[tableName].push(newItem);
                } else if (action === 'update') {
                    const index = this.data[tableName].findIndex(item => item.id == payload.id);
                    if (index !== -1) {
                        this.data[tableName][index] = { ...this.data[tableName][index], ...payload };
                    }
                } else if (action === 'delete') {
                    this.data[tableName] = this.data[tableName].filter(item => item.id != payload.id);
                }
                
                return { success: true, data: result };
            } else {
                throw new Error(result.error || 'שגיאה בשמירה');
            }

        } catch (error) {
            console.error(`❌ כשל בשמירה ל-${tableName}:`, error);
            alert('שגיאה בשמירת הנתונים לשרת.\n' + error.message);
            return { success: false, error: error.message };
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataStore;
}