/**
 * מודול אימות (Auth) - גרסה נקייה למסד נתונים
 */
const Auth = (function() {
    'use strict';

// שימוש בהגדרות הגלובליות מ-config.js לעבודה עם נתיבים יחסיים
const AUTH_API_BASE = window.AppConfig ? window.AppConfig.API_BASE_URL : '/api/';

const ROLE_LABELS = {
        system_admin:    'מנהל מערכת',
        system_operator: 'מפעיל מערכת',
        team_leader:     'חבר בצוות מוביל',
        guide:           'מדריך פסג"ה',
        admin:           'מנהל מערכת',
        manager:         'מנהל',
        instructor:      'מדריך',
        viewer:          'צופה'
    };

    const ROLE_BADGES = {
        system_admin:    'danger',
        system_operator: 'warning',
        team_leader:     'info',
        guide:           'primary',
        admin:           'danger',
        manager:         'warning',
        instructor:      'info',
        viewer:          'secondary'
    };

    function _normalizeRole(role) {
        if (!role) return 'viewer';
        
        // Normalize Hebrew roles to English
        const hebrewToEnglish = {
            'מנהל מערכת': 'system_admin',
            'מפעיל מערכת': 'system_operator',
            'חבר בצוות מוביל': 'team_leader',
            'מדריך פסג"ה': 'guide',
            'admin': 'system_admin'
        };
        
        return hebrewToEnglish[role] || role;
    }

    function _isAdminRole(role) {
        const normalized = _normalizeRole(role);
        return normalized === 'system_admin' || normalized === 'admin';
    }

    async function _loginOffline(username, password) {
        // מוודאים ש-DataStore אותחל לפני שמנסים לגשת למשתמשים
        if (typeof DataStore === 'undefined' || !DataStore.getAll) {
            console.error('[Auth] DataStore not available');
            return { success: false, message: 'מערכת הנתונים לא זמינה' };
        }
        
        const users = DataStore.getAll(DataStore.KEYS.USERS) || [];
        console.log('[Auth] Checking credentials against', users.length, 'users');
        
        const cleanUser = _sanitizeInput(username);
        const cleanPass = _sanitizeInput(password);
        
        const user = users.find(u => {
            const uUsername = _sanitizeInput(u.username);
            const uPassword = _sanitizeInput(u.password);
            console.log('[Auth] Comparing:', { input: cleanUser, stored: uUsername, passMatch: uPassword === cleanPass });
            return uUsername === cleanUser && uPassword === cleanPass;
        });
        
        if (!user) {
            console.warn('[Auth] Login failed - user not found or password mismatch');
            return { success: false, message: 'שם משתמש או סיסמה שגויים' };
        }
        
        console.log('[Auth] Login successful for user:', user.username);
        const session = DataStore.setSession(user);
        
        // שמירת המשתמש ב-localStorage כדי ש-isAuthenticated יעבוד
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');
        
        return { success: true, user: { ...user }, session };
    }

    function _sanitizeInput(input) {
        if (!input) return '';
        return String(input).trim();
    }

    /**
     * פונקציה להתחברות
     * @param {string} username - שם המשתמש
     * @param {string} password - הסיסמה
     * @returns {Promise} - מבטיח תוצאה של הצלחה או כישלון
     */
    async function login(username, password) {
        console.log('[Auth] מנסה להתחבר...', username);
        
        try {
            // בדיקה האם אנו בסביבה מקומית
            const isLocalhost = window.location.hostname === 'localhost' ||
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname === '' ||
                               window.location.protocol === 'file:';
            
            // בסביבה מקומית - נשתמש בנתוני localStorage/JSON
            if (isLocalhost) {
                console.log('[Auth] Local environment detected, using offline mode');
                return await _loginOffline(username, password);
            }
            
            // ניסיון התחברות מול ה-API החדש (רק בסביבת ייצור)
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 שניות timeout
            
            const response = await fetch(`${AUTH_API_BASE}login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    username: username,
                    password: password
                })
            });

            clearTimeout(timeoutId);

            // בדיקת סטטוס תגובה
            if (!response.ok) {
                const errText = await response.text();
                console.error('[Auth] שגיאת HTTP:', response.status, errText);
                throw new Error(`שגיאת שרת: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // שמירת המשתמש בזיכרון
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                localStorage.setItem('isLoggedIn', 'true');
                console.log('[Auth] התחברות הצליחה! מעביר לדאשבורד...');
            }

            return result;

        } catch (error) {
            console.error('[Auth] שגיאה חמורה:', error);
            return {
                success: false,
                message: 'שגיאת תקשורת: ' + error.message
            };
        }
    }

    function logout() {
        // מחיקת הטוקן מה-localStorage
        localStorage.removeItem('matspanet_token');
        localStorage.removeItem('matspanet_user');
        localStorage.removeItem('matspanet_token_expiry');
        
        // קריאה ל-API להתנתקות (אופציונלי)
        const token = localStorage.getItem('matspanet_token');
        if (token) {
            fetch(`${AUTH_API_BASE}logout.php`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).catch(() => {});
        }
        
        if (DataStore) {
            DataStore.clearSession();
        }
        
        window.location.href = './login.html';
    }

    /**
     * בדיקה אם המשתמש מחובר
     */
    function isAuthenticated() {
        return localStorage.getItem('currentUser') !== null;
    }

    /**
     * קבלת פרטי המשתמש
     */
    function getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }

    function getToken() {
        return localStorage.getItem('matspanet_token');
    }

    function requireAuth() {
        if (!isAuthenticated()) {
            window.location.href = './login.html';
            return false;
        }
        return true;
    }

    // ===== PERMISSION CHECKING =====
    function canViewSection(sectionId) {
        const user = getCurrentUser();
        if (!user) return false;
        if (_isAdminRole(user.role)) return true;
        if (!user.permissions || typeof user.permissions !== 'object') return true;
        const perm = user.permissions[sectionId];
        return perm === 'view' || perm === 'full';
    }

    function canFullSection(sectionId) {
        const user = getCurrentUser();
        if (!user) return false;
        if (_isAdminRole(user.role)) return true;
        if (!user.permissions || typeof user.permissions !== 'object') return true;
        return user.permissions[sectionId] === 'full';
    }

    function hasPermission(action) {
        const user = getCurrentUser();
        if (!user) return false;
        if (_isAdminRole(user.role)) return true;
        if (!user.permissions || typeof user.permissions !== 'object') return true;
        return Object.values(user.permissions).some(p => p === 'full');
    }

    function hasUserPermission(user, action) {
        if (!user) return false;
        if (_isAdminRole(user.role)) return true;
        if (!user.permissions || typeof user.permissions !== 'object') return true;
        return Object.values(user.permissions).some(p => p === 'full');
    }

    function canViewSolution(solution) {
        return true;
    }

    function canEditSolution(solution) {
        return canFullSection('solutions');
    }

    function canDeleteSolution(solution) {
        return canFullSection('solutions');
    }

    function setUserPermissions(userId, permissions) {
        if (DataStore) {
            DataStore.update(DataStore.KEYS.USERS, userId, { permissions: permissions });
        }
    }

    function resetUserPermissions(userId) {
        if (DataStore) {
            DataStore.update(DataStore.KEYS.USERS, userId, { permissions: {} });
        }
    }

    async function changePassword(userId, oldPassword, newPassword) {
        // ניסיון לשנות סיסמה דרך ה-API
        const token = getToken();
        if (token) {
            try {
                const response = await fetch(`${AUTH_API_BASE}update_user.php`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        action: 'change_password',
                        old_password: oldPassword,
                        new_password: newPassword
                    })
                });
                
                if (response.ok) {
                    return { success: true, message: 'הסיסמה שונתה בהצלחה' };
                }
                
                const errorData = await response.json().catch(() => ({}));
                return { success: false, message: errorData.detail || 'שינוי סיסמה נכשל' };
                
            } catch (error) {
                console.error('Password change error:', error);
            }
        }
        
        // Fallback למערכת הישנה
        if (DataStore) {
            const user = DataStore.getById(DataStore.KEYS.USERS, userId);
            if (!user) return { success: false, message: 'משתמש לא נמצא' };
            if (user.password !== oldPassword) return { success: false, message: 'סיסמה נוכחית שגויה' };
            if (newPassword.length < 4) return { success: false, message: 'הסיסמה החדשה חייבת להכיל לפחות 4 תווים' };
            DataStore.update(DataStore.KEYS.USERS, userId, { password: newPassword });
            return { success: true, message: 'הסיסמה שונתה בהצלחה' };
        }
        
        return { success: false, message: 'מערכת לא זמינה' };
    }

    async function createUser(userData) {
        const token = getToken();
        if (token) {
            try {
                const response = await fetch(`${AUTH_API_BASE}create_user.php`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    return { success: true, message: result.message || 'המשתמש נוצר בהצלחה' };
                }
                
                const errorData = await response.json().catch(() => ({}));
                return { success: false, message: errorData.detail || 'יצירת משתמש נכשלה' };
                
            } catch (error) {
                console.error('Create user error:', error);
            }
        }
        
        // Fallback למערכת הישנה
        if (DataStore) {
            const users = DataStore.getAll(DataStore.KEYS.USERS);
            if (users.find(u => u.username === userData.username)) {
                return { success: false, message: 'שם משתמש כבר קיים במערכת' };
            }
            const role = _normalizeRole(userData.role);
            const user = DataStore.create(DataStore.KEYS.USERS, { ...userData, role });
            return { success: true, user };
        }
        
        return { success: false, message: 'מערכת לא זמינה' };
    }

    function getAllUsers() {
        // Fallback למערכת הישנה - מחזיר מיד נתונים ללא המתנה
        return DataStore ? DataStore.getAll(DataStore.KEYS.USERS) : [];
    }

    async function getAllUsersAsync() {
        const token = getToken();
        if (token) {
            try {
                const response = await fetch(`${AUTH_API_BASE}get_users.php`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.data || [];
                }
            } catch (error) {
                console.error('Get users error:', error);
            }
        }
        
        // Fallback למערכת הישנה
        return DataStore ? DataStore.getAll(DataStore.KEYS.USERS) : [];
    }

    async function deleteUser(userId) {
        const token = getToken();
        if (token) {
            try {
                const response = await fetch(`${AUTH_API_BASE}delete_user.php`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId
                    })
                });
                
                if (response.ok) {
                    return { success: true };
                }
                
                const errorData = await response.json().catch(() => ({}));
                return { success: false, message: errorData.detail || 'מחיקת משתמש נכשלה' };
                
            } catch (error) {
                console.error('Delete user error:', error);
            }
        }
        
        // Fallback למערכת הישנה
        if (DataStore) {
            const session = DataStore.getSession();
            if (session && session.userId === userId) {
                return { success: false, message: 'לא ניתן למחוק את המשתמש הנוכחי' };
            }
            DataStore.remove(DataStore.KEYS.USERS, userId);
            return { success: true };
        }
        return true;
    }

    // חשיפת הפונקציות החוצה
    return {
        login: login,
        logout: logout,
        isAuthenticated: isAuthenticated,
        getCurrentUser: getCurrentUser,
        requireAuth: requireAuth,
        canViewSection: canViewSection,
        canFullSection: canFullSection,
        hasPermission: hasPermission,
        hasUserPermission: hasUserPermission,
        canViewSolution: canViewSolution,
        canEditSolution: canEditSolution,
        canDeleteSolution: canDeleteSolution,
        setUserPermissions: setUserPermissions,
        resetUserPermissions: resetUserPermissions,
        changePassword: changePassword,
        createUser: createUser,
        getAllUsers: getAllUsers,
        getAllUsersAsync: getAllUsersAsync,
        deleteUser: deleteUser,
        ROLE_LABELS: ROLE_LABELS,
        ROLE_BADGES: ROLE_BADGES
    };

})();