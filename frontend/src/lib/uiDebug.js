// frontend/src/lib/uiDebug.js
// Minimal, opt-in console diagnostics for buttons/panels. No visual changes.
// Activate with: localStorage.setItem('uiDebug', '1'); location.reload()

(function () {
  const ENABLED = typeof localStorage !== 'undefined' && localStorage.getItem('uiDebug') === '1';
  if (!ENABLED) return;

  const KNOWN_BUTTON_CLASSES = [
    'luxury-button', 'luxury-button-linear', 'luxury-button-linear3', 'luxury-button-conic', 'luxury-button-elliptic',
    'btn-clay', 'btn-glass',
    'btn-primary', 'btn-secondary', 'btn-danger', 'btn-neutral',
    'btn-sm', 'btn-md', 'btn-lg'
  ];

  const CONFLICT_PATTERNS = [
    /^bg-/,
    /^shadow(-|$)/,
    /^border(-|$)/,
    /^rounded(-|$)/
  ];

  const STYLESHEET_SELECTOR_PROBES = [
    '.luxury-button', '.btn-clay', '.btn-glass', '.btn-primary', '.btn-secondary', '.btn-danger', '.btn-neutral'
  ];

  function hasButtonsStylesheetLoaded() {
    try {
      const sheets = Array.from(document.styleSheets);
      for (const sheet of sheets) {
        // Skip cross-origin safely
        let rules;
        try { rules = sheet.cssRules || sheet.rules; } catch { continue; }
        if (!rules) continue;
        for (const sel of STYLESHEET_SELECTOR_PROBES) {
          for (const rule of rules) {
            if (rule.selectorText === sel) return true;
          }
        }
      }
    } catch {}
    return false;
  }

  function tokensSnapshot() {
    const root = getComputedStyle(document.documentElement);
    const take = (name) => root.getPropertyValue(name).trim();
    return {
      '--btn-primary-bg': take('--btn-primary-bg'),
      '--clay-border': take('--clay-border'),
      '--glass-bg': take('--glass-bg'),
      '--glass-blur': take('--glass-blur'),
      '--panel-bg': take('--panel-bg'),
      '--backdrop-heavy': take('--backdrop-heavy'),
    };
  }

  function findConflicts(classList) {
    const conflicts = [];
    classList.forEach(cn => {
      if (CONFLICT_PATTERNS.some(rx => rx.test(cn))) conflicts.push(cn);
    });
    return conflicts;
  }

  function inspectElement(el) {
    const cs = getComputedStyle(el);
    const classes = Array.from(el.classList);
    const presentKnown = KNOWN_BUTTON_CLASSES.filter(c => classes.includes(c));
    const conflicts = findConflicts(classes);

    console.groupCollapsed(
      '%c[uiDebug]%c element',
      'color:#0ea5e9;font-weight:bold',
      'color:inherit',
      el
    );

    console.log('Classes:', classes.join(' '));
    console.log('Known button classes:', presentKnown);
    console.log('Conflict-ish utilities (might override tokens):', conflicts);

    console.log('— Stylesheet probes —');
    console.log('buttons.css present?:', hasButtonsStylesheetLoaded());

    const t = tokensSnapshot();
    console.log('— Token presence (root vars) —');
    Object.entries(t).forEach(([k, v]) => {
      console.log(`${k}:`, v || '(missing/empty)');
    });

    console.log('— Computed style snapshot —');
    console.table({
      'background-image': cs.backgroundImage,
      'background-color': cs.backgroundColor,
      'box-shadow': cs.boxShadow,
      'border': `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
      'backdrop-filter': cs.backdropFilter || cs.webkitBackdropFilter || '(none)',
      'color': cs.color,
      'border-radius': cs.borderRadius,
    });

    // Quick tips
    if (presentKnown.includes('luxury-button') || presentKnown.includes('btn-clay')) {
      if (conflicts.some(c => /^bg-/.test(c))) {
        console.warn('[uiDebug] Tailwind bg-* class may override luxury/clay gradient. Consider removing bg-* next to luxury/btn-*.');
      }
      if (conflicts.some(c => /^shadow/.test(c))) {
        console.warn('[uiDebug] Tailwind shadow-* may override token shadows of luxury/clay.');
      }
      if (cs.backgroundImage === 'none' || cs.backgroundImage === 'initial') {
        console.warn('[uiDebug] background-image is empty. Check that styles/buttons.css is loaded and no bg-* overrides it.');
      }
    }
    if (presentKnown.includes('btn-glass')) {
      if (!cs.backdropFilter && !cs.webkitBackdropFilter) {
        console.warn('[uiDebug] Glass has no backdrop-filter. Ensure tokens loaded and no overriding `backdrop-blur-*` resets.');
      }
      if (conflicts.some(c => /^bg-/.test(c))) {
        console.warn('[uiDebug] Tailwind bg-* on btn-glass can mute glass token bg; keep only subtle hover tint if intended.');
      }
    }

    console.groupEnd();
  }

  function closestInspectable(target) {
    // Buttons and “button-like”
    return target.closest?.(
      'button, .luxury-button, .btn-clay, .btn-glass, .btn-primary, .btn-secondary, .btn-danger, .btn-neutral'
    );
  }

  // Alt+Click on any button-ish element to dump diagnostics
  document.addEventListener('click', (e) => {
    if (!e.altKey) return;
    const el = closestInspectable(e.target);
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    inspectElement(el);
  }, true);

  // Expose manual API
  window.__uiDebug = {
    inspect: (selectorOrEl) => {
      const el = typeof selectorOrEl === 'string' ? document.querySelector(selectorOrEl) : selectorOrEl;
      if (el) inspectElement(el);
      else console.warn('[uiDebug] Not found:', selectorOrEl);
    },
    tokens: tokensSnapshot,
    hasButtonsCSS: hasButtonsStylesheetLoaded
  };

  console.info('%c[uiDebug] enabled', 'color:#0ea5e9', 'Alt+Click a button/panel to log diagnostics. window.__uiDebug.inspect(el|selector) is also available.');
})();
