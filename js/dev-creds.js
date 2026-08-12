/* ================================================================
   מצפן נט — פרטי בדיקה מקומיים בלבד
   ================================================================
   ⚠️  חובה: אין להעלות קובץ זה לשרת הייצור!
   הוא נטען אוטומטית אך ורק בסביבה מקומית (localhost / file://).
   אם הקובץ לא קיים בשרת — פרטי הבדיקה לעולם לא יגיעו לשם.
   
   🛡️ אבטחה: קובץ זה מכיל סיסמאות לפיתוח בלבד!
   ================================================================ */

// הפונקציה מחזירה את פרטי הכניסה רק אם אנו בסביבת פיתוח מקומית
(function() {
    'use strict';
    
    // בדיקה האם אנו בסביבת פיתוח מקומית
    function isLocalhost() {
        return window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname === '' || // file://
               window.location.protocol === 'file:';
    }
    
    // הגדרת הפרטים רק בסביבה מקומית
    if (isLocalhost()) {
        window.__DEV_CREDS__ = [
          { role: 'מנהל מערכת',  user: 'admin',  pass: 'admin123' },
          { role: 'מדריך פסג״ה', user: 'guide1', pass: 'guide123' },
          { role: 'מדריך פסג״ה', user: 'guide2', pass: 'guide123' }
        ];
        
        console.log('[Dev] Dev credentials loaded for local testing');
    } else {
        // בסביבת ייצור - לא מגדירים כלום
        window.__DEV_CREDS__ = [];
        console.warn('[Security] Dev credentials disabled in production environment');
    }
})();