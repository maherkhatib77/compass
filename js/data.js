/**
 * data.js - גרסת מסד נתונים (DB First) - מתוקן
 * טוען רק טבלאות שקיימות כרגע כקבצי API או JSON.
 */

const DataStore = {
    data: {},
    isInitialized: false,

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
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataStore;
}