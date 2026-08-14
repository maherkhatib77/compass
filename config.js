/**
 * config.js
 * הגדרות גלובליות למערכת
 * פתרון לעבודה הן בסביבה מקומית (XAMPP) והן בענן (cPanel) ללא שינוי קוד.
 */

// זיהוי אוטומטי של כתובת הבסיס based on current location
// השימוש בנתיב יחסי ('/') מבטיח שהדפדפן ישלים את הכתובת הנכונה אוטומטית
const API_BASE_URL = '/compass/api/';

// הגדרת שמות הקבצים לתאימות עם קבצי ה-PHP שיצרנו
const API_ENDPOINTS = {
    users: 'get_users.php',
    solutions: 'get_solutions.php',
    // כאן נוסיף בהמשך את שאר הטבלאות ככל שניצור להן קבצי PHP
    // teams: 'get_teams.php',
    // projects: 'get_projects.php',
};

// פונקציה עוזרת לבניית URL מלא
function getApiUrl(endpointKey) {
    if (!API_ENDPOINTS[endpointKey]) {
        console.error(`API Endpoint not found for key: ${endpointKey}`);
        return null;
    }
    return `${API_BASE_URL}${API_ENDPOINTS[endpointKey]}`;
}

// ייצוא המשתנים והפונקציות לשימוש בקבצים אחרים
window.AppConfig = {
    API_BASE_URL,
    API_ENDPOINTS,
    getApiUrl
};

console.log('✅ System Config Loaded. Base API URL:', API_BASE_URL);
