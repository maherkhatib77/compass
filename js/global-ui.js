/**
 * ============================================================================
 * מצפן נט — Global UI Module (Header & Footer from Settings)
 * ============================================================================
 * Reads site name (HE/AR), copyright (HE/AR) and logo from DataStore settings.
 * Each page provides containers with known IDs; this module fills them.
 *
 * Required containers:
 *   #globalHeaderLogo    — logo image/placeholder
 *   #globalHeaderNameAr  — Arabic site name
 *   #globalHeaderNameHe  — Hebrew site name
 *   #globalFooterText    — copyright text
 *
 * Usage:
 *   DataStore.init().then(() => GlobalUI.apply());
 * ============================================================================
 */

const GlobalUI = (() => {

    /**
     * Apply settings to all known container elements on the page.
     * Safe to call multiple times (e.g. after settings change).
     */
    function apply(currentLang) {
        const settings = DataStore.getSettings();
        const lang = currentLang || 'ar'; // default Arabic for public pages

        // Logo
        const logoEl = document.getElementById('globalHeaderLogo');
        if (logoEl) {
            if (settings.logoUrl) {
                logoEl.innerHTML = '<img src="' + settings.logoUrl + '" style="width:100%;height:100%;object-fit:cover;">';
            }
            // If no logoUrl, keep existing content (e.g. 🧭 emoji)
        }

        // Arabic site name
        const nameAr = document.getElementById('globalHeaderNameAr');
        if (nameAr) {
            nameAr.textContent = settings.siteNameAr || settings.systemName || '';
        }

        // Hebrew site name
        const nameHe = document.getElementById('globalHeaderNameHe');
        if (nameHe) {
            nameHe.textContent = settings.siteNameHe || settings.systemName || '';
        }

        // Footer / copyright
        const footerEl = document.getElementById('globalFooterText');
        if (footerEl) {
            footerEl.textContent = lang === 'ar'
                ? (settings.copyrightAr || '')
                : (settings.copyrightHe || '');
        }

        // Swap name prominence based on language
        if (nameAr && nameHe) {
            if (lang === 'ar') {
                nameAr.style.fontSize = '20px'; nameAr.style.fontWeight = '800';
                nameHe.style.fontSize = '14px'; nameHe.style.fontWeight = '500';
            } else {
                nameHe.style.fontSize = '20px'; nameHe.style.fontWeight = '800';
                nameAr.style.fontSize = '14px'; nameAr.style.fontWeight = '500';
            }
        }
    }

    return { apply };
})();