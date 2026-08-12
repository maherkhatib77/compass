/**
 * ============================================================================
 * מצפן נט - מודול ייבוא תקציבים (Budget Import Module)
 * ============================================================================
 * מודול לייבוא תקציבים מקבצי CSV/Excel עם ולידציות מלאות
 * בהתאם למבנה השנה התקציבית של משרד החינוך
 * ============================================================================
 */

const BudgetImport = (() => {
    
    // ======================== קבועים ומבני נתונים ========================
    
    const REQUIRED_FIELDS = [
        'קוד תקציב',
        'שנה עברית',
        'שנה לועזית',
        'תקופה',
        'סטטוס',
        'יחידה ארגונית',
        'תקציב עבור',
        'סכום'
    ];
    
    const OPTIONAL_FIELDS = [
        'תיאור',
        'הערה'
    ];
    
    const VALID_PERIODS = ['1', '2'];
    const VALID_STATUSES = ['ידוע', 'משוערך'];
    const VALID_BUDGET_FOR = ['פתרון למידה', 'אירוח'];
    
    // מיפוי שנים עבריות לשנים לועזיות
    const HEBREW_TO_ENGLISH_YEARS = {
        'תשפ"ד': { first: '2023', second: '2024' },
        'תשפ"ה': { first: '2024', second: '2025' },
        'תשפ"ו': { first: '2025', second: '2026' },
        'תשפ"ז': { first: '2026', second: '2027' },
        'תשפ"ח': { first: '2027', second: '2028' }
    };
    
    // משתנים פנימיים
    let uploadedFile = null;
    let parsedData = [];
    let validationResults = null;
    
    // ======================== פונקציות עזר ========================
    
    /**
     * בדיקה אם שדה הוא מספרי תקין
     */
    function isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }
    
    /**
     * בדיקה אם שנה לועזית תקינה (4 ספרות)
     */
    function isValidEnglishYear(year) {
        return /^\d{4}$/.test(String(year).trim());
    }
    
    /**
     * קבלת שנה לועזית מתאימה לתקופה ושנה עברית
     * @param {string} hebrewYear - שנה עברית
     * @param {string} period - תקופה (1 או 2)
     * @returns {object} - { expectedYear, firstYear, secondYear }
     */
    function getExpectedEnglishYear(hebrewYear, period) {
        const yearMap = HEBREW_TO_ENGLISH_YEARS[hebrewYear];
        if (!yearMap) {
            return null;
        }
        
        // תקופה 2 (09-12) → שנה ראשונה
        // תקופה 1 (01-08) → שנה שנייה
        const expectedYear = period === '2' ? yearMap.first : yearMap.second;
        
        return {
            expectedYear: expectedYear,
            firstYear: yearMap.first,
            secondYear: yearMap.second
        };
    }
    
    /**
     * בדיקה אם שנה עברית קיימת במערכת
     */
    function isHebrewYearActive(hebrewYear) {
        const periods = DataStore.getAll(DataStore.KEYS.PERIODS) || [];
        return periods.some(p => p.hebrewYear === hebrewYear && p.isActive);
    }
    
    /**
     * בדיקה אם יחידה ארגונית קיימת במערכת
     */
    function isOrganizationalUnitExists(unitName) {
        const institutions = DataStore.getAll(DataStore.KEYS.INSTITUTIONS) || [];
        const users = DataStore.getAll(DataStore.KEYS.USERS) || [];
        
        // בדיקה בשמות ובקודים
        return institutions.some(inst => 
            inst.name === unitName || 
            inst.nameAr === unitName || 
            inst.code === unitName
        );
    }
    
    /**
     * בדיקה אם קוד תקציב כבר קיים במערכת
     */
    function isBudgetCodeExists(code, excludeId = null) {
        const budgets = DataStore.getAll(DataStore.KEYS.BUDGETS) || [];
        return budgets.some(b => b.budgetCode === code && b.id !== excludeId);
    }
    
    /**
     * המרת שם שדה מאנגלית לעברית
     */
    function normalizeFieldName(field) {
        const mapping = {
            'budgetcode': 'קוד תקציב',
            'code': 'קוד תקציב',
            'hebrewyear': 'שנה עברית',
            'year': 'שנה עברית',
            'englishyear': 'שנה לועזית',
            'period': 'תקופה',
            'status': 'סטטוס',
            'estimationstatus': 'סטטוס',
            'organizationalunit': 'יחידה ארגונית',
            'unit': 'יחידה ארגונית',
            'budgetfor': 'תקציב עבור',
            'amount': 'סכום',
            'sum': 'סכום',
            'description': 'תיאור',
            'notes': 'הערה',
            'remark': 'הערה'
        };
        return mapping[field.toLowerCase().replace(/\s/g, '')] || field;
    }
    
    // ======================== קריאה ועיבוד קבצים ========================
    
    /**
     * קריאת קובץ CSV
     */
    function readCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split(/\r?\n/).filter(line => line.trim());
                    
                    if (lines.length < 2) {
                        reject(new Error('הקובץ ריק או מכיל שורה אחת בלבד'));
                        return;
                    }
                    
                    // ניתוח כותרות
                    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
                    const normalizedHeaders = headers.map(h => normalizeFieldName(h));
                    
                    // בניית אובייקטי נתונים
                    const data = [];
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
                        const row = {};
                        
                        headers.forEach((header, index) => {
                            row[normalizedHeaders[index]] = values[index] || '';
                        });
                        
                        row._rowNumber = i + 1; // מספר שורה בקובץ (1-based)
                        data.push(row);
                    }
                    
                    resolve(data);
                } catch (err) {
                    reject(new Error('שגיאה בקריאת קובץ CSV: ' + err.message));
                }
            };
            reader.onerror = () => reject(new Error('שגיאה בטעינת הקובץ'));
            reader.readAsText(file, 'UTF-8');
        });
    }
    
    /**
     * קריאת קובץ Excel (XLSX)
     */
    function readExcel(file) {
        return new Promise((resolve, reject) => {
            // בדיקה אם הספרייה זמינה
            if (typeof XLSX === 'undefined') {
                reject(new Error('ספריית Excel לא זמינה. יש לכלול את xlsx.full.min.js'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array', encoding: 'UTF-8' });
                    
                    // קריאת הגיליון הראשון
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    // המרה ל-JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                        defval: '',
                        raw: false
                    });
                    
                    // הוספת מספרי שורות ונימול שדות
                    const normalizedData = jsonData.map((row, index) => {
                        const normalizedRow = {};
                        Object.keys(row).forEach(key => {
                            const normalizedKey = normalizeFieldName(key);
                            normalizedRow[normalizedKey] = String(row[key]).trim();
                        });
                        normalizedRow._rowNumber = index + 2; // שורות Excel מתחילות מ-1, פלוס שורת כותרת
                        return normalizedRow;
                    });
                    
                    resolve(normalizedData);
                } catch (err) {
                    reject(new Error('שגיאה בקריאת קובץ Excel: ' + err.message));
                }
            };
            reader.onerror = () => reject(new Error('שגיאה בטעינת הקובץ'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    // ======================== ולידציות ========================
    
    /**
     * ביצוע ולידציה מלאה על כל שורה
     */
    function validateRow(row, allCodes) {
        const errors = [];
        
        // 1. בדיקת שדות חובה
        REQUIRED_FIELDS.forEach(field => {
            const value = row[field];
            if (!value || value.trim() === '') {
                errors.push({
                    field: field,
                    error: 'שדה חובה',
                    message: `שדה "${field}" הוא שדה חובה ולא יכול להיות ריק`
                });
            }
        });
        
        // אם יש שגיאות שדות חובה, מחזירים מיד
        if (errors.length > 0 && errors.some(e => e.error === 'שדה חובה')) {
            return errors;
        }
        
        // 2. ולידציית שנה עברית
        const hebrewYear = row['שנה עברית'];
        if (!HEBREW_TO_ENGLISH_YEARS[hebrewYear]) {
            errors.push({
                field: 'שנה עברית',
                error: 'פורמט לא תקין',
                message: `השנה העברית "${hebrewYear}" אינה בפורמט תקין. שנים אפשריות: ${Object.keys(HEBREW_TO_ENGLISH_YEARS).join(', ')}`
            });
        } else if (!isHebrewYearActive(hebrewYear)) {
            errors.push({
                field: 'שנה עברית',
                error: 'שנה לא פעילה',
                message: `השנה העברית "${hebrewYear}" אינה מוגדרת כפעילה במערכת`
            });
        }
        
        // 3. ולידציית תקופה
        const period = row['תקופה'];
        if (!VALID_PERIODS.includes(period)) {
            errors.push({
                field: 'תקופה',
                error: 'ערך לא תקין',
                message: `תקופה חייבת להיות 1 או 2 בלבד. הערך "${period}" אינו תקין`
            });
        }
        
        // 4. ולידציית שנה לועזית
        const englishYear = row['שנה לועזית'];
        if (!isValidEnglishYear(englishYear)) {
            errors.push({
                field: 'שנה לועזית',
                error: 'פורמט לא תקין',
                message: `השנה הלועזית "${englishYear}" חייבת להיות מספר בן 4 ספרות`
            });
        }
        
        // 5. ולידציית התאמת שילוש (קריטי!)
        if (HEBREW_TO_ENGLISH_YEARS[hebrewYear] && VALID_PERIODS.includes(period) && isValidEnglishYear(englishYear)) {
            const yearInfo = getExpectedEnglishYear(hebrewYear, period);
            if (yearInfo && englishYear !== yearInfo.expectedYear) {
                let expectedDesc = period === '2' 
                    ? `השנה הלועזית הראשונה (${yearInfo.firstYear})`
                    : `השנה הלועזית השנייה (${yearInfo.secondYear})`;
                
                errors.push({
                    field: 'התאמת שילוש',
                    error: 'אי-התאמה בין שנה עברית, תקופה ושנה לועזית',
                    message: `אי-התאמה: עבור שנה עברית "${hebrewYear}" ותקופה "${period}" (${period === '2' ? 'ספטמבר-דצמבר' : 'ינואר-אוגוסט'}), ` +
                             `השנה הלועזית הנדרשת היא ${expectedDesc}, אך הוזנה השנה "${englishYear}". ` +
                             `לתקופה 2 יש לשייך את השנה הלועזית הראשונה (${yearInfo.firstYear}), ` +
                             `ולתקופה 1 יש לשייך את השנה הלועזית השנייה (${yearInfo.secondYear}).`
                });
            }
        }
        
        // 6. ולידציית סטטוס
        const status = row['סטטוס'];
        if (!VALID_STATUSES.includes(status)) {
            errors.push({
                field: 'סטטוס',
                error: 'ערך לא תקין',
                message: `סטטוס חייב להיות "ידוע" או "משוערך" בלבד. הערך "${status}" אינו תקין`
            });
        }
        
        // 7. ולידציית יחידה ארגונית
        const orgUnit = row['יחידה ארגונית'];
        if (orgUnit && !isOrganizationalUnitExists(orgUnit)) {
            errors.push({
                field: 'יחידה ארגונית',
                error: 'יחידה לא קיימת',
                message: `היחידה הארגונית "${orgUnit}" אינה מוגדרת במערכת`
            });
        }
        
        // 8. ולידציית תקציב עבור
        const budgetFor = row['תקציב עבור'];
        if (!VALID_BUDGET_FOR.includes(budgetFor)) {
            errors.push({
                field: 'תקציב עבור',
                error: 'ערך לא תקין',
                message: `שדה "תקציב עבור" חייב להיות "פתרון למידה" או "אירוח" בלבד. הערך "${budgetFor}" אינו תקין`
            });
        }
        
        // 9. ולידציית סכום
        const amount = parseFloat(row['סכום']);
        if (isNaN(amount) || amount <= 0) {
            errors.push({
                field: 'סכום',
                error: 'סכום לא תקין',
                message: `הסכום חייב להיות מספר חיובי הגדול מ-0. הערך "${row['סכום']}" אינו תקין`
            });
        }
        
        // 10. בדיקת כפילות קוד תקציב בקובץ
        const budgetCode = row['קוד תקציב'];
        const codeCount = allCodes.filter(c => c === budgetCode).length;
        if (codeCount > 1) {
            errors.push({
                field: 'קוד תקציב',
                error: 'כפילות בקובץ',
                message: `קוד התקציב "${budgetCode}" מופיע יותר מפעם אחת בקובץ הייבוא`
            });
        }
        
        // 11. בדיקת כפילות מול תקציבים קיימים
        if (isBudgetCodeExists(budgetCode)) {
            errors.push({
                field: 'קוד תקציב',
                error: 'קוד קיים במערכת',
                message: `קוד התקציב "${budgetCode}" כבר קיים במערכת`
            });
        }
        
        return errors;
    }
    
    /**
     * ביצוע ולידציה מלאה על כל הנתונים
     */
    function validateAll(data) {
        const results = {
            totalRows: data.length,
            validRows: [],
            invalidRows: [],
            errorSummary: {},
            errorsByType: {}
        };
        
        // איסוף כל קודי התקציב לבדיקת כפילויות
        const allCodes = data.map(r => r['קוד תקציב']).filter(c => c);
        
        data.forEach(row => {
            const errors = validateRow(row, allCodes);
            
            if (errors.length === 0) {
                results.validRows.push(row);
            } else {
                results.invalidRows.push({
                    row: row,
                    rowNumber: row._rowNumber,
                    errors: errors
                });
                
                // סיכום שגיאות לפי סוג
                errors.forEach(err => {
                    const errorKey = err.error;
                    if (!results.errorsByType[errorKey]) {
                        results.errorsByType[errorKey] = [];
                        results.errorSummary[errorKey] = 0;
                    }
                    results.errorsByType[errorKey].push({
                        rowNumber: row._rowNumber,
                        field: err.field,
                        message: err.message
                    });
                    results.errorSummary[errorKey]++;
                });
            }
        });
        
        return results;
    }
    
    // ======================== ממשק משתמש ========================
    
    /**
     * הצגת דו"ח ולידציה
     */
    function showValidationReport(results) {
        const validCount = results.validRows.length;
        const invalidCount = results.invalidRows.length;
        const totalCount = results.totalRows;
        
        let html = `
            <div style="padding: 20px;">
                <div style="background: ${invalidCount === 0 ? '#f0fdf4' : '#fef2f2'}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: ${invalidCount === 0 ? '#16a34a' : '#dc2626'};">
                        ${invalidCount === 0 ? '✅ כל השורות תקינות!' : '⚠️ נמצאו שגיאות בקובץ'}
                    </h3>
                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                        <div><strong>סה״כ שורות:</strong> ${totalCount}</div>
                        <div><strong>שורות תקינות:</strong> <span style="color: #16a34a;">${validCount}</span></div>
                        <div><strong>שורות עם שגיאות:</strong> <span style="color: #dc2626;">${invalidCount}</span></div>
                    </div>
                </div>
        `;
        
        // הצגת סיכום שגיאות
        if (invalidCount > 0) {
            html += `<div class="card" style="margin-bottom: 20px;"><div class="card-body">
                <h4 style="margin: 0 0 15px 0;">📊 סיכום שגיאות לפי סוג:</h4>
                <div style="display: grid; gap: 10px;">`;
            
            Object.entries(results.errorSummary).forEach(([type, count]) => {
                html += `<div style="display: flex; justify-content: space-between; padding: 8px 12px; background: var(--gray-50); border-radius: 6px;">
                    <span>${type}</span>
                    <strong style="color: var(--secondary);">${count}</strong>
                </div>`;
            });
            
            html += `</div></div></div>`;
            
            // פירוט שורות עם שגיאות
            html += `<div class="card"><div class="card-body">
                <h4 style="margin: 0 0 15px 0;">📋 פירוט שורות עם שגיאות:</h4>
                <div style="max-height: 400px; overflow-y: auto;">`;
            
            results.invalidRows.forEach(item => {
                html += `<div style="border: 1px solid var(--gray-200); border-radius: 6px; padding: 12px; margin-bottom: 10px; background: #fef2f2;">
                    <div style="font-weight: 600; margin-bottom: 8px;">שורה ${item.rowNumber}: ${item.row['קוד תקציב'] || 'ללא קוד'}</div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">`;
                
                item.errors.forEach(err => {
                    html += `<div style="font-size: 13px; color: var(--gray-700);">
                        <strong style="color: var(--secondary);">${err.field}:</strong> ${err.message}
                    </div>`;
                });
                
                html += `</div></div>`;
            });
            
            html += `</div></div></div>`;
        }
        
        // כפתורי פעולה
        html += `<div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">`;
        
        if (validCount > 0) {
            html += `<button class="btn btn-primary" onclick="BudgetImport.importValidRows()">
                💾 ייבוא ${validCount} שורות תקינות
            </button>`;
        }
        
        if (invalidCount > 0) {
            html += `<button class="btn btn-outline" onclick="BudgetImport.downloadErrorReport()">
                📥 הורדת דוח שגיאות
            </button>`;
        }
        
        html += `<button class="btn btn-outline" onclick="BudgetImport.cancelImport()">
            ❌ ביטול
        </button>`;
        
        html += `</div></div>`;
        
        // הצגת המודל
        showModal(
            invalidCount === 0 ? '✅ ייבוא תקציבים - הצלחה' : '⚠️ ייבוא תקציבים - נמצאו שגיאות',
            html,
            '' // ללא כפתורים נוספים
        );
    }
    
    /**
     * ייבוא השורות התקינות
     */
    function importValidRows() {
        if (!validationResults || validationResults.validRows.length === 0) {
            showToast('אין שורות תקינות לייבוא', 'error');
            return;
        }
        
        let importedCount = 0;
        
        validationResults.validRows.forEach(row => {
            const hebrewYear = row['שנה עברית'];
            const period = row['תקופה'];
            const englishYear = row['שנה לועזית'];
            
            // המרת "תקציב עבור" לערכים הפנימיים
            const budgetForValue = row['תקציב עבור'] === 'אירוח' ? 'hosting' : 'learning_solution';
            
            const budgetData = {
                budgetCode: row['קוד תקציב'],
                hebrewYear: hebrewYear,
                englishYear: englishYear,
                period: period,
                estimationStatus: row['סטטוס'],
                organizationalUnit: row['יחידה ארגונית'],
                budgetFor: budgetForValue,
                amount: parseFloat(row['סכום']),
                description: row['תיאור'] || '',
                notes: row['הערה'] || '',
                planningBalance: parseFloat(row['סכום']), // ברירת מחדל
                managementBalance: 0,
                freeBudgetBalance: parseFloat(row['סכום']) // ברירת מחדל - כל הסכום פנוי
            };
            
            DataStore.create(DataStore.KEYS.BUDGETS, budgetData);
            importedCount++;
        });
        
        closeModal();
        showToast(`יובאו בהצלחה ${importedCount} תקציבים`, 'success');
        
        // רענון תצוגת התקציבים
        if (typeof App !== 'undefined' && App.renderBudgets) {
            App.renderBudgets();
        }
        
        // איפוס משתנים
        resetImport();
    }
    
    /**
     * הורדת דוח שגיאות לקובץ CSV
     */
    function downloadErrorReport() {
        if (!validationResults || validationResults.invalidRows.length === 0) {
            showToast('אין שגיאות להורדה', 'error');
            return;
        }
        
        let csv = 'מספר שורה,קוד תקציב,שדה,סוג שגיאה,הודעת שגיאה\n';
        
        validationResults.invalidRows.forEach(item => {
            item.errors.forEach(err => {
                const row = [
                    item.rowNumber,
                    `"${item.row['קוד תקציב'] || ''}"`,
                    `"${err.field}"`,
                    `"${err.error}"`,
                    `"${err.message.replace(/"/g, '""')}"`
                ];
                csv += row.join(',') + '\n';
            });
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `doh_shgiyot_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        
        showToast('דוח השגיאות הורד בהצלחה', 'success');
    }
    
    /**
     * ביטול ייבוא
     */
    function cancelImport() {
        closeModal();
        resetImport();
        showToast('תהליך הייבוא בוטל', 'info');
    }
    
    /**
     * איפוס משתני ייבוא
     */
    function resetImport() {
        uploadedFile = null;
        parsedData = [];
        validationResults = null;
    }
    
    // ======================== פונקציות ציבוריות ========================
    
    return {
        /**
         * אתחול תהליך ייבוא
         */
        async startImport(file) {
            try {
                uploadedFile = file;
                const fileName = file.name.toLowerCase();
                
                // בדיקת סוג קובץ
                if (fileName.endsWith('.csv')) {
                    parsedData = await readCSV(file);
                } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                    parsedData = await readExcel(file);
                } else {
                    throw new Error('סוג קובץ לא נתמך. יש לבחור קובץ CSV או Excel (XLSX)');
                }
                
                // בדיקת מבנה קובץ
                if (parsedData.length === 0) {
                    throw new Error('הקובץ ריק ואינו מכיל נתונים');
                }
                
                // בדיקת קיום עמודות חובה בשורה הראשונה
                const firstRow = parsedData[0];
                const missingFields = REQUIRED_FIELDS.filter(f => !(f in firstRow));
                
                if (missingFields.length > 0) {
                    throw new Error(`חסרות עמודות חובה בקובץ: ${missingFields.join(', ')}`);
                }
                
                // הצגת תצוגה מקדימה
                this.showPreview();
                
            } catch (err) {
                showToast('שגיאה בייבוא: ' + err.message, 'error');
                resetImport();
            }
        },
        
        /**
         * הצגת תצוגה מקדימה של 5 שורות ראשונות
         */
        showPreview() {
            const previewRows = parsedData.slice(0, 5);
            
            let html = `
                <div style="padding: 20px;">
                    <div style="background: var(--primary-bg); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: var(--primary);">📄 פרטי הקובץ</h4>
                        <div><strong>שם קובץ:</strong> ${uploadedFile.name}</div>
                        <div><strong>מספר שורות:</strong> ${parsedData.length}</div>
                        <div><strong>עמודות זוהו:</strong> ${Object.keys(parsedData[0]).filter(k => !k.startsWith('_')).join(', ')}</div>
                    </div>
                    
                    <h4 style="margin: 0 0 15px 0;">👁️ תצוגה מקדימה (5 שורות ראשונות):</h4>
                    <div style="overflow-x: auto;">
                        <table class="data-table" style="font-size: 12px;">
                            <thead>
                                <tr>
                                    ${REQUIRED_FIELDS.map(f => `<th>${f}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${previewRows.map(row => `
                                    <tr>
                                        ${REQUIRED_FIELDS.map(f => `<td>${row[f] || '—'}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="margin-top: 20px; display: flex; gap: 10px;">
                        <button class="btn btn-primary" onclick="BudgetImport.runValidation()">
                            ▶️ המשך לוולידציה
                        </button>
                        <button class="btn btn-outline" onclick="BudgetImport.cancelImport()">
                            ❌ ביטול
                        </button>
                    </div>
                </div>
            `;
            
            showModal('תצוגה מקדימה של ייבוא תקציבים', html, '');
        },
        
        /**
         * הרצת ולידציה מלאה
         */
        runValidation() {
            validationResults = validateAll(parsedData);
            showValidationReport(validationResults);
        },
        
        /**
         * ייבוא שורות תקינות (נקרא מה-UI)
         */
        importValidRows: importValidRows,
        
        /**
         * הורדת דוח שגיאות (נקרא מה-UI)
         */
        downloadErrorReport: downloadErrorReport,
        
        /**
         * ביטול ייבוא (נקרא מה-UI)
         */
        cancelImport: cancelImport,
        
        /**
         * קבלת מידע על שנים עבריות פעילות
         */
        getActiveHebrewYears() {
            const periods = DataStore.getAll(DataStore.KEYS.PERIODS) || [];
            return periods
                .filter(p => p.isActive)
                .map(p => p.hebrewYear);
        },
        
        /**
         * בדיקת התאמת שילוש (פונקציה לעזרה)
         */
        checkTripleMatch(hebrewYear, period, englishYear) {
            if (!HEBREW_TO_ENGLISH_YEARS[hebrewYear]) {
                return { valid: false, message: 'שנה עברית לא מוכרת' };
            }
            
            if (!VALID_PERIODS.includes(period)) {
                return { valid: false, message: 'תקופה לא תקינה' };
            }
            
            const yearInfo = getExpectedEnglishYear(hebrewYear, period);
            if (englishYear !== yearInfo.expectedYear) {
                return {
                    valid: false,
                    message: `אי-התאמה: עבור "${hebrewYear}" ותקופה "${period}", השנה הלועזית הנדרשת היא ${yearInfo.expectedYear}`
                };
            }
            
            return { valid: true, message: 'התאמה תקינה' };
        }
    };
})();

// הוספה לאובייקט App אם קיים
if (typeof App !== 'undefined') {
    App.BudgetImport = BudgetImport;
}
