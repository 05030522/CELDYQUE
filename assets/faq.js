(() => {
  const search = document.getElementById('faqSearch');
  const filter = document.getElementById('faqFilter');
  const items = [...document.querySelectorAll('.faq-item')];
  const sections = [...document.querySelectorAll('.faq-section')];
  const noResults = document.getElementById('noResults');
  if (!search || !filter || !noResults) return;

  function applyFilters() {
    const query = search.value.toLowerCase().trim();
    let count = 0;
    for (const item of items) {
      const matches = (!query || item.textContent.toLowerCase().includes(query)) &&
        (filter.value === 'all' || item.dataset.cat === filter.value);
      item.hidden = !matches;
      if (matches) count++;
      else item.open = false;
    }
    for (const section of sections) {
      section.hidden = !section.querySelector('.faq-item:not([hidden])');
    }
    noResults.hidden = count !== 0;
  }

  function revealFragment() {
    const target = document.getElementById(location.hash.slice(1));
    if (!target?.matches('.faq-section, .faq-item')) return;
    search.value = '';
    filter.value = 'all';
    applyFilters();
    if (target.matches('.faq-item')) target.open = true;
    target.scrollIntoView({ block: 'start' });
  }

  search.addEventListener('input', applyFilters);
  filter.addEventListener('change', applyFilters);
  document.querySelectorAll('.faq-chips a').forEach(link => {
    link.addEventListener('click', () => {
      search.value = '';
      filter.value = 'all';
      applyFilters();
    });
  });
  window.addEventListener('hashchange', revealFragment);
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      search.focus();
    }
  });
  applyFilters();
  revealFragment();
})();
