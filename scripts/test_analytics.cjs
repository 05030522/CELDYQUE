const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SOURCE = readFileSync(path.join(ROOT, 'assets/analytics.js'), 'utf8');
const KEY = 'celdyque.analytics-consent.v1';
const DISABLE = 'ga-disable-G-MHWJ7SQ6ZZ';
const TTL = 180 * 24 * 60 * 60 * 1000;
const saved = (analytics, expires = Date.now() + TTL - 1000) =>
  JSON.stringify({ version: 1, analytics, expires });

function fixture(options = {}) {
  const elements = new Map();
  const scripts = [];
  const cookieWrites = [];
  const storage = new Map();
  if (options.saved !== undefined) storage.set(KEY, options.saved);
  const handlers = () => ({
    handlers: {},
    addEventListener(name, fn) { (this.handlers[name] ||= []).push(fn); },
    emit(name, event = {}) { for (const fn of this.handlers[name] || []) fn(event); }
  });
  const node = () => ({
    ...handlers(), hidden: false, children: new Map(), style: {}, isConnected: true,
    setAttribute(name, value) { this[name] = value; },
    querySelector(selector) {
      if (!this.children.has(selector)) this.children.set(selector, node());
      return this.children.get(selector);
    },
    getBoundingClientRect: () => ({ height: 160 }),
    focus() { this.focused = true; }
  });
  const settings = node();
  settings.hidden = true;
  settings.closest = () => settings;
  const doc = {
    ...handlers(), readyState: options.readyState || 'complete', visibilityState: 'visible',
    getElementById: id => elements.get(id),
    createElement: node,
    head: { appendChild: element => scripts.push(element) },
    body: { appendChild: element => elements.set(element.id, element) },
    documentElement: { style: { setProperty(name, value) { this[name] = value; } } },
    querySelectorAll: () => [settings],
    set cookie(value) { cookieWrites.push(value); }
  };
  const win = {
    ...handlers(), dataLayer: [], reloads: 0, timers: new Map(),
    location: {
      hostname: options.hostname || 'celdyque.com', protocol: options.protocol || 'https:',
      reload() { win.reloads++; }
    },
    localStorage: {
      getItem(key) {
        if (options.readBlocked) throw new Error('Blocked');
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        if (options.writeBlocked) throw new Error('Blocked');
        storage.set(key, value);
      },
      removeItem(key) {
        if (options.writeBlocked) throw new Error('Blocked');
        storage.delete(key);
      }
    },
    setTimeout(fn, ms) { const id = Symbol(); win.timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { win.timers.delete(id); }
  };
  const execute = () => runInNewContext(SOURCE, { window: win, document: doc });
  execute();
  const f = { win, doc, scripts, storage, cookieWrites, settings, options, execute };
  Object.defineProperty(f, 'notice', { get: () => elements.get('analytics-consent') });
  f.choose = analytics => f.notice.querySelector('[data-analytics-choice="' + analytics + '"]').emit('click');
  f.open = () => doc.emit('click', { target: settings });
  f.commands = () => win.dataLayer.filter(item => item[0]).map(item => Array.from(item));
  return f;
}

test('first visit denies all consent and requests no Google script', () => {
  const f = fixture();
  assert.equal(f.scripts.length, 0);
  assert.equal(f.win[DISABLE], true);
  assert.equal(f.notice.hidden, false);
  assert.equal(f.settings.hidden, false);
  assert.deepEqual(Object.values(f.commands()[0][2]), ['denied', 'denied', 'denied', 'denied']);
  assert.equal(f.storage.size, 0);
});

test('accept persists 180-day consent before loading only GTM once', () => {
  const f = fixture();
  const before = Date.now();
  f.choose('granted');
  const choice = JSON.parse(f.storage.get(KEY));
  assert.equal(choice.analytics, 'granted');
  assert.ok(choice.expires >= before + TTL && choice.expires <= Date.now() + TTL);
  assert.equal(f.win[DISABLE], false);
  assert.equal(f.notice.hidden, true);
  assert.equal(f.scripts[0].src, 'https://www.googletagmanager.com/gtm.js?id=GTM-MQ9CS753');
  const update = f.commands().find(c => c[0] === 'consent' && c[1] === 'update');
  assert.equal(update[2].analytics_storage, 'granted');
  for (const key of ['ad_storage', 'ad_user_data', 'ad_personalization']) assert.equal(update[2][key], 'denied');
  const queue = f.win.dataLayer;
  assert.ok(queue.findIndex(c => c[1] === 'update') < queue.findIndex(c => c.event === 'gtm.js'));
  f.open();
  f.choose('granted');
  f.win.emit('focus');
  f.execute();
  assert.equal(f.scripts.length, 1);
  assert.ok(!f.commands().some(c => c[0] === 'config' || c[0] === 'event'));
});

test('decline is remembered and stays untracked on the next page', () => {
  const f = fixture();
  f.choose('denied');
  assert.equal(f.scripts.length, 0);
  assert.equal(f.notice.hidden, true);
  const next = fixture({ saved: f.storage.get(KEY) });
  assert.equal(next.notice.hidden, true);
  assert.equal(next.scripts.length, 0);
  assert.equal(next.win[DISABLE], true);
});

test('saved valid opt-in loads GTM, without extending its expiry', () => {
  const value = saved('granted');
  const f = fixture({ saved: value });
  assert.equal(f.scripts.length, 1);
  assert.equal(f.storage.get(KEY), value);
  assert.equal(f.notice.hidden, true);
});

test('expired, malformed, future, or unsupported records fail closed', () => {
  for (const value of ['{', 'null', 'true', '{}', saved('yes'), saved('granted', Date.now() - 1),
    saved('granted', Date.now() + TTL * 2), '{"version":2,"analytics":"granted"}']) {
    const f = fixture({ saved: value });
    assert.equal(f.scripts.length, 0, value);
    assert.equal(f.notice.hidden, false, value);
  }
});

test('blocked reads or writes do not allow tracking, including a saved opt-in', () => {
  for (const options of [{ readBlocked: true }, { writeBlocked: true },
    { saved: saved('granted'), writeBlocked: true }]) {
    const f = fixture(options);
    f.choose('granted');
    assert.equal(f.scripts.length, 0);
    assert.equal(f.win[DISABLE], true);
    assert.equal(f.notice.hidden, false);
    assert.match(f.notice.querySelector('[role="status"]').textContent, /could not save/);
  }
});

test('withdrawal disables GA, expires only this analytics cookies and reloads', () => {
  const f = fixture({ saved: saved('granted'), hostname: 'www.celdyque.com' });
  f.open();
  f.choose('denied');
  assert.equal(f.win[DISABLE], true);
  assert.equal(f.win.reloads, 1);
  assert.equal(JSON.parse(f.storage.get(KEY)).analytics, 'denied');
  assert.ok(f.cookieWrites.some(c => c.startsWith('_ga_MHWJ7SQ6ZZ=') && c.includes('Domain=.celdyque.com')));
  assert.ok(f.cookieWrites.every(c => /^_ga(?:_MHWJ7SQ6ZZ)?=; Max-Age=0; Path=\//.test(c)));
  assert.equal(f.commands().at(-1)[2].analytics_storage, 'denied');
  assert.equal(fixture({ saved: f.storage.get(KEY) }).scripts.length, 0);
});

test('withdrawal still blocks the next page if storage becomes read-only', () => {
  const f = fixture({ saved: saved('granted') });
  f.options.writeBlocked = true;
  f.choose('denied');
  assert.equal(f.win[DISABLE], true);
  assert.equal(f.win.reloads, 1);
  assert.equal(fixture({ saved: f.storage.get(KEY), writeBlocked: true }).scripts.length, 0);
});

test('only the two exact production HTTPS hosts can load a tag', () => {
  for (const hostname of ['127.0.0.1', 'localhost', '05030522.github.io', 'preview.celdyque.com', 'celdyque.com.example.org']) {
    const f = fixture({ hostname });
    f.choose('granted');
    assert.equal(f.scripts.length, 0, hostname);
    assert.equal(f.win[DISABLE], true);
  }
  assert.equal(fixture({ protocol: 'http:', saved: saved('granted') }).scripts.length, 0);
});

test('cross-tab refusal or storage clearing stops an already loaded tag', () => {
  for (const clear of [true, false]) {
    const f = fixture({ saved: saved('granted') });
    if (clear) f.storage.clear();
    else f.storage.set(KEY, saved('denied'));
    f.win.emit('storage', { key: clear ? null : KEY });
    assert.equal(f.win.reloads, 1);
    assert.equal(f.win[DISABLE], true);
  }
});

test('expiry is rechecked on timers, page restore and visibility changes', () => {
  for (const event of ['timer', 'pageshow', 'visibilitychange']) {
    const f = fixture({ saved: saved('granted') });
    assert.ok([...f.win.timers.values()].every(t => t.ms > 0 && t.ms <= 2147483647));
    f.storage.set(KEY, saved('granted', Date.now() - 1));
    if (event === 'timer') [...f.win.timers.values()][0].fn();
    else (event === 'pageshow' ? f.win : f.doc).emit(event);
    assert.equal(f.win.reloads, 1);
  }
});

test('settings can reopen and dismiss with focus returned to the footer', () => {
  const f = fixture({ saved: saved('denied') });
  f.open();
  assert.equal(f.notice.hidden, false);
  assert.equal(f.notice.querySelector('h2').focused, true);
  assert.equal(f.notice.querySelector('.analytics-consent-keep').hidden, false);
  f.notice.emit('keydown', { key: 'Escape' });
  assert.equal(f.notice.hidden, true);
  assert.equal(f.settings.focused, true);
  assert.equal(f.doc.documentElement.style['--analytics-notice-height'], '0px');
});

test('initial banner cannot be dismissed as implicit consent; DOM-ready is supported', () => {
  const f = fixture({ readyState: 'loading' });
  assert.equal(f.notice, undefined);
  f.doc.emit('DOMContentLoaded');
  f.notice.emit('keydown', { key: 'Escape' });
  assert.equal(f.notice.hidden, false);
  assert.equal(f.scripts.length, 0);
});

test('shared assets are wired without direct Google scripts or noscript bypasses', () => {
  const site = readFileSync(path.join(ROOT, 'assets/site.js'), 'utf8');
  const footer = readFileSync(path.join(ROOT, 'partials/footer.html'), 'utf8');
  assert.match(site, /analyticsScript\.src = '\/assets\/analytics\.js\?v=20260828-consent'/);
  assert.match(site, /dispatchEvent\(new Event\('site:ready'\)\)/);
  assert.match(footer, /data-analytics-settings hidden/);
  for (const file of readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
    const html = readFileSync(path.join(ROOT, file), 'utf8');
    assert.doesNotMatch(html, /googletagmanager\.com\/(?:gtag\/js|gtm\.js|ns\.html)/, file);
    if (html.includes('/assets/site.css')) {
      assert.match(html, /src="\/assets\/site\.js\?v=20260831-retailer-order"/, file);
      assert.match(html, /href="\/assets\/site\.css\?v=20260831-retailer-order"/, file);
    }
  }
  const sw = readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.match(sw, /'\/assets\/analytics\.js\?v=20260828-consent'/);
});
