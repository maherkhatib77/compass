/**
 * data.js - גרסת מסד נתונים (DB First) - מתוקן
 * טוען טבלאות מ-API או JSON fallback
 */
const DataStore = {
    data: {},
    isInitialized: false,

    KEYS: {
        USERS: 'users',
        SOLUTIONS: 'learning_solutions',
        PERIODS: 'periods',
        BUDGETS: 'budgets',
        REGISTRATIONS: 'registrations',
        GUIDES_REPO: 'guides_repo',
        FAQ_DATA: 'faq_data',
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
        INSTITUTIONS: 'lookup_schools',
        CUSTOM_PAGES: 'custom_pages',
        HOMEPAGE: 'homepage_settings',
        SETTINGS: 'system_settings',
        ACTIVITY_LOG: 'activity_log',
        CATALOG_ENTRIES: 'catalog_entries',
        CATALOG_ITEMS: 'catalog_items',
        CATEGORIES: 'categories',
        LOOKUP_ALLOCATION_STATUS: 'lookup_allocation_status',
        LOOKUP_BROAD_TOPICS: 'lookup_broad_topics',
        LOOKUP_CERTIFIED_LECTURER: 'lookup_certified_lecturer',
        LOOKUP_DESIGNATED_PROGRAMS: 'lookup_designated_programs',
        LOOKUP_EXPERT_FIELD: 'lookup_expert_field',
        LOOKUP_LECTURER_STATUS: 'lookup_lecturer_status',
        LOOKUP_PERFORMER_TYPES: 'lookup_performer_types',
        LOOKUP_SOLUTION_STATUS: 'lookup_solution_status',
        PEDAGOGICAL_EXECUTORS: 'pedagogical_executors',
        REGIONS: 'regions',
        SESSIONS: 'sessions',
        SOLUTION_COMMENTS: 'solution_comments',
        SOLUTION_TYPES: 'solution_types',
        SUPERVISORS: 'supervisors',
        SYSTEM_SETTINGS: 'system_settings',
        RECYCLE_BIN: 'recycle_bin',
        INSPECTORS: 'inspectors',
        LOOKUP_SCHOOLS: 'lookup_schools'
    },

    async init(useCache = false) {
        console.log('🔄 DataStore: מאתחל מול מסד נתונים (API)...');
        const tables = [
            'lookup_week_days',
			'system_settings',
			'lookup_domains',
			'lookup_education_stages',
			'lookup_education_types',
			'lookup_meeting_types',
			'lookup_budget_types',
			'lookup_field_knowledge',
			'lookup_role_holders',
			'lookup_responsibility_types',
            'learning_solutions',
            'users',
            'periods',
            'budgets',
            'registrations',
            'catalog_entries',
            'catalog_items',
            'categories',
            'lookup_allocation_status',
            'lookup_broad_topics',
            'lookup_certified_lecturer',
            'lookup_designated_programs',
            'lookup_expert_field',
            'lookup_lecturer_status',
            'lookup_performer_types',
            'lookup_solution_status',
            'pedagogical_executors',
            'regions',
            'sessions',
            'solution_comments',
            'solution_types',
            'supervisors',
            'system_settings',
            'recycle_bin',
            'inspectors',
            'lookup_schools',
            'homepage_settings',
            'guides_repo',
            'mentors',
            'solution_instructors',
            'faq_data',
            'custom_pages',
            'activity_log',
            'institutions'
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
            // Normalize lookup tables
            if (tableName && tableName.startsWith('lookup_') && Array.isArray(this.data[tableName])) {
                this.data[tableName] = this.data[tableName].map(row => {
                    const value = row.code ?? row.value ?? row.id ?? row.name_he ?? '';
                    const label = row.name_he ?? row.label ?? row.name ?? row.nameHe ?? '';
                    const labelAr = row.name_ar ?? row.label_ar ?? row.labelAr ?? '';
                    let order = row.order ?? null;
                    if ((order === null || order === undefined) && row.extra_data) {
                        try {
                            const ex = (typeof row.extra_data === 'string') ? JSON.parse(row.extra_data) : row.extra_data;
                            if (ex && (ex.sort_order || ex.order)) order = ex.sort_order || ex.order;
                        } catch (e) { /* ignore */ }
                    }
                    const isActive = (row.is_active === undefined || row.is_active === null) ? true : (row.is_active != 0 && row.is_active !== '0');
                    return Object.assign({}, row, {
                        value: value,
                        label: label,
                        labelAr: labelAr,
                        order: order,
                        isActive: isActive
                    });
                });
            }
            // Users fallback for local dev
            if (tableName === 'users' && Array.isArray(this.data[tableName]) && this.data[tableName].length) {
                const first = this.data[tableName][0];
                if (first && !Object.prototype.hasOwnProperty.call(first, 'password')) {
                    try {
                        const fallbackRes = await fetch('./data/users.json');
                        if (fallbackRes.ok) {
                            this.data[tableName] = await fallbackRes.json();
                        }
                    } catch (e) { /* keep API data */ }
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
        const fileMap = {
            'solutions': 'get_learning_solutions.php'
        };
        const fileName = fileMap[tableName] || `get_${tableName}.php`;
        return `${baseDir}/api/${fileName}`;
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
        if (tableName === 'lookup_week_days') {
            return `${baseDir}/api/get_lookup_week_days.php`;
        }
        return `${baseDir}/api/data-crud.php`;
    },

    async save(tableName, action, payload) {
        const apiUrl = this.getCrudUrl(tableName);
        let method = 'POST';
        if (action === 'update') method = 'PUT';
        if (action === 'delete') method = 'DELETE';
        const dataWrapper = { table: tableName, data: payload };
        console.log(`📡 שולח בקשה ל-CRUD API: ${method} ${apiUrl}`, dataWrapper);
        try {
            let urlToFetch = apiUrl;
            const options = { method, headers: { 'Content-Type': 'application/json' } };
            if (method === 'DELETE') {
                if (payload && payload.id) {
                    urlToFetch = `${apiUrl}?table=${encodeURIComponent(tableName)}&id=${encodeURIComponent(payload.id)}`;
                    options.body = JSON.stringify({ id: payload.id, table: tableName });
                } else {
                    options.body = JSON.stringify(dataWrapper);
                }
            } else if (method === 'PUT') {
                if (payload && payload.id) {
                    urlToFetch = `${apiUrl}?table=${encodeURIComponent(tableName)}&id=${encodeURIComponent(payload.id)}`;
                }
                options.body = JSON.stringify(dataWrapper);
            } else {
                options.body = JSON.stringify(dataWrapper);
            }
            const response = await fetch(urlToFetch, options);
            const result = await response.json().catch(() => ({}));
            if ((result && result.success === true) || response.ok) {
                console.log(`✅ נשמר בהצלחה ל-${tableName}`, result);
                if ((method === 'DELETE') && result && typeof result.affectedRows !== 'undefined' && Number(result.affectedRows) === 0) {
                    const errMsg = result && (result.error || result.message) ? (result.error || result.message) : 'No rows affected';
                    throw new Error(`Server reported 0 affected rows: ${errMsg}`);
                }
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
                return { success: true, data: result };
            } else {
                const errMsg = (result && (result.error || result.message)) || `HTTP ${response.status}`;
                throw new Error(errMsg);
            }
        } catch (error) {
            console.error(`❌ כשל בשמירה ל-${tableName}:`, error);
            if (typeof showToast === 'function') {
                showToast('שגיאה בשמירת הנתונים לשרת: ' + error.message, 'error');
            }
            return { success: false, error: error.message };
        }
    },

    async saveAll(key, records) {
        const safeRecords = Array.isArray(records) ? records : [];
        this.data[key] = safeRecords;
        try {
            const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '/';
            const match = path.match(/^(?:\/[^/]+)?/);
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

    getAll(key) {
        return this.data[key] || [];
    },

    getById(key, id) {
        const arr = this.getAll(key);
        return arr.find(item => item && (item.id == id || item.id === id)) || null;
    },

    create(key, record) {
        if (!this.data[key]) this.data[key] = [];
        const tempId = record.id || ('tmp_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
        const newItem = { ...record, id: tempId };
        this.data[key].push(newItem);
        (async () => {
            try {
                const res = await this.save(key, 'create', record);
                if (res && res.success) {
                    const serverId = res.id || (res.record && res.record.id) || null;
                    if (serverId) {
                        const idx = this.data[key].findIndex(i => i && i.id === tempId);
                        if (idx !== -1) this.data[key][idx] = { ...this.data[key][idx], id: serverId };
                        console.log(`✅ Persisted new ${key} as id=${serverId}`);
                    }
                } else {
                    const idx = this.data[key].findIndex(i => i && i.id === tempId);
                    if (idx !== -1) this.data[key].splice(idx, 1);
                    console.error(`❌ Server rejected create for ${key}:`, res && res.error ? res.error : res);
                    try { alert('שגיאה ביצירת רשומה בשרת: ' + (res && res.error ? res.error : 'Unknown error')); } catch(e) {}
                }
            } catch (e) {
                const idx = this.data[key].findIndex(i => i && i.id === tempId);
                if (idx !== -1) this.data[key].splice(idx, 1);
                console.error('❌ Failed to persist create for', key, e);
                if (typeof showToast === 'function') {
                    showToast('שגיאה ביצירת רשומה בשרת: ' + e.message, 'error');
                }
            }
        })();
        return newItem;
    },

    remove(key, id) {
        if (!this.data[key]) return false;
        const beforeArr = (this.data[key] || []).slice();
        this.data[key] = this.data[key].filter(item => item && item.id != id);
        (async () => {
            try {
                const res = await this.save(key, 'delete', { id: id });
                if (res && res.success) {
                    console.log(`✅ Deleted ${key} id=${id} on server`);
                } else {
                    this.data[key] = beforeArr;
                    console.error(`❌ Server rejected delete for ${key} id=${id}:`, res && res.error ? res.error : res);
                    try { alert('שגיאה במחיקת הרשומה בשרת: ' + (res && res.error ? res.error : 'Unknown error')); } catch(e) {}
                }
            } catch (e) {
                this.data[key] = beforeArr;
                console.error('❌ Failed to persist delete for', key, id, e);
                if (typeof showToast === 'function') {
                    showToast('שגיאה במחיקת הרשומה בשרת: ' + e.message, 'error');
                }
            }
        })();
        return true;
    },

    update(key, id, patch) {
        const item = this.getById(key, id);
        if (!item) return null;
        const oldCopy = Object.assign({}, item);
        Object.assign(item, patch);
        (async () => {
            try {
                const res = await this.save(key, 'update', item);
                if (res && res.success && res.record) {
                    const idx = this.data[key].findIndex(i => i && i.id == id);
                    if (idx !== -1) this.data[key][idx] = { ...this.data[key][idx], ...res.record };
                    console.log(`✅ Updated ${key} id=${id} on server`);
                } else {
                    const idx = this.data[key].findIndex(i => i && i.id == id);
                    if (idx !== -1) this.data[key][idx] = oldCopy;
                    console.error(`❌ Server rejected update for ${key} id=${id}:`, res && res.error ? res.error : res);
                    try { alert('שגיאה בעדכון הרשומה בשרת: ' + (res && res.error ? res.error : 'Unknown error')); } catch(e) {}
                }
            } catch (e) {
                const idx = this.data[key].findIndex(i => i && i.id == id);
                if (idx !== -1) this.data[key][idx] = oldCopy;
                console.error('❌ Failed to persist update for', key, id, e);
                if (typeof showToast === 'function') {
                    showToast('שגיאה בעדכון הרשומה בשרת: ' + e.message, 'error');
                }
            }
        })();
        return item;
    },

getSettings() {
    // תמיכה בשני המפתחות: settings ו-system_settings
    const settings = this.data['settings'] || this.data['system_settings'] || {};
    return Object.keys(settings).length ? settings : {};
},

updateSettings(updates) {
    const current = this.getSettings();
    const merged = { ...current, ...updates };
    this.data['settings'] = merged;
    this.data['system_settings'] = merged;
    
    // שמירה לשרת דרך save_system_settings.php
    (async () => {
        try {
            const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '/';
            const match = path.match(/^(?:\/[^/]+)?/);
            const baseDir = match && match[0] && match[0] !== '/' ? match[0] : '';
            const saveUrl = `${baseDir}/api/save_system_settings.php`;
            const response = await fetch(saveUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(merged)
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || result.success !== true) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }
            console.log('✅ Settings saved to server');
        } catch(e) {
            // fallback ל-localStorage
            try {
                localStorage.setItem('compass_data_settings', JSON.stringify(merged));
            } catch (err) {}
            console.warn('⚠️ Failed to save settings to server:', e);
        }
    })();
    
    return merged;
},

getHomepage() {
    const raw = this.data['homepage_settings'] || [];
    
    // אם כבר יש אובייקט שטוח, החזר אותו
    if (!Array.isArray(raw)) return raw;
    
    // בניית אובייקט שטוח ממערך סקשנים
    const flat = {
        navItems: [],
        sidebarItems: [],
        mainContent: { combined: '', he: '', ar: '' },
    };
    
    raw.forEach(function(section) {
        const key = section.sectionKey || section.section_key;
        let content = section.content || section.contentJson || section.content_json;
        
        // פענוח JSON אם צריך
        if (typeof content === 'string') {
            try { content = JSON.parse(content); } catch(e) { content = null; }
        }
        
        switch (key) {
            case 'nav_items':
                flat.navItems = Array.isArray(content) ? content : [];
                break;
            case 'sidebar_items':
                flat.sidebarItems = Array.isArray(content) ? content : [];
                break;
            case 'main_content':
                flat.mainContent = content || { combined: '', he: '', ar: '' };
                break;
        }
    });
    
    return flat;
},

// ✅ הוסף פונקציה חדשה: המרת מערך סקשנים לאובייקט
getHomepageSections() {
    const sections = this.data['homepage_settings'] || [];
    const result = {};
    if (Array.isArray(sections)) {
        sections.forEach(function(section) {
            const key = section.sectionKey || section.section_key;
            if (key) {
                result[key] = section.content || section.contentJson || {};
            }
        });
    }
    return result;
},

// ✅ הוסף את הפונקציה הזו אחרי getHomepage
updateHomepage(updates) {
    const current = this.getHomepage();
    const updated = Object.assign({}, current, updates);
    this.data['homepage_settings'] = updated;

    // שמירה לטבלת homepage_settings דרך data-crud.php
    (async () => {
        try {
            const sections = {
                'site_info': {
                    logo: updated.logo || '',
                    siteName: updated.siteName || {},
                    footerText: updated.footerText || {}
                },
                'main_content': updated.mainContent || {},
                'nav_items': updated.navItems || [],
                'sidebar_items': updated.sidebarItems || []
            };

            for (const [sectionKey, content] of Object.entries(sections)) {
                const crudUrl = this.getCrudUrl('homepage_settings');
                const url = `${crudUrl}?table=homepage_settings&section=${encodeURIComponent(sectionKey)}`;

                await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        table: 'homepage_settings',
                        section_key: sectionKey,
                        data: { content_json: JSON.stringify(content) }
                    })
                });
            }
            console.log('✅ Homepage settings saved to homepage_settings table');
        } catch (e) {
            console.warn('⚠️ Failed to save homepage settings to table:', e);
            // Fallback: שמירה ל-data-save.php (JSON)
            try {
                const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '/';
                const match = path.match(/^(?:\/[^/]+)?/);
                const baseDir = match && match[0] && match[0] !== '/' ? match[0] : '';
                const saveUrl = `${baseDir}/api/data-save.php`;
                await fetch(saveUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: 'homepage_settings.json', data: updated })
                });
            } catch (e2) {
                console.warn('⚠️ Fallback save also failed:', e2);
            }
        }
    })();

    return updated;
},

// פונקציית עזר לשמירת מקטע בודד לטבלה
_saveHomepageSection(sectionKey, content) {
    const crudUrl = this.getCrudUrl('homepage_settings');
    const url = `${crudUrl}?table=homepage_settings&section=${encodeURIComponent(sectionKey)}`;
    
    return fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            table: 'homepage_settings',
            section_key: sectionKey,
            data: { content_json: JSON.stringify(content) }
        })
    }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    });
},

updateSettings(updates) {
    const current = this.getSettings();
    const updated = Object.assign({}, current, updates);
    this.data['settings'] = updated;
    // שמירה לשרת (fire-and-forget)
    (async () => {
        try {
            const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '/';
            const match = path.match(/^(?:\/[^/]+)?/);
            const baseDir = match && match[0] && match[0] !== '/' ? match[0] : '';
            const saveUrl = `${baseDir}/api/data-save.php`;
            const response = await fetch(saveUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: 'settings.json', data: updated })
            });
            const result = await response.json().catch(() => ({}));
            if (response.ok && result.success !== false) {
                console.log('✅ Settings saved');
            } else {
                console.warn('⚠️ Settings save response:', result);
            }
        } catch(e) {
            console.warn('⚠️ Failed to save settings:', e);
        }
    })();
    return updated;
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
        } catch(e) { return null; }
    },

    clearSession() {
        try { localStorage.removeItem('currentUser'); } catch(e) {}
    },

    getStats() {
        return { tablesLoaded: Object.keys(this.data).length };
    }
};

// Expose DataStore on window
try {
    if (typeof window !== 'undefined') {
        window.DataStore = DataStore;
    }
} catch (e) {}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataStore;
}