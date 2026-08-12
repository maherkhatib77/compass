/**
 * ============================================================================
 * מצפן נט — קטלוג השתלמויות ציבורי (Public Catalog Page)
 * ============================================================================
 * Pure JS — no framework. Loads data from DataStore (localStorage).
 * Bilingual: Hebrew / Arabic, default Arabic. RTL for both.
 * 
 * Loads from TWO sources:
 *   1. solutions (where showInCatalog === true)
 *   2. catalog_entries (where showInCatalog === true)
 * ============================================================================
 */

const CatalogPage = (() => {

    // ======================== State ========================
    let lang = 'ar'; // default Arabic for public catalog
    let allItems = []; // combined list from both sources
    let guidesRepo = [];
    let categories = [];
    let lookupFieldKnowledge = [];
    let lookupWeekDays = [];
    let lookupMeetingTypes = [];
    let lookupEducationStages = [];
    let lookupEducationTypes = [];
    let solutionInstructors = [];
    let mentorsRepo = [];
    let periods = [];
    let selectedPeriodId = null; // User-selected period for viewing data

    // ======================== Color Map for Knowledge Fields ========================
    const FIELD_COLORS = {
        'מתמטיקה':   { bg: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)', solid: '#007bff' },
        'היסטוריה':   { bg: 'linear-gradient(135deg, #0e98fb 0%, #007bff 100%)', solid: '#0e98fb' },
        'אנגלית':     { bg: 'linear-gradient(135deg, #a273c6 0%, #8b5fbf 100%)', solid: '#a273c6' },
        'ספרות':      { bg: 'linear-gradient(135deg, #f0519e 0%, #d63384 100%)', solid: '#f0519e' },
        'מדעים':      { bg: 'linear-gradient(135deg, #00a767 0%, #008c56 100%)', solid: '#00a767' },
        'גאוגרפיה':   { bg: 'linear-gradient(135deg, #3db0d8 0%, #0e98fb 100%)', solid: '#3db0d8' },
        'אזרחות':     { bg: 'linear-gradient(135deg, #fec803 0%, #d4a017 100%)', solid: '#fec803' },
        'תנ"ך':       { bg: 'linear-gradient(135deg, #9b2c2c 0%, #742a2a 100%)', solid: '#9b2c2c' },
        'מחשבת ישראל':{ bg: 'linear-gradient(135deg, #553c9a 0%, #44337a 100%)', solid: '#553c9a' },
        'לשון':       { bg: 'linear-gradient(135deg, #b83280 0%, #97266d 100%)', solid: '#b83280' },
        'פיזיקה':     { bg: 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)', solid: '#2b6cb0' },
        'כימיה':      { bg: 'linear-gradient(135deg, #2f855a 0%, #276749 100%)', solid: '#2f855a' },
        'ביולוגיה':   { bg: 'linear-gradient(135deg, #74d7b0 0%, #00a767 100%)', solid: '#74d7b0' },
        'חינוך גופני':{ bg: 'linear-gradient(135deg, #f0519e 0%, #fdadd4 100%)', solid: '#f0519e' },
        'אמנות':      { bg: 'linear-gradient(135deg, #d53f8c 0%, #b83280 100%)', solid: '#d53f8c' },
        'מוזיקה':     { bg: 'linear-gradient(135deg, #a273c6 0%, #c4a2dc 100%)', solid: '#a273c6' }
    };
    const DEFAULT_FIELD_COLOR = { bg: 'linear-gradient(135deg, #666666 0%, #303030 100%)', solid: '#666666' };

    // ======================== Translations ========================
    const T = {
        he: {
            pageTitle: 'מצפן נט - קטלוג השתלמויות',
            searchPlaceholder: 'חיפוש השתלמות לפי שם או תיאור...',
            filterTopicType: 'כל התחומים',
            filterEducationStage: 'כל שלבי החינוך',
            filterMeetingType: 'כל סוגי המפגש',
            viewDetails: 'לפרטים',
            guideLabel: 'מדריך אחראי',
            topicTypeLabel: 'תחום ונושא',
            educationStageLabel: 'שלב חינוך',
            educationTypeLabel: 'סוג חינוך',
            startDateLabel: 'תאריך התחלה',
            weekDayLabel: 'יום בשבוע',
            meetingTypeLabel: 'סוג מפגש',
            academicHoursLabel: 'שעות אקדמיות',
            notesLabel: 'הערה',
            mentorsLabel: 'מנחים',
            close: 'סגור',
            whatsapp: 'ואטסאפ',
            registration: 'רישום מוקדם',
            descriptionLabel: 'תיאור',
            noResults: 'אין תוצאות',
            footer: '© ' + new Date().getFullYear() + ' מצפן נט — משרד החינוך',
            langToggle: 'العربية',
            hoursUnit: 'שעות',
            topicTypeAndSubject: 'תחום ונושא',
            hoursValue: '{n} שעות אקדמיות'
        },
        ar: {
            pageTitle: 'كتالوج الحلول التعليمية للعام 2026-2027',
            searchPlaceholder: 'البحث عن دورة بالاسم أو الوصف...',
            filterTopicType: 'جميع المجالات',
            filterEducationStage: 'جميع المراحل',
            filterMeetingType: 'جميع أنواع اللقاءات',
            viewDetails: 'للتفاصيل',
            guideLabel: 'المرشد المسؤول',
            topicTypeLabel: 'مجال وموضوع',
            educationStageLabel: 'مرحلة تعليمية',
            educationTypeLabel: 'نوع التعليم',
            startDateLabel: 'تاريخ البدء',
            weekDayLabel: 'يوم في الأسبوع',
            meetingTypeLabel: 'نوع اللقاء',
            academicHoursLabel: 'ساعات أكاديمية',
            notesLabel: 'ملاحظة',
            mentorsLabel: 'المحاضرين',
            close: 'إغلاق',
            whatsapp: 'واتساب',
            registration: 'تسجيل مسبق',
            descriptionLabel: 'وصف',
            noResults: 'لا توجد نتائج',
            footer: '© ' + new Date().getFullYear() + ' بوصلة نت — وزارة التربية والتعليم',
            langToggle: 'עברית',
            hoursUnit: 'ساعات',
            topicTypeAndSubject: 'مجال وموضوع',
            hoursValue: '{n} ساعات أكاديمية'
        }
    };

    function t(key) {
        return (T[lang] && T[lang][key]) || key;
    }

    // ======================== Lookup Helpers ========================

    /**
     * Get label from lookup list with language priority (Arabic first, then Hebrew fallback)
     */
    function getLookupLabel(lookupList, value) {
        if (!value || !lookupList) return '';
        const item = lookupList.find(l => l.value === value);
        if (!item) return value;
        return lang === 'ar' ? (item.labelAr || item.label || item.value) : (item.label || item.value);
    }

    /**
     * Get topic label based on topicType mapping to correct lookup table
     * TopicType determines which lookup table to use for the topic field
     */
    function getTopicLabel(topicType, topicValue) {
        if (!topicValue) return '';
        
        // Map topicType to the correct lookup table
        let lookupTable = null;
        
        if (topicType === 'תחום דעת') {
            // Use lookup_field_knowledge for knowledge fields
            lookupTable = lookupFieldKnowledge;
        } else if (topicType === 'בעלי תפקידים') {
            // Use lookup_role_holders for role holders
            lookupTable = DataStore.getAll(DataStore.KEYS.LOOKUP_ROLE_HOLDERS) || [];
        } else if (topicType === 'נושא רוחב') {
            // Could use another lookup table if defined
            lookupTable = lookupFieldKnowledge;
        } else if (topicType === 'תוכניות ייעודיות') {
            // Use designated programs lookup
            lookupTable = DataStore.getAll(DataStore.KEYS.LOOKUP_DESIGNATED_PROGRAMS) || [];
        } else {
            // Default fallback: try field knowledge first, then domains
            lookupTable = lookupFieldKnowledge;
        }
        
        // Get the label with Arabic priority
        if (lookupTable && lookupTable.length > 0) {
            const item = lookupTable.find(l => l.value === topicValue);
            if (item) {
                return lang === 'ar' ? (item.labelAr || item.label || item.value) : (item.label || item.value);
            }
        }
        
        // Fallback: try field knowledge then domains
        const fieldItem = lookupFieldKnowledge.find(l => l.value === topicValue);
        if (fieldItem) {
            return lang === 'ar' ? (fieldItem.labelAr || fieldItem.label || fieldItem.value) : (fieldItem.label || fieldItem.value);
        }
        
        // Last resort: return the raw value
        return topicValue;
    }

    /**
     * Get domain/topicType label with Arabic priority
     */
    function getDomainLabel(domainValue) {
        if (!domainValue) return '';
        const item = categories.find(d => d.value === domainValue);
        if (!item) return domainValue;
        return lang === 'ar' ? (item.labelAr || item.label || item.value) : (item.label || item.value);
    }

    function getFieldColor(fieldValue) {
        if (!fieldValue) return DEFAULT_FIELD_COLOR;
        return FIELD_COLORS[fieldValue] || DEFAULT_FIELD_COLOR;
    }

    function getGuideName(guideId) {
        if (!guideId || !guidesRepo) return '';
        const guide = guidesRepo.find(g => g.id === guideId);
        if (!guide) return guideId;
        if (lang === 'ar' && guide.fullNameAr) return guide.fullNameAr;
        return guide.fullName || guideId;
    }

    function getMentorNames(solutionId) {
        if (!solutionId || !solutionInstructors) return [];
        const links = solutionInstructors.filter(si => si.solutionId === solutionId);
        if (!links.length) return [];
        
        const mentorNames = [];
        for (const link of links) {
            // Skip "כוח פנים" entries entirely - do not display them
            if (link.fullName === 'כוח פנים' || link.performerType === 'כוח פנים') {
                continue;
            }
            
            // Get the instructor name from solution_instructors (fallback)
            const instructorName = link.fullName && link.fullName.trim() ? link.fullName : null;
            
            // Try to find matching mentor in mentorsRepo by name (since mentorId is usually null)
            let mentor = null;
            if (instructorName && mentorsRepo) {
                mentor = mentorsRepo.find(m => m.fullNameHe === instructorName || m.fullNameAr === instructorName);
            }
            
            // Also try by mentorId if it exists
            if (!mentor && link.mentorId) {
                mentor = mentorsRepo.find(m => m.id === link.mentorId);
            }
            
            let nameToShow = '';
            if (mentor) {
                // Use mentor data if found
                if (lang === 'ar') {
                    // For Arabic: prefer fullNameAr if exists and non-empty, otherwise fullNameHe
                    if (mentor.fullNameAr && mentor.fullNameAr.trim()) {
                        nameToShow = mentor.fullNameAr;
                    } else if (mentor.fullNameHe && mentor.fullNameHe.trim()) {
                        nameToShow = mentor.fullNameHe;
                    }
                } else {
                    // For Hebrew: use fullNameHe
                    nameToShow = mentor.fullNameHe || mentor.fullNameAr || '';
                }
            }
            
            // Fallback to instructor name if no mentor found or no name from mentor
            if (!nameToShow && instructorName) {
                nameToShow = instructorName;
            }
            
            if (nameToShow) {
                mentorNames.push({
                    name: nameToShow,
                    mentorId: mentor ? (mentor.mentorId || mentor.id) : null
                });
            }
        }
        return mentorNames;
    }
    
    /**
     * Get mentor names as tag HTML for card display
     */
    function getMentorTagsHtml(solutionId) {
        const mentorNames = getMentorNames(solutionId);
        if (!mentorNames || mentorNames.length === 0) return '';
        
        return mentorNames.map(m => 
            `<span class="mentor-tag">${m.name}</span>`
        ).join('');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return dd + '/' + mm + '/' + yyyy;
        } catch (e) { return dateStr; }
    }

    /**
     * Split a value that may be a comma-separated string into an array of trimmed items.
     * Handles: "יסודי, חטיבה" → ["יסודי", "חטיבה"]; ["יסודי"] → ["יסודי"]; "" → []
     */
    function splitCsvValue(val) {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string' && val.indexOf(',') !== -1) {
            return val.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        }
        return [val];
    }

    /**
     * Normalize a combined item for display (from solutions)
     */
    function normalizeItem(raw) {
        return {
            id: raw.id,
            _sourceType: 'solution',
            name: raw.name || '',
            description: raw.description || '',
            guideId: raw.guideId || null,
            topicType: raw.topicType || '',
            topic: raw.topic || '',
            educationStage: splitCsvValue(raw.educationStage),
            educationType: splitCsvValue(raw.educationType),
            startDate: raw.startDate || '',
            weekDay: raw.weekDay || '',
            meetingType: raw.meetingType || '',
            academicHours: raw.academicHours || 0,
            whatsappEnabled: !!(raw.whatsappLinkEnabled !== false && raw.whatsappLink && raw.whatsappLink.trim()),
            whatsappLink: raw.whatsappLink || '',
            registrationEnabled: !!(raw.registrationLinkEnabled !== false && (raw.registrationLink || raw.earlyRegistrationLink) && (raw.registrationLink || raw.earlyRegistrationLink).trim()),
            registrationLink: raw.registrationLink || raw.earlyRegistrationLink || '',
            notes: raw.notes || '',
            showInCatalog: raw.showInCatalog
        };
    }

    // ======================== DOM References ========================

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    let elPageTitle, elSearchInput, elFilterTopicType, elFilterEducationStage,
        elFilterMeetingType, elCatalogGrid, elDetailModal, elModalTitle,
        elModalBody, elModalFooter, elModalClose;

    function cacheDom() {
        elPageTitle        = $('#pageTitle');
        elSearchInput      = $('#searchInput');
        elFilterTopicType   = $('#filterTopicType');
        elFilterEducationStage = $('#filterEducationStage');
        elFilterMeetingType = $('#filterMeetingType');
        elCatalogGrid       = $('#catalogGrid');
        elDetailModal        = $('#detailModal');
        elModalTitle         = $('#modalTitle');
        elModalBody          = $('#modalBody');
        elModalFooter        = $('#modalFooter');
        elModalClose         = $('#modalClose');

    }

    // ======================== Language Toggle ========================

    function toggleLanguage() {
        lang = lang === 'ar' ? 'he' : 'ar';
        applyLanguage();
        render();
    }

    function applyLanguage() {
        document.documentElement.lang = lang;
        document.documentElement.dir = 'rtl';
        elPageTitle.textContent = t('pageTitle');
        elSearchInput.placeholder = t('searchPlaceholder');
        buildFilters();
        document.title = t('pageTitle');

        // Apply global header/footer from settings
        if (typeof GlobalUI !== 'undefined') GlobalUI.apply(lang);

        // Swap logo text sizes (handled by GlobalUI.apply, kept as fallback)
        const nameAr = document.getElementById('globalHeaderNameAr') || document.getElementById('logoAr');
        const nameHe = document.getElementById('globalHeaderNameHe') || document.getElementById('logoHe');
        if (lang === 'ar') {
            if (nameAr) { nameAr.style.fontSize = '20px'; nameAr.style.fontWeight = '800'; }
            if (nameHe) { nameHe.style.fontSize = '14px'; nameHe.style.fontWeight = '500'; }
        } else {
            if (nameHe) { nameHe.style.fontSize = '20px'; nameHe.style.fontWeight = '800'; }
            if (nameAr) { nameAr.style.fontSize = '14px'; nameAr.style.fontWeight = '500'; }
        }
    }

    // ======================== Build Filters ========================

    function buildFilters() {
        elFilterTopicType.innerHTML = '';
        const topicAllOpt = document.createElement('option');
        topicAllOpt.value = '';
        topicAllOpt.textContent = t('filterTopicType');
        elFilterTopicType.appendChild(topicAllOpt);
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.value;
            opt.textContent = lang === 'ar' ? (c.labelAr || c.label || c.value) : (c.label || c.value);
            elFilterTopicType.appendChild(opt);
        });

        elFilterEducationStage.innerHTML = '';
        const stageAllOpt = document.createElement('option');
        stageAllOpt.value = '';
        stageAllOpt.textContent = t('filterEducationStage');
        elFilterEducationStage.appendChild(stageAllOpt);
        lookupEducationStages.filter(s => s.isActive).sort((a, b) => a.order - b.order).forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.value;
            opt.textContent = lang === 'ar' ? (s.labelAr || s.label) : s.label;
            elFilterEducationStage.appendChild(opt);
        });

        elFilterMeetingType.innerHTML = '';
        const meetingAllOpt = document.createElement('option');
        meetingAllOpt.value = '';
        meetingAllOpt.textContent = t('filterMeetingType');
        elFilterMeetingType.appendChild(meetingAllOpt);
        lookupMeetingTypes.filter(m => m.isActive).sort((a, b) => a.order - b.order).forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.value;
            opt.textContent = lang === 'ar' ? (m.labelAr || m.label) : m.label;
            elFilterMeetingType.appendChild(opt);
        });
    }

    // ======================== Filtering ========================

    function getFilteredItems() {
        const search = (elSearchInput.value || '').trim().toLowerCase();
        const topicTypeId = elFilterTopicType.value;
        const stageId = elFilterEducationStage.value;
        const meetingTypeId = elFilterMeetingType.value;

        return allItems.filter(item => {
            if (search) {
                const nameMatch = (item.name || '').toLowerCase().includes(search);
                const descMatch = (item.description || '').toLowerCase().includes(search);
                const guideMatch = getGuideName(item.guideId).toLowerCase().includes(search);
                if (!nameMatch && !descMatch && !guideMatch) return false;
            }
            if (topicTypeId && item.topicType !== topicTypeId) return false;
            if (stageId) {
                const stages = Array.isArray(item.educationStage) ? item.educationStage : [];
                if (!stages.includes(stageId)) return false;
            }
            if (meetingTypeId && item.meetingType !== meetingTypeId) return false;
            return true;
        });
    }

    // ======================== Render Cards ========================

    function render() {
        const filtered = getFilteredItems();
        renderGrid(filtered);
    }

    function renderGrid(items) {
        elCatalogGrid.innerHTML = '';
        if (!items || items.length === 0) {
            elCatalogGrid.innerHTML = `
                <div class="catalog-empty">
                    <div class="catalog-empty-icon">📭</div>
                    <div class="catalog-empty-text">${t('noResults')}</div>
                </div>`;
            return;
        }
        items.forEach(item => { elCatalogGrid.appendChild(createCard(item)); });
    }

    function createCard(item) {
        const card = document.createElement('div');
        card.className = 'catalog-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', item.name || '');
        card._catalogItem = item; // reference for event delegation

        // Get domain (topicType) label with Arabic priority
        const domainLabel = getDomainLabel(item.topicType);
        // Get topic (subject) label based on topicType mapping
        const subjectLabel = getTopicLabel(item.topicType, item.topic);
        
        const fieldColor = getFieldColor(item.topic || '');
        // Get mentor tags HTML (requirement: display mentors as tags, filter out "כוח פנים")
        const mentorTagsHtml = getMentorTagsHtml(item.id);
        const meetingLabel = getLookupLabel(lookupMeetingTypes, item.meetingType);
        const dayLabel = getLookupLabel(lookupWeekDays, item.weekDay);
        const hours = item.academicHours || 0;
        const regUrl = './registration.html?solution=' + encodeURIComponent(item.id) + '&name=' + encodeURIComponent(item.name);

        let badgesHtml = '';
        if (domainLabel) badgesHtml += `<span class="badge badge-primary">${domainLabel}</span>`;
        if (subjectLabel) badgesHtml += `<span class="badge badge-info">${subjectLabel}</span>`;
        if (meetingLabel) badgesHtml += `<span class="badge badge-gray">${meetingLabel}</span>`;
        if (dayLabel) badgesHtml += `<span class="badge badge-gray">${dayLabel}</span>`;
        if (hours > 0) badgesHtml += `<span class="badge badge-gray">🕐 ${hours} ${t('hoursUnit')}</span>`;

        card.innerHTML = `
            <div class="catalog-card-strip" style="background: ${fieldColor.bg}">
                <span class="strip-label">${item.name || ''}</span>
            </div>
            <div class="catalog-card-body">
                ${mentorTagsHtml ? `<div class="catalog-card-mentors">${mentorTagsHtml}</div>` : ''}
                ${badgesHtml ? `<div class="catalog-card-badges">${badgesHtml}</div>` : ''}
            </div>
            <div class="catalog-card-footer" style="display:flex;gap:8px;justify-content:center;">
                <button type="button" class="btn btn-outline btn-sm catalog-view-btn">${t('viewDetails')}</button>
                <a href="${regUrl}" class="btn btn-primary btn-sm" style="text-decoration:none;" onclick="event.stopPropagation();">${t('registration')}</a>
            </div>`;

        const openDetail = (e) => { e.stopPropagation(); openModal(item); };
        const viewBtn = card.querySelector('.catalog-view-btn');
        if (viewBtn) viewBtn.addEventListener('click', openDetail);
        card.addEventListener('click', openDetail);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(e); }
        });
        return card;
    }

    // ======================== Modal ========================

    function openModal(item) {
        elModalTitle.textContent = item.name || '';
        let html = '';

        if (item.description) {
            html += `<div class="detail-row"><span class="detail-label">${t('descriptionLabel')}</span><span class="detail-value">${item.description}</span></div>`;
        }

        // Display mentors first as tags (requirement: show mentors, filter out "כוח פנים")
        const mentorNames = getMentorNames(item.id);
        if (mentorNames && mentorNames.length > 0) {
            const mentorTagsHtml = mentorNames.map(m => `<span class="badge badge-primary">${m.name}</span>`).join('');
            html += `<div class="detail-row"><span class="detail-label">${t('mentorsLabel')}</span><span class="detail-value"><span class="detail-badges">${mentorTagsHtml}</span></span></div>`;
        }

        // Guide is secondary - still display but after mentors
        const guideName = getGuideName(item.guideId);
        if (guideName) {
            html += `<div class="detail-row"><span class="detail-label">${t('guideLabel')}</span><span class="detail-value">👤 ${guideName}</span></div>`;
        }

        // Display domain (topicType) and subject (topic) with Arabic priority using proper lookup tables
        const domainLabel = getDomainLabel(item.topicType);
        const subjectLabel = getTopicLabel(item.topicType, item.topic);
        if (domainLabel || subjectLabel) {
            html += `<div class="detail-row"><span class="detail-label">${t('topicTypeLabel')}</span><span class="detail-value"><span class="detail-badges">${domainLabel ? '<span class="badge badge-primary">' + domainLabel + '</span>' : ''}${subjectLabel ? '<span class="badge badge-info">' + subjectLabel + '</span>' : ''}</span></span></div>`;
        }

        if (item.educationStage && item.educationStage.length > 0) {
            const stageBadges = item.educationStage.map(id => `<span class="badge badge-success">${getLookupLabel(lookupEducationStages, id)}</span>`).join('');
            html += `<div class="detail-row"><span class="detail-label">${t('educationStageLabel')}</span><span class="detail-value"><span class="detail-badges">${stageBadges}</span></span></div>`;
        }

        if (item.educationType && item.educationType.length > 0) {
            const typeBadges = item.educationType.map(id => `<span class="badge badge-warning">${getLookupLabel(lookupEducationTypes, id)}</span>`).join('');
            html += `<div class="detail-row"><span class="detail-label">${t('educationTypeLabel')}</span><span class="detail-value"><span class="detail-badges">${typeBadges}</span></span></div>`;
        }

        if (item.startDate) {
            html += `<div class="detail-row"><span class="detail-label">${t('startDateLabel')}</span><span class="detail-value">📅 ${formatDate(item.startDate)}</span></div>`;
        }

        const dayLabel = getLookupLabel(lookupWeekDays, item.weekDay);
        if (dayLabel) {
            html += `<div class="detail-row"><span class="detail-label">${t('weekDayLabel')}</span><span class="detail-value">📆 ${dayLabel}</span></div>`;
        }

        const meetingLabel = getLookupLabel(lookupMeetingTypes, item.meetingType);
        if (meetingLabel) {
            html += `<div class="detail-row"><span class="detail-label">${t('meetingTypeLabel')}</span><span class="detail-value"><span class="badge badge-info">${meetingLabel}</span></span></div>`;
        }

        if (item.academicHours) {
            html += `<div class="detail-row"><span class="detail-label">${t('academicHoursLabel')}</span><span class="detail-value">🕐 ${t('hoursValue').replace('{n}', item.academicHours)}</span></div>`;
        }

        if (item.notes) {
            html += `<div class="detail-row"><span class="detail-label">${t('notesLabel')}</span><span class="detail-value">📝 ${item.notes}</span></div>`;
        }

        elModalBody.innerHTML = html;

        // Footer buttons
        let footerHtml = `<button class="btn btn-outline" id="modalCloseBtn">${t('close')}</button>`;

        // WhatsApp button (if enabled)
        if (item.whatsappEnabled || (item.whatsappLink && item.whatsappLink.trim())) {
            footerHtml += `<a href="${item.whatsappLink || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-success" ${!item.whatsappLink ? 'style="pointer-events:none;opacity:0.5;"' : ''}>💬 ${t('whatsapp')}</a>`;
        }

        // Registration button
        if (item.registrationEnabled !== false) {
            const regUrl = './registration.html?solution=' + encodeURIComponent(item.id) + '&name=' + encodeURIComponent(item.name);
            footerHtml += `<a href="${regUrl}" class="btn btn-primary">✅ ${t('registration')}</a>`;
        }

        elModalFooter.innerHTML = footerHtml;

        // Show modal
        elDetailModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
    }

    function closeModal() {
        elDetailModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ======================== Event Binding ========================

    function bindEvents() {
        let searchTimeout;
        elSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => render(), 200);
        });

        elFilterTopicType.addEventListener('change', render);
        elFilterEducationStage.addEventListener('change', render);
        elFilterMeetingType.addEventListener('change', render);

        elModalClose.addEventListener('click', closeModal);
        elDetailModal.addEventListener('click', (e) => {
            if (e.target === elDetailModal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        // Event delegation on grid — robust fallback for "לפרטים" button clicks
        elCatalogGrid.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.catalog-view-btn');
            if (viewBtn) {
                e.stopPropagation();
                const card = viewBtn.closest('.catalog-card');
                if (card && card._catalogItem) {
                    openModal(card._catalogItem);
                }
            }
        });
    }

    // ======================== Init ========================

    function init() {
        cacheDom();

        // Load lookup data
        guidesRepo            = DataStore.getAll(DataStore.KEYS.GUIDES_REPO) || [];
        categories            = (DataStore.getAll(DataStore.KEYS.LOOKUP_DOMAINS) || []).filter(c => c.isActive !== false).sort((a,b) => (a.order||0) - (b.order||0));
        lookupFieldKnowledge   = DataStore.getAll(DataStore.KEYS.LOOKUP_FIELD_KNOWLEDGE) || [];
        lookupWeekDays         = DataStore.getAll(DataStore.KEYS.LOOKUP_WEEK_DAYS) || [];
        lookupMeetingTypes     = DataStore.getAll(DataStore.KEYS.LOOKUP_MEETING_TYPES) || [];
        lookupEducationStages  = DataStore.getAll(DataStore.KEYS.LOOKUP_EDUCATION_STAGES) || [];
        lookupEducationTypes   = DataStore.getAll(DataStore.KEYS.LOOKUP_EDUCATION_TYPES) || [];
        solutionInstructors    = DataStore.getAll(DataStore.KEYS.SOLUTION_INSTRUCTORS) || [];
        mentorsRepo            = DataStore.getAll(DataStore.KEYS.MENTORS) || [];

        // Load from SOLUTIONS (where showInCatalog or showInPublicCatalog is explicitly true)
        let solutions = (DataStore.getAll(DataStore.KEYS.SOLUTIONS) || []).filter(s => s.showInCatalog === true || s.showInPublicCatalog === true);

        // Filter by active period only (hermetic separation)
        var activePeriod = (DataStore.getAll(DataStore.KEYS.PERIODS) || []).find(function(p) { return p.isActive; });
        if (activePeriod) {
            solutions = solutions.filter(function(s) { return s.periodId === activePeriod.id; });
        }

        allItems = solutions.map(normalizeItem);

        applyLanguage();
        bindEvents();
        render();
    }
    
    // Expose onYearChange for the year select dropdown in HTML
    function onYearChange(year) {
        selectedPeriodId = year;
        // Reload data filtered by selected period
        let solutions = (DataStore.getAll(DataStore.KEYS.SOLUTIONS) || []).filter(s => s.showInCatalog === true || s.showInPublicCatalog === true);
        
        if (selectedPeriodId) {
            solutions = solutions.filter(function(s) { return s.periodId === selectedPeriodId; });
        }
        
        allItems = solutions.map(normalizeItem);
        render();
    }

    // ======================== Boot ========================

    if (DataStore.init && typeof DataStore.init === 'function') {
        DataStore.init(false).then(() => init()).catch(() => init());
    } else {
        init();
    }

})();