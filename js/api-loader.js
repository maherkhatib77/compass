/**
api-loader.js
גרסה מתוקנת: מזהה אוטומטית את נתיב הפרויקט (localhost/compass או ענן)
ומבצע בקשה מדויקת לקבצי ה-PHP.
*/

// פונקציה חכמה לבניית נתיב מלא לקובץ PHP ספציפי
function getPhpApiUrl(endpointName) {
    // מיפוי שמות ה-API לקבצי PHP פיזיים
    // ✅ תיקון: solutions ממפה ל-get_learning_solutions.php
    const fileMap = {
        'solutions': 'get_learning_solutions.php',  // ← שונה מ-get_solutions.php
        'users': 'get_users.php',
        'catalog': 'get_catalog.php'
    };
    
    const fileName = fileMap[endpointName] || `get_${endpointName}.php`;
    
    // זיהוי הנתיב הבסיסי של הדף הנוכחי
    const pathParts = window.location.pathname.split('/').filter(p => p.length > 0);
    
    let baseDir = '';
    if (pathParts.length > 0 && window.location.hostname === 'localhost') {
        baseDir = '/' + pathParts[0];
    }
    
    // בניית הנתיב הסופי
    return `${baseDir}/api/${fileName}`;
}

async function initApiData() {
    console.log('🔄 טוען נתונים מה-API החדש (PHP) עם זיהוי נתיב חכם...');
    
    try {
        // 1. טעינת פתרונות למידה
        const solutionsUrl = getPhpApiUrl('solutions');
        console.log('📡 מבצע בקשה ל:', solutionsUrl);
        
        const solutionsRes = await fetch(solutionsUrl);
        if (!solutionsRes.ok) {
            throw new Error(`שרת החזיר שגיאה ${solutionsRes.status}: ${solutionsRes.statusText}`);
        }
        
        const solutionsData = await solutionsRes.json();
        
        // עדכון המשתמש הגלובלי
        if (typeof window.DataStore !== 'undefined' && typeof DataStore.set === 'function') {
            DataStore.set('solutions', solutionsData.data || solutionsData || []);
        } else if (window.solutions) {
            window.solutions = solutionsData.data || solutionsData || [];
        }
        
        console.log(`✅ נטענו ${(solutionsData.data ? solutionsData.data.length : (Array.isArray(solutionsData) ? solutionsData.length : 0))} פתרונות מה-API`);
        
        // 2. טעינת משתמשים (אופציונלי)
        try {
            const usersUrl = getPhpApiUrl('users');
            const usersRes = await fetch(usersUrl);
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                const usersArray = usersData.data || usersData || [];
                
                if (typeof window.DataStore !== 'undefined' && typeof DataStore.set === 'function') {
                    if (window.location.hostname === 'localhost') {
                        if (usersArray.length && Object.prototype.hasOwnProperty.call(usersArray[0], 'password')) {
                            DataStore.set('users', usersArray);
                        } else {
                            const existing = DataStore.getAll && DataStore.getAll('users') ? DataStore.getAll('users') : [];
                            if (!existing || existing.length === 0) DataStore.set('users', []);
                        }
                    } else {
                        DataStore.set('users', usersArray);
                    }
                } else if (window.users) {
                    window.users = usersArray;
                }
                console.log(`✅ נטענו ${usersArray.length} משתמשים`);
            }
        } catch (usersError) {
            console.warn('⚠️ שגיאה בטעינת משתמשים:', usersError.message);
        }
        
        // 3. אתחול ממשק - רק אם לא ב-dashboard.html (שם App.init() יטפל בזה)
        const isDashboard = typeof window !== 'undefined' && window.location && window.location.pathname.includes('dashboard.html');
        if (!isDashboard) {
            setTimeout(() => {
                if (typeof renderSolutions === 'function') {
                    console.log('🎨 מרענן תצוגת פתרונות...');
                    renderSolutions();
                }
                // initDashboard אינה קיימת ב-app.js - משתמשים ב-renderDashboard דרך showSection
                if (typeof window.refreshAllViews === 'function') {
                    window.refreshAllViews();
                }
                console.log('✅ אתחול ממשק הושלם לאחר טעינת נתוני API');
            }, 500);
        } else {
            console.log('[api-loader] ⏭️ מדלג על אתחול ממשק - App.init() יטפל בזה');
        }
        
    } catch (error) {
        console.error('❌ שגיאה קריטית בטעינת ה-API:', error);
        console.error('💡 וודא שקובץ ה-PHP קיים בתיקיית api ומחזיר JSON תקין.');
    }
}

// חשיפה לפונקציה כדי ש-app.js יוכל להשתמש בה
if (typeof window !== 'undefined') {
    window.initApiData = initApiData;
}

// הפעלה אוטומטית - רק אם לא נטען מתוך dashboard.html
// הערה: ב-dashboard.html, DataStore.init() מפעיל את App.init() שמטפל בטעינת ה-API
// לכן אנו מונעים כאן אתחול כפול שעלול לגרום לשגיאות
if (typeof window !== 'undefined' && window.location && window.location.pathname.includes('dashboard.html')) {
    // אל תאתחל כאן - dashboard.html יטפל בזה
    console.log('[api-loader] ⏭️ מדלג על אתחול - dashboard.html יטפל בטעינה');
} else {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof window.DataStore !== 'undefined' && DataStore.init) {
                DataStore.init(false).then(initApiData).catch(initApiData);
            } else {
                initApiData();
            }
        });
    } else {
        if (typeof window.DataStore !== 'undefined' && DataStore.init) {
            DataStore.init(false).then(initApiData).catch(initApiData);
        } else {
            initApiData();
        }
    }
}