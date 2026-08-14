/**
 * config.js
 * הגדרות גלובליות למערכת
 */
window.AppConfig = {
    // נתיב בסיס מלא ל-API ב-XAMPP תחת תיקיית compass
    API_BASE_URL: '/compass/api/',
    
    // פונקציה לבניית כתובות מלאות
    getApiUrl: function(endpoint) {
        // מיפוי שמות נקיים לקבצי PHP בפועל
        const fileMap = {
            'solutions': 'get_solutions.php',
            'users': 'get_users.php', // אם קיים
            'auth': 'auth.php'        // אם קיים
        };
        
        const fileName = fileMap[endpoint] || endpoint;
        return this.API_BASE_URL + fileName;
    }
};