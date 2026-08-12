/**
 * api-loader.js
 * אחראי על טעינת נתונים משרת ה-API (Python/FastAPI) 
 * וזריקתם למערכת במקום קריאת קבצי JSON ישירים.
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * פונקציה ראשית לאתחול הטעינה
 */
async function initApiData() {
    console.log('🔄 טוען נתונים מה-API החדש...');

    try {
        // 1. טעינת פתרונות למידה
        const solutionsRes = await fetch(`${API_BASE_URL}/solutions`);
        if (!solutionsRes.ok) throw new Error('נכשל בטעינת פתרונות');
        const solutionsData = await solutionsRes.json();
        
        // עדכון המשתמש הגלובלי אם קיים
        if (typeof window.DataStore !== 'undefined' && typeof DataStore.set === 'function') {
             DataStore.set('solutions', solutionsData.data || []);
        } else if (window.solutions) {
             window.solutions = solutionsData.data || [];
        }
        console.log(`✅ נטענו ${solutionsData.count || 0} פתרונות מה-API`);

        // 2. טעינת משתמשים
        const usersRes = await fetch(`${API_BASE_URL}/users`);
        if (!usersRes.ok) throw new Error('נכשל בטעינת משתמשים');
        const usersData = await usersRes.json();
        
        if (typeof window.DataStore !== 'undefined' && typeof DataStore.set === 'function') {
            DataStore.set('users', usersData.data || []);
        } else if (window.users) {
            window.users = usersData.data || [];
        }
        console.log(`✅ נטענו ${usersData.count || 0} משתמשים`);

        // 3. זיהוי וביצוע אתחול ממשק (UI Initialization) - רק פונקציות שקיימות בפועל
        setTimeout(() => {
            // נסה לאתחל פתרונות אם הפונקציה קיימת
            if (typeof renderSolutions === 'function') {
                console.log('🎨 מרענן תצוגת פתרונות...');
                renderSolutions();
            }
            
            // נסה לאתחל דשבורד אם הפונקציה קיימת
            if (typeof initDashboard === 'function') {
                console.log('🎨 מאתחל דשבורד...');
                initDashboard();
            }

            // נסה לקרוא לפונקציה גלובלית לרענון כללי אם קיימת ב-data.js או app.js
            if (typeof window.refreshAllViews === 'function') {
                window.refreshAllViews();
            }
            
            console.log('✅ אתחול ממשק הושלם לאחר טעינת נתוני API');
        }, 800); // המתנה קלה כדי לוודא שכל הסקריפטים האחרים נטענו

    } catch (error) {
        console.error('❌ שגיאה קריטית בטעינת ה-API:', error);
        // אל תציג alert מפניע אלא אם חובה, מסתפקים בקונסול בינתיים
        // alert('שגיאה בטעינת נתונים מהשרת. וודא ש-python main.py רץ בחלון נפרד.');
    }
}

// הפעלה אוטומטית כאשר הדף מוכן
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof window.DataStore !== 'undefined' && DataStore.init) {
            DataStore.init(false).then(initApiData).catch(initApiData);
        } else {
            initApiData();
        }
    });
} else {
    // הדף כבר נטען, הרץ מיד
    if (typeof window.DataStore !== 'undefined' && DataStore.init) {
        DataStore.init(false).then(initApiData).catch(initApiData);
    } else {
        initApiData();
    }
}