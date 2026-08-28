(() => {
  'use strict';

  const CONTAINER_ID = 'GTM-MQ9CS753';
  const MEASUREMENT_ID = 'G-MHWJ7SQ6ZZ';
  const STORAGE_KEY = 'celdyque.analytics-consent.v1';
  const LIFETIME = 180 * 24 * 60 * 60 * 1000;
  const DENIED = {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  };

  function init() {
    if (document.getElementById('analytics-consent')) return;
    const production = window.location.protocol === 'https:' &&
      ['celdyque.com', 'www.celdyque.com'].includes(window.location.hostname);
    let started = false;
    let expiryTimer;
    let returnFocus;
    let storageUnavailable = false;

    window.dataLayer = window.dataLayer || [];
    function command() { window.dataLayer.push(arguments); }
    window['ga-disable-' + MEASUREMENT_ID] = true;
    // Queue consent before GTM exists. No Google script is requested until opt-in.
    command('consent', 'default', { ...DENIED });
    command('set', 'ads_data_redaction', true);
    command('set', 'allow_google_signals', false);
    command('set', 'allow_ad_personalization_signals', false);

    function readChoice() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const value = JSON.parse(raw);
        if (!value || value.version !== 1 ||
            !['granted', 'denied'].includes(value.analytics) ||
            !Number.isFinite(value.expires) || value.expires <= Date.now() ||
            value.expires > Date.now() + LIFETIME) return null;
        // Do not trust a saved opt-in when storage can no longer save a withdrawal.
        window.localStorage.setItem(STORAGE_KEY, raw);
        storageUnavailable = false;
        return value;
      } catch {
        storageUnavailable = true;
        return null;
      }
    }

    function saveChoice(analytics) {
      try {
        const raw = JSON.stringify({ version: 1, analytics, expires: Date.now() + LIFETIME });
        window.localStorage.setItem(STORAGE_KEY, raw);
        if (window.localStorage.getItem(STORAGE_KEY) !== raw) throw new Error('Storage unavailable');
        storageUnavailable = false;
        return true;
      } catch {
        try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Fail closed on the next read too. */ }
        storageUnavailable = true;
        return false;
      }
    }

    function clearAnalyticsCookies() {
      const names = ['_ga', '_ga_' + MEASUREMENT_ID.slice(2)];
      const host = window.location.hostname;
      const domains = new Set(['', host, '.' + host]);
      if (host === 'www.celdyque.com') {
        domains.add('celdyque.com');
        domains.add('.celdyque.com');
      }
      for (const name of names) {
        for (const domain of domains) {
          try {
            document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax' +
              (domain ? '; Domain=' + domain : '');
          } catch { /* Cookie access can be disabled by the browser. */ }
        }
      }
    }

    function stopAnalytics() {
      window['ga-disable-' + MEASUREMENT_ID] = true;
      clearAnalyticsCookies();
      if (started) {
        command('consent', 'update', { ...DENIED });
        // Removing a script cannot unload its listeners. Reload with the saved refusal.
        window.location.reload();
      }
    }

    function startAnalytics() {
      if (!production || started) return;
      started = true;
      window['ga-disable-' + MEASUREMENT_ID] = false;
      command('consent', 'update', { ...DENIED, analytics_storage: 'granted' });
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      const script = document.createElement('script');
      script.id = 'celdyque-gtm';
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtm.js?id=' + CONTAINER_ID;
      document.head.appendChild(script);
    }

    const notice = document.createElement('section');
    notice.id = 'analytics-consent';
    notice.className = 'analytics-consent';
    notice.setAttribute('role', 'region');
    notice.setAttribute('aria-labelledby', 'analytics-consent-title');
    notice.setAttribute('data-nosnippet', '');
    notice.hidden = true;
    notice.innerHTML = `
      <div class="analytics-consent-inner">
        <div class="analytics-consent-copy">
          <h2 id="analytics-consent-title" tabindex="-1">Analytics cookies</h2>
          <p>Allow Google Analytics to measure visits and product interest? Optional analytics stays off unless you allow it.</p>
          <details>
            <summary>Details</summary>
            <p>With your permission, Google Analytics uses cookies to measure page views, traffic sources, device information and outbound link clicks. Advertising consent stays off.</p>
            <p>Your choice is stored in this browser for 180 days. You can change it using Analytics settings in the footer. Declining does not prevent browsing or shopping.</p>
            <p>Amazon links open an external store and include Amazon Attribution parameters. Amazon handles its own cookies and purchases. These settings control this website's Google Analytics only.</p>
            <p><a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses data</a> | <a href="/contact.html">Contact CELDYQUE</a></p>
          </details>
          <p class="analytics-consent-status" role="status"></p>
        </div>
        <div class="analytics-consent-actions">
          <button type="button" data-analytics-choice="denied">Decline</button>
          <button type="button" data-analytics-choice="granted">Allow analytics</button>
          <button type="button" class="analytics-consent-keep" hidden>Keep current choice</button>
        </div>
      </div>`;
    document.body.appendChild(notice);
    const heading = notice.querySelector('h2');
    const status = notice.querySelector('[role="status"]');
    const keep = notice.querySelector('.analytics-consent-keep');

    function reserveSpace() {
      document.documentElement.style.setProperty('--analytics-notice-height',
        (notice.hidden ? 0 : Math.ceil(notice.getBoundingClientRect().height)) + 'px');
    }
    function showNotice(focus = false) {
      const choice = readChoice();
      keep.hidden = !choice;
      status.textContent = storageUnavailable ?
        'Your browser could not save your preference. Analytics remains off.' :
        choice ? 'Current choice: analytics ' + (choice.analytics === 'granted' ? 'allowed.' : 'declined.') : '';
      notice.hidden = false;
      reserveSpace();
      if (focus) heading.focus();
    }
    function hideNotice() {
      notice.hidden = true;
      reserveSpace();
      if (returnFocus?.isConnected) returnFocus.focus();
      returnFocus = null;
    }
    function scheduleExpiry(choice) {
      window.clearTimeout(expiryTimer);
      if (choice) expiryTimer = window.setTimeout(syncChoice,
        Math.min(choice.expires - Date.now() + 1, 2147483647));
    }
    function syncChoice() {
      const choice = readChoice();
      if (choice?.analytics === 'granted') startAnalytics();
      else stopAnalytics();
      scheduleExpiry(choice);
      if (!choice) showNotice();
      else if (!notice.hidden) showNotice();
    }

    for (const analytics of ['granted', 'denied']) {
      notice.querySelector('[data-analytics-choice="' + analytics + '"]').addEventListener('click', () => {
        const saved = saveChoice(analytics);
        if (analytics === 'denied' || !saved) stopAnalytics();
        if (!saved) { showNotice(); return; }
        if (analytics === 'granted') startAnalytics();
        scheduleExpiry(readChoice());
        hideNotice();
      });
    }
    keep.addEventListener('click', hideNotice);
    notice.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !keep.hidden) hideNotice();
    });
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-analytics-settings]');
      if (!trigger) return;
      returnFocus = trigger;
      showNotice(true);
    });
    function revealSettings() {
      document.querySelectorAll('[data-analytics-settings]').forEach(button => { button.hidden = false; });
    }
    document.addEventListener('site:ready', revealSettings);
    revealSettings();
    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY || event.key === null) syncChoice();
    });
    window.addEventListener('focus', syncChoice);
    window.addEventListener('pageshow', syncChoice);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') syncChoice();
    });
    if (window.ResizeObserver) new window.ResizeObserver(reserveSpace).observe(notice);
    else window.addEventListener('resize', reserveSpace);
    syncChoice();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
