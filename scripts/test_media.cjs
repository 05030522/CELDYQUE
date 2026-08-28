const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

function worker() {
  const listeners = {};
  const context = {
    URL,
    self: {
      location: { origin: 'https://celdyque.com' },
      addEventListener: (name, handler) => { listeners[name] = handler; },
    },
    caches: { match: async () => undefined, open: async () => ({ put: async () => {} }) },
    fetch: async () => ({ clone: () => ({}) }),
  };
  vm.runInNewContext(readFileSync(join(__dirname, '..', 'sw.js'), 'utf8'), context);
  return listeners.fetch;
}

function request(path, destination = '', range = false) {
  return {
    url: `https://celdyque.com${path}`, method: 'GET', destination,
    headers: { has: (name) => name === 'range' && range, get: () => '' },
  };
}

test('range requests bypass the cache', () => {
  worker()({ request: request('/asset', '', true), respondWith: () => assert.fail('Range intercepted') });
});
test('native video requests bypass the cache', () => {
  worker()({ request: request('/video', 'video'), respondWith: () => assert.fail('Video intercepted') });
});
test('MP4 URLs bypass the cache even without a destination', () => {
  worker()({ request: request('/videos/film.mp4?v=1'), respondWith: () => assert.fail('MP4 intercepted') });
});
test('ordinary images still use the existing asset cache', async () => {
  let response;
  worker()({ request: request('/images/pa2.webp', 'image'), respondWith: (promise) => { response = promise; } });
  assert.ok(response);
  assert.ok(await response);
});
