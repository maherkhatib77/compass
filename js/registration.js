/**
 * ============================================================================
 * מצפן נט - Early Registration Page (רישום מוקדם)
 * ============================================================================
 * Public-facing page for teachers to register for learning solutions (השתלמויות).
 * No login required. Data saved to DataStore.REGISTRATIONS.
 *
 * URL: registration.html?solution=SOLUTION_ID
 * ============================================================================
 */

const RegistrationPage = (() => {

    // ======================== DOM References ========================
    const $ = (id) => document.getElementById(id);

    let currentSolution = null;   // { id, name } — the solution being registered for
    let allInstitutions = [];     // cached institution list (from institutions.json)
    let selectedInstitutions = []; // array of { code, name, nameAr }
    let currentLang = 'he';      // display language from system settings ('he' or 'ar')

    // ======================== Initialization ========================

    /**
     * Main init — waits for DataStore then sets up the page (with 6s safety timeout).
     */
    function init() {
        // Set footer year
        const yearEl = $('footerYear');
        if (yearEl) yearEl.textContent = new Date().getFullYear();

        if (DataStore.init && typeof DataStore.init === 'function') {
            var _initTimeout = setTimeout(function() {
                console.warn('[Registration] DataStore.init timed out, starting setup anyway.');
                setup();
            }, 6000);
            DataStore.init(false).then(function() {
                clearTimeout(_initTimeout);
                setup();
            }).catch(function(err) {
                clearTimeout(_initTimeout);
                console.error('[Registration] DataStore init failed:', err);
                setup();
            });
        } else {
            setup();
        }
    }

    /**
     * Setup after DataStore is ready.
     */
    function setup() {
        // 1. Detect language from settings (automatic, no user toggle)
        const settings = DataStore.getSettings();
        currentLang = (settings && settings.language) || 'he';
        applyLanguage(currentLang);

        // 2. Parse solution from URL
        const solutionId = new URLSearchParams(window.location.search).get('solution');
        loadSolution(solutionId);

        // 3. Populate dropdowns
        populateInstitutions();
        populateRoles();

        // 4. Bind events
        bindEvents();
    }

    // ======================== Language Management ========================

    /**
     * Apply language to the page — update HTML attributes, GlobalUI, and placeholder text.
     * Language is determined automatically from system settings; no manual toggle.
     */
    function applyLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = lang === 'ar' ? 'ar' : 'he';
        document.documentElement.dir = 'rtl'; // Both Hebrew and Arabic are RTL

        // Apply GlobalUI if available
        if (typeof GlobalUI !== 'undefined') GlobalUI.apply(lang);

        // Update institution search placeholder based on language
        const searchInput = $('institutionSearch');
        if (searchInput) {
            searchInput.placeholder = lang === 'ar'
                ? '🔍 ابحث بالرمز أو اسم المؤسسة...'
                : '🔍 חפש לפי סמל, שם...';
        }
    }

    // ======================== Data Loading ========================

    /**
     * Load solution info and display badge.
     */
    function loadSolution(solutionId) {
        const badge = $('solutionBadge');
        const nameEl = $('solutionName');

        if (!solutionId) {
            if (badge) badge.style.display = 'none';
            currentSolution = null;
            return;
        }

        const solution = DataStore.getById(DataStore.KEYS.SOLUTIONS, solutionId);
        if (solution) {
            currentSolution = { id: solution.id, name: solution.name };
            if (nameEl) nameEl.textContent = solution.name;
            if (badge) badge.style.display = 'inline-flex';
        } else {
            currentSolution = { id: solutionId, name: 'פתרון למידה' };
            if (nameEl) nameEl.textContent = 'פתרון למידה (לא נמצא)';
            if (badge) badge.style.display = 'inline-flex';
        }
    }

    // ======================== Institution Autocomplete (Multi-Tag) ========================

    /**
     * Load schools from DataStore (LOOKUP_SCHOOLS → lookup_schools.json)
     * and set up multi-tag autocomplete.
     */
    function populateInstitutions() {
        allInstitutions = (DataStore.getAll(DataStore.KEYS.LOOKUP_SCHOOLS) || [])
            .filter(function(s) { return s.isActive !== false; });

        // Set up search input
        const searchInput = $('institutionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', onInstitutionSearchInput);
            searchInput.addEventListener('focus', onInstitutionSearchInput);
        }

        // Click on wrapper focuses input
        const wrapper = $('institutionWrapper');
        if (wrapper && searchInput) {
            wrapper.addEventListener('click', function(e) {
                if (e.target === wrapper || e.target.id === 'institutionTags') {
                    searchInput.focus();
                }
            });
        }

        // Close suggestions on click outside
        document.addEventListener('click', function(e) {
            const sugBox = $('schoolSuggestions');
            const wrapper = $('institutionWrapper');
            if (sugBox && wrapper && !sugBox.contains(e.target) && !wrapper.contains(e.target)) {
                sugBox.style.display = 'none';
            }
        });
    }

    /**
     * Get set of already-selected institution codes (for filtering duplicates).
     */
    function getSelectedCodes() {
        return selectedInstitutions.map(function(inst) { return inst.code; });
    }

    /**
     * Filter schools based on search input and show suggestions dropdown.
     * Excludes already-selected schools.
     * Searches in code, name, educationStage, principalName, inspectorName.
     */
    function onInstitutionSearchInput() {
        const searchInput = $('institutionSearch');
        const sugBox = $('schoolSuggestions');
        if (!searchInput || !sugBox) return;

        const q = (searchInput.value || '').trim().toLowerCase();
        if (!q) { sugBox.style.display = 'none'; return; }

        const selectedCodes = getSelectedCodes();

        const matches = allInstitutions.filter(function(s) {
            if (selectedCodes.indexOf(s.code) !== -1) return false;
            return (s.code || '').includes(q) ||
                   (s.name || '').toLowerCase().includes(q) ||
                   (s.educationStage || '').toLowerCase().includes(q) ||
                   (s.principalName || '').toLowerCase().includes(q) ||
                   (s.inspectorName || '').toLowerCase().includes(q);
        }).slice(0, 50);

        if (!matches.length) {
            const noResultText = currentLang === 'ar' ? 'لم يتم العثور على نتائج' : 'לא נמצאו תוצאות';
            sugBox.innerHTML = '<div style="padding:12px;color:var(--gray-400);font-size:14px;text-align:center;">' + noResultText + '</div>';
            sugBox.style.display = 'block';
            return;
        }

        sugBox.innerHTML = matches.map(function(s) {
            return '<div class="suggestion-item" data-code="' + (s.code || '') +
                '" data-name="' + (s.name || '').replace(/"/g, '&quot;') + '">' +
                '<div class="sug-header">' +
                    '<span class="sug-code">' + (s.code || '') + '</span>' +
                    '<span class="sug-name">' + (s.name || '') + '</span>' +
                    (s.educationStage ? ' <span style="font-size:11px;color:var(--gray-400);flex-shrink:0;">' + s.educationStage + '</span>' : '') +
                '</div>' +
                '</div>';
        }).join('');

        sugBox.style.display = 'block';

        // Attach click handlers
        sugBox.querySelectorAll('.suggestion-item').forEach(function(el) {
            el.addEventListener('click', function() {
                addInstitution({
                    code: this.dataset.code,
                    name: this.dataset.name
                });
            });
        });
    }

    /**
     * Add an institution to the selected list — creates a tag element.
     */
    function addInstitution(inst) {
        // Prevent duplicate
        if (getSelectedCodes().indexOf(inst.code) !== -1) return;

        selectedInstitutions.push(inst);

        const tagsContainer = $('institutionTags');
        const searchInput = $('institutionSearch');
        const sugBox = $('schoolSuggestions');

        // Create tag element
        const displayName = inst.name;

        const tag = document.createElement('div');
        tag.className = 'institution-tag';
        tag.dataset.code = inst.code;
        tag.innerHTML = '<span class="tag-text">' + inst.code + ' — ' + displayName + '</span>' +
            '<button type="button" class="tag-remove" title="' +
            (currentLang === 'ar' ? 'إزالة' : 'הסר') + '">&times;</button>';

        // Attach remove handler
        tag.querySelector('.tag-remove').addEventListener('click', function(e) {
            e.stopPropagation();
            removeInstitution(inst.code);
        });

        // Insert tag before the search input
        if (tagsContainer) {
            tagsContainer.appendChild(tag);
        }

        // Clear search and keep input visible
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        if (sugBox) sugBox.style.display = 'none';

        // Update hidden input with JSON array of codes
        syncHiddenInput();
    }

    /**
     * Remove an institution from the selected list by code.
     */
    function removeInstitution(code) {
        selectedInstitutions = selectedInstitutions.filter(function(inst) {
            return inst.code !== code;
        });

        // Remove tag DOM element
        const tagsContainer = $('institutionTags');
        if (tagsContainer) {
            const tagEl = tagsContainer.querySelector('.institution-tag[data-code="' + code + '"]');
            if (tagEl) tagEl.remove();
        }

        syncHiddenInput();
    }

    /**
     * Sync the hidden input value with the current selected institutions array.
     */
    function syncHiddenInput() {
        const hiddenInput = $('institutionCodes');
        if (hiddenInput) {
            hiddenInput.value = JSON.stringify(
                selectedInstitutions.map(function(inst) {
                    return { code: inst.code, name: inst.name };
                })
            );
        }
    }

    // ======================== Role Dropdown ========================

    /**
     * Populate the role dropdown from LOOKUP_ROLE_HOLDERS store.
     * Uses currentLang (set from system settings) to decide whether to show Arabic or Hebrew labels.
     * ✅ FIXED: now strictly uses currentLang instead of multiple ambiguous sources.
     * ✅ FIXED: disables the select while populating to prevent showing stale HTML options.
     */
    function populateRoles() {
        const select = $('role');
        if (!select) return;

        // 1. נעל את התפריט מיד כדי למנוע אינטראקציה עם אפשרויות HTML מיושנות
        select.disabled = true;

        const isAr = (currentLang === 'ar');
        const placeholder = isAr ? '-- اختر المنصب --' : '-- בחר תפקיד --';

        // 2. נקה את כל האפשרויות (כולל אלו שהוגדרו ב-HTML)
        select.innerHTML = '';

        // 3. הוסף אפשרות ברירת מחדל (placeholder)
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = placeholder;
        select.appendChild(defaultOpt);

        // 4. הוסף את אפשרויות התפקידים ממאגר הנתונים
        const roles = DataStore.getAll(DataStore.KEYS.LOOKUP_ROLE_HOLDERS) || [];
        const active = roles
            .filter(function(r) { return r.isActive !== false; })
            .sort(function(a, b) { return (a.order || 0) - (b.order || 0); });

        active.forEach(function(role) {
            const option = document.createElement('option');
            option.value = role.value || role.label;
            
            if (isAr) {
                option.textContent = role.labelAr || role.label || 'ללא שם';
            } else {
                option.textContent = role.label || role.labelAr || 'ללא שם';
            }
            
            select.appendChild(option);
        });

        // 5. בסיום המילוי - פתח את התפריט לשימוש
        select.disabled = false;
    }

    // ======================== Event Binding ========================

    function bindEvents() {
        // Form submit
        const form = $('registrationForm');
        if (form) {
            form.addEventListener('submit', onSubmit);
        }
    }

    // ======================== Form Submission ========================

    /**
     * Handle form submission — validate and save to DataStore.
     */
    function onSubmit(e) {
        e.preventDefault();

        const fullName = ($('fullName').value || '').trim();
        const phone = ($('phone').value || '').trim();
        const email = ($('email').value || '').trim();
        const role = $('role').value;

        // Validate required fields
        if (!fullName || !phone || !email || selectedInstitutions.length === 0 || !role) {
            const msg = currentLang === 'ar'
                ? 'يرجى ملء جميع الحقول المطلوبة'
                : 'נא למלא את כל השדות החובה';
            showToast(msg, 'warning');
            return;
        }

        // Basic email validation
        if (!isValidEmail(email)) {
            const msg = currentLang === 'ar'
                ? 'يرجى إدخال عنوان بريد إلكتروني صحيح'
                : 'נא להכניס כתובת דוא"ל תקינה';
            showToast(msg, 'warning');
            return;
        }

        // Basic phone validation (Israeli format)
        if (!isValidPhone(phone)) {
            const msg = currentLang === 'ar'
                ? 'يرجى إدخال رقم جوال صحيح'
                : 'נא להכניס מספר נייד תקין';
            showToast(msg, 'warning');
            return;
        }

        // Disable button
        const btn = $('submitBtn');
        btn.disabled = true;
        btn.textContent = currentLang === 'ar' ? '⏳ جاري الإرسال...' : '⏳ שולח...';

        // Build institution arrays for the record
        const institutionCodes = selectedInstitutions.map(function(i) { return i.code; });
        const institutionNames = selectedInstitutions.map(function(i) { return i.name; });

        // Build registration record
        const record = {
            fullName: fullName,
            phone: phone,
            email: email,
            institutionCodes: institutionCodes,
            institutionNames: institutionNames,
            role: role,
            solutionId: currentSolution ? currentSolution.id : null,
            solutionName: currentSolution ? currentSolution.name : null,
            createdAt: new Date().toISOString()
        };

        // Save to DataStore
        try {
            DataStore.create(DataStore.KEYS.REGISTRATIONS, record);

            // Show success
            const successMsg = currentLang === 'ar'
                ? 'تم إرسال التسجيل بنجاح! ✅'
                : 'הרישום נשלח בהצלחה! ✅';
            showToast(successMsg, 'success');
            showSuccess();

        } catch (err) {
            console.error('[RegistrationPage] Error saving:', err);
            const errorMsg = currentLang === 'ar'
                ? 'حدث خطأ أثناء الحفظ. حاول مرة أخرى.'
                : 'אירעה שגיאה בשמירת הרישום. נסה שנית.';
            showToast(errorMsg, 'error');
            btn.disabled = false;
            btn.textContent = currentLang === 'ar' ? 'إرسال' : 'שליחה';
        }
    }

    // ======================== UI Helpers ========================

    /**
     * Show success state — hide form, show confirmation.
     */
    function showSuccess() {
        const form = $('registrationForm');
        const success = $('successMessage');
        const btn = $('submitBtn');
        const badge = $('solutionBadge');

        if (form) form.style.display = 'none';
        if (badge) badge.style.display = 'none';
        if (success) success.style.display = 'block';
        if (btn) {
            btn.disabled = false;
            btn.textContent = currentLang === 'ar' ? 'إرسال' : 'שליחה';
        }
    }

    /**
     * Validate Israeli phone format: 05X-XXXXXXX (where X is a digit).
     * Must start with 05 (e.g., 050, 051, 052, 053, 054, 055), followed by a hyphen and 7 digits.
     */
    function isValidPhone(phone) {
        // Accept formats: 05X-XXXXXXX or 05XXXXXXXX (with or without hyphen)
        const cleaned = phone.replace(/[-\s]/g, '');
        return /^05\d{8}$/.test(cleaned);
    }

    /**
     * Validate email format using standard regex pattern.
     */
    function isValidEmail(email) {
        // Standard email validation regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /**
     * Show toast notification (reuses the toast system from login page).
     */
    function showToast(message, type) {
        type = type || 'info';
        const container = $('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        toast.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span><span>' + message + '</span>';
        container.appendChild(toast);

        setTimeout(function () {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(function () { toast.remove(); }, 300);
        }, 3000);
    }

    // ======================== Slide-out animation (CSS fallback) ========================
    // Ensure the slideOut animation exists if not in style.css
    if (!document.getElementById('toastSlideOutStyle')) {
        const style = document.createElement('style');
        style.id = 'toastSlideOutStyle';
        style.textContent = '@keyframes slideOut { to { transform: translateX(-120%); opacity: 0; } }';
        document.head.appendChild(style);
    }

    // ======================== Auto-init on DOMContentLoaded ========================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API (for testing / debugging)
    return {
        init: init
    };

})();