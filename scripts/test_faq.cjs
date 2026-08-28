const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

function fixture(hash = '') {
  const input = () => ({ value: '', handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } });
  const search = input();
  const filter = input();
  filter.value = 'all';
  const noResults = {};
  const items = [
    ['pdrn', 'PDRN serum'], ['pdrn', 'PDRN cream'], ['hair', 'Scalp roll-on']
  ].map(([cat, textContent]) => ({
    dataset: { cat }, textContent, hidden: false, open: false,
    matches: selector => selector.includes('.faq-item'),
    scrollIntoView() { this.scrolled = true; }
  }));
  const sections = ['pdrn', 'hair'].map(cat => ({
    querySelector: () => items.find(item => item.dataset.cat === cat && !item.hidden)
  }));
  const chip = input();
  const doc = {
    getElementById: id => ({ faqSearch: search, faqFilter: filter, noResults, 'question-1': items[0] })[id],
    querySelectorAll: selector => ({ '.faq-item': items, '.faq-section': sections, '.faq-chips a': [chip] })[selector],
    addEventListener() {}
  };
  const win = input();
  const location = { hash };
  runInNewContext(readFileSync(path.join(__dirname, '../assets/faq.js'), 'utf8'), {
    document: doc, window: win, location
  });
  return { search, filter, noResults, items, sections, chip, win, location };
}

test('topic change filters items and hides empty sections', () => {
  const f = fixture();
  f.filter.value = 'hair';
  f.filter.handlers.change();
  assert.deepEqual(f.items.map(item => item.hidden), [true, true, false]);
  assert.deepEqual(f.sections.map(section => section.hidden), [true, false]);
  assert.equal(f.noResults.hidden, true);
});

test('text and topic filters combine, including the no-results state', () => {
  const f = fixture();
  f.search.value = '  CREAM  ';
  f.search.handlers.input();
  assert.deepEqual(f.items.map(item => item.hidden), [true, false, true]);
  f.filter.value = 'hair';
  f.filter.handlers.change();
  assert.equal(f.noResults.hidden, false);
  assert.ok(f.sections.every(section => section.hidden));
});

test('clearing filters restores questions and section navigation', () => {
  const f = fixture();
  f.search.value = 'no such question';
  f.search.handlers.input();
  f.chip.handlers.click();
  assert.equal(f.search.value, '');
  assert.equal(f.filter.value, 'all');
  assert.ok(f.items.every(item => !item.hidden));
  assert.equal(f.noResults.hidden, true);
});

test('question deep links reveal and open the requested answer', () => {
  const f = fixture('#question-1');
  assert.equal(f.items[0].open, true);
  assert.equal(f.items[0].scrolled, true);
  f.filter.value = 'hair';
  f.filter.handlers.change();
  assert.equal(f.items[0].open, false);
  f.win.handlers.hashchange();
  assert.equal(f.items[0].open, true);
  assert.equal(f.filter.value, 'all');
});
