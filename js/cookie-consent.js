/**
 * Outers CCPA-oriented cookie / privacy preference banner.
 * Stores choice in localStorage and honors Global Privacy Control (GPC).
 * Gate third-party analytics on document.documentElement.dataset.analytics === "1".
 */
(function () {
  const STORAGE_KEY = 'outers_privacy_prefs';
  const STYLE_ID = 'outers-cookie-consent-styles';
  const inCaseStudy = /\/case-studies\//.test(location.pathname);
  const base = inCaseStudy ? '../' : '';

  function injectStyles() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = [
      '#cookie-banner.cookie-banner{',
      '  position:fixed !important;',
      '  left:50% !important;',
      '  right:auto !important;',
      '  bottom:20px !important;',
      '  top:auto !important;',
      '  z-index:10000 !important;',
      '  width:min(1180px, calc(100vw - 40px)) !important;',
      '  max-width:none !important;',
      '  margin:0 !important;',
      '  padding:0 !important;',
      '  transform:translate(-50%, 12px) !important;',
      '  opacity:0;',
      '  pointer-events:none;',
      '  transition:opacity .35s cubic-bezier(.16,1,.3,1), transform .35s cubic-bezier(.16,1,.3,1);',
      '}',
      '#cookie-banner.cookie-banner.is-visible{',
      '  opacity:1;',
      '  transform:translate(-50%, 0) !important;',
      '  pointer-events:auto;',
      '}',
      '#cookie-banner .cookie-banner-inner{',
      '  display:flex;',
      '  align-items:center;',
      '  justify-content:space-between;',
      '  gap:20px;',
      '  min-height:58px;',
      '  height:58px;',
      '  box-sizing:border-box;',
      '  background:#fff;',
      '  border:1px solid rgba(18,17,20,0.04);',
      '  border-radius:100px;',
      '  padding:8px 8px 8px 22px;',
      '  box-shadow:0 12px 32px rgba(18,17,20,0.12), 0 1px 0 rgba(18,17,20,0.03);',
      '}',
      '#cookie-banner .cookie-banner-copy{',
      '  display:flex;',
      '  align-items:center;',
      '  gap:10px;',
      '  min-width:0;',
      '  flex:1;',
      '  margin:0;',
      '  font-size:13px;',
      '  line-height:1.3;',
      '  color:var(--text-on-paper-dim, #68646F);',
      '  white-space:nowrap;',
      '  overflow:hidden;',
      '  text-overflow:ellipsis;',
      '}',
      '#cookie-banner .cookie-banner-kicker{',
      "  font-family:var(--mono), 'IBM Plex Mono', monospace;",
      '  font-size:11px;',
      '  letter-spacing:0.12em;',
      '  text-transform:uppercase;',
      '  color:var(--sky-deep, #5D82C9);',
      '  flex-shrink:0;',
      '}',
      '#cookie-banner .cookie-banner-copy a{',
      '  color:var(--sky-deep, #5D82C9);',
      '  text-decoration:underline;',
      '  text-underline-offset:2px;',
      '}',
      '#cookie-banner .cookie-banner-actions{',
      '  display:flex;',
      '  flex-shrink:0;',
      '  align-items:center;',
      '  gap:8px;',
      '}',
      '#cookie-banner .cookie-banner-actions .btn{',
      '  font-size:14px;',
      '  padding:11px 18px;',
      '  white-space:nowrap;',
      '}',
      '#cookie-banner .cookie-banner-actions .btn-ghost{',
      '  border-color:rgba(18,17,20,0.18);',
      '}',
      '@media (max-width:860px){',
      '  #cookie-banner.cookie-banner{',
      '    bottom:16px !important;',
      '    width:calc(100vw - 32px) !important;',
      '  }',
      '  #cookie-banner .cookie-banner-inner{',
      '    height:auto;',
      '    min-height:0;',
      '    flex-direction:column;',
      '    align-items:stretch;',
      '    border-radius:28px;',
      '    padding:14px 14px 12px;',
      '    gap:12px;',
      '  }',
      '  #cookie-banner .cookie-banner-copy{',
      '    white-space:normal;',
      '    flex-wrap:wrap;',
      '    font-size:12px;',
      '  }',
      '  #cookie-banner .cookie-banner-actions{',
      '    width:100%;',
      '  }',
      '  #cookie-banner .cookie-banner-actions .btn{',
      '    flex:1;',
      '    justify-content:center;',
      '    padding:10px 14px;',
      '    font-size:13px;',
      '  }',
      '}',
      '@media (prefers-reduced-motion: reduce){',
      '  #cookie-banner.cookie-banner{ transition:none; }',
      '}'
    ].join('');
  }

  function readPrefs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  function applyPrefs(prefs) {
    const analytics = !!(prefs && prefs.analytics);
    const saleShare = !!(prefs && prefs.saleShare);
    document.documentElement.dataset.analytics = analytics ? '1' : '0';
    document.documentElement.dataset.saleShare = saleShare ? '1' : '0';
    window.dispatchEvent(new CustomEvent('outers:consent', { detail: prefs || null }));
  }

  function savePrefs(prefs) {
    const next = Object.assign({}, prefs, { updatedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyPrefs(next);
    return next;
  }

  function hasGPC() {
    return navigator.globalPrivacyControl === true;
  }

  function hideBanner() {
    const el = document.getElementById('cookie-banner');
    if (!el) return;
    el.classList.remove('is-visible');
    el.setAttribute('aria-hidden', 'true');
    window.setTimeout(function () {
      if (!el.classList.contains('is-visible')) el.hidden = true;
    }, 320);
  }

  function showBanner() {
    const el = document.getElementById('cookie-banner');
    if (!el) return;
    el.hidden = false;
    el.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () {
      el.classList.add('is-visible');
    });
    const focusBtn = el.querySelector('[data-cookie-accept]');
    if (focusBtn) focusBtn.focus({ preventScroll: true });
  }

  function acceptAll() {
    savePrefs({ analytics: true, saleShare: true, choice: 'accept' });
    hideBanner();
  }

  function optOutSaleShare() {
    savePrefs({ analytics: false, saleShare: false, choice: 'opt_out' });
    hideBanner();
  }

  function buildBanner() {
    if (document.getElementById('cookie-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'cookie-banner-title');
    banner.setAttribute('aria-describedby', 'cookie-banner-desc');
    banner.setAttribute('aria-hidden', 'true');
    banner.hidden = true;

    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<p id="cookie-banner-desc" class="cookie-banner-copy">' +
          '<span id="cookie-banner-title" class="cookie-banner-kicker">Privacy</span>' +
          '<span>Essential cookies keep the site working. Analytics only if you accept. You can opt out anytime. ' +
          '<a href="' + base + 'privacy.html">Privacy Policy</a></span>' +
        '</p>' +
        '<div class="cookie-banner-actions">' +
          '<button type="button" class="btn btn-sky" data-cookie-accept>' +
            '<span class="roll"><span class="roll-stack"><span>Accept</span><span>Accept</span></span></span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost" data-cookie-optout>Opt out</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);

    banner.querySelector('[data-cookie-accept]').addEventListener('click', acceptAll);
    banner.querySelector('[data-cookie-optout]').addEventListener('click', optOutSaleShare);
  }

  function init() {
    injectStyles();
    buildBanner();

    const existing = readPrefs();

    if (hasGPC()) {
      if (!existing || existing.saleShare !== false) {
        savePrefs({
          analytics: false,
          saleShare: false,
          choice: 'gpc',
          gpc: true
        });
      } else {
        applyPrefs(existing);
      }
      hideBanner();
      return;
    }

    if (existing && existing.choice) {
      applyPrefs(existing);
      hideBanner();
      return;
    }

    applyPrefs({ analytics: false, saleShare: false, choice: null });
    showBanner();
  }

  window.OutersConsent = {
    open: function () {
      injectStyles();
      buildBanner();
      showBanner();
    },
    accept: acceptAll,
    optOut: optOutSaleShare,
    get: readPrefs
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
