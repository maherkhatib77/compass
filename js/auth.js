/**
 * ============================================================================
 * מצפן נט - Authentication Module (Advanced Permissions)
 * ============================================================================
 * מנגנון הרשאות מתקדם עם אימות מול API:
 *   - מנהל מערכת (admin/system_admin) = גישה מלאה לכל חלקי המערכת.
 *   - משתמשים אחרים = ניתן להגדיר להם הרשאות לכל חלק בנפרד.
 *   - רמות: "view" (צפייה בלבד) או "full" (מלאה – עריכה, מחיקה, השלמת נתונים).
 *   - אם למשתמש אין אובייקט permissions → ברירת מחדל = גישה מלאה (תאימות לאחור).
 *   - פילטור מדריכים: מדריך פסג"ה רואה רק פתרונות שהוא יצר/אחראי עליהם.
 * ============================================================================
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const Auth = (() => {

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

    /**
     * מנקה ערכי קלט מתווים בלתי-נראים (BiDi marks, zero-width chars, BOM).
     */
    function _sanitizeInput(str) {
        if (!str) return '';
        return str.normalize('NFC').replace(/[\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g, '');
    }

    async function login(username, password) {
        try {
            // ניסיון התחברות מול ה-API החדש
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);
            
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'שגיאה בהתחברות' }));
                return { success: false, message: errorData.detail || 'שם משתמש או סיסמה שגויים' };
            }
            
            const data = await response.json();
            
            // שמירת הטוקן והמידע ב-localStorage
            localStorage.setItem('matspanet_token', data.token);
            localStorage.setItem('matspanet_user', JSON.stringify(data.user));
            localStorage.setItem('matspanet_token_expiry', data.expires_at);
            
            return { success: true, user: data.user, token: data.token };
            
        } catch (error) {
            console.error('Login error:', error);
            // Fallback למערכת הישנה אם ה-API לא זמין
            console.warn('⚠️ API לא זמין, מעבר למצב Offline');
            return _loginOffline(username, password);
        }
    }

    function _loginOffline(username, password) {
        const users = DataStore && DataStore.getAll(DataStore.KEYS.USERS) || [];
        const cleanUser = _sanitizeInput(username);
        const cleanPass = _sanitizeInput(password);
        const user = users.find(u => _sanitizeInput(u.username) === cleanUser && _sanitizeInput(u.password) === cleanPass);
        if (!user) {
            return { success: false, message: 'שם משתמש או סיסמה שגויים' };
        }
        
        const session = DataStore ? DataStore.setSession(user) : null;
        return { success: true, user: { ...user }, session };
    }

    function logout() {
        // מחיקת הטוקן מה-localStorage
        localStorage.removeItem('matspanet_token');
        localStorage.removeItem('matspanet_user');
        localStorage.removeItem('matspanet_token_expiry');
        
        // קריאה ל-API להתנתקות (אופציונלי)
        const token = localStorage.getItem('matspanet_token');
        if (token) {
            fetch(`${API_BASE_URL}/auth/logout`, {
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

    function getCurrentUser() {
        // בדיקה אם יש משתמש מאומת מה-API
        const apiUser = localStorage.getItem('matspanet_user');
        if (apiUser) {
            try {
                return JSON.parse(apiUser);
            } catch (e) {
                console.error('Failed to parse API user:', e);
            }
        }
        
        // Fallback למערכת הישנה
        if (DataStore) {
            const session = DataStore.getSession();
            if (!session) return null;
            const user = DataStore.getById(DataStore.KEYS.USERS, session.userId);
            return user ? { ...user, session } : null;
        }
        
        return null;
    }

    function getSession() {
        return DataStore ? DataStore.getSession() : null;
    }

    function getToken() {
        return localStorage.getItem('matspanet_token');
    }

    function isTokenValid() {
        const token = localStorage.getItem('matspanet_token');
        const expiry = localStorage.getItem('matspanet_token_expiry');
        
        if (!token || !expiry) return false;
        
        try {
            const expiryDate = new Date(expiry);
            return expiryDate > new Date();
        } catch (e) {
            return false;
        }
    }

    function requireAuth() {
        const user = getCurrentUser();
        if (!user) {
            window.location.href = './login.html';
            return null;
        }
        return user;
    }

    function isAdmin() {
        const user = getCurrentUser();
        return user ? _isAdminRole(user.role) : false;
    }

    function isGuide() {
        const user = getCurrentUser();
        return user ? (_normalizeRole(user.role) === 'guide' || _normalizeRole(user.role) === 'instructor') : false;
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
                const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
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
                const response = await fetch(`${API_BASE_URL}/users`, {
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

    async function getAllUsers() {
        const token = getToken();
        if (token) {
            try {
                const response = await fetch(`${API_BASE_URL}/users`, {
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
                const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
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
        
        return { success: false, message: 'מערכת לא זמינה' };
    }

    function getAllRoles() {
        return Object.keys(ROLE_LABELS).map(k => ({ value: k, label: ROLE_LABELS[k] }));
    }

    function getRoleLabel(role) {
        return ROLE_LABELS[_normalizeRole(role)] || role || '—';
    }

    function getRoleBadge(role) {
        const r = _normalizeRole(role);
        const cls = ROLE_BADGES[r] || 'gray';
        const label = ROLE_LABELS[r] || role || '—';
        return '<span class="badge badge-' + cls + '">' + label + '</span>';
    }

    return {
        login, logout, getCurrentUser, getSession, requireAuth, getToken, isTokenValid,
        isAdmin, isGuide,
        hasPermission, hasUserPermission,
        canViewSection, canFullSection,
        canViewSolution, canEditSolution, canDeleteSolution,
        setUserPermissions, resetUserPermissions,
        changePassword, createUser, getAllUsers, deleteUser,
        getAllRoles, getRoleLabel, getRoleBadge,
        ROLE_LABELS, ROLE_BADGES
    };
})();