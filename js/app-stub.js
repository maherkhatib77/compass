// App stub: creates a minimal App object when js/app.js fails to define App
(function(){
    try {
        if (typeof window.App === 'undefined') {
            console.error('[AppStub] App is undefined — creating degraded-mode stub');
            window.App = {
                init: function() {
                    try {
                        var overlay = document.getElementById('loadingOverlay');
                        var layout = document.getElementById('appLayout');
                        if (overlay) overlay.style.display = 'none';
                        if (layout) layout.style.display = 'flex';
                        console.warn('[AppStub] Initialized degraded UI; functionality may be limited because app.js failed to load.');
                        if (typeof showToast === 'function') showToast('App failed to load; running in degraded mode', 'error');
                    } catch(e){ console.error('[AppStub] init error', e); }
                }
            };
        }
    } catch(e) {
        console.error('[AppStub] error installing stub', e);
    }
})();
