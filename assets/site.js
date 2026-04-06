/* ===== Partials inject ===== */
async function inject(selector, url) {
  const host = document.querySelector(selector);
  if (!host) return;

  const res = await fetch(url);
  const html = await res.text();
  host.innerHTML = html;
}

/* ===== Scroll lock (menu + modal 공용) ===== */
let scrollY = 0;
let lockCount = 0;

function lockBody() {
  lockCount += 1;
  if (lockCount !== 1) return;
  scrollY = window.scrollY || 0;
  document.body.style.top = `-${scrollY}px`;
  document.body.classList.add("menu-open");
}

function unlockBody() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount !== 0) return;
  document.body.classList.remove("menu-open");
  const y = Math.abs(parseInt(document.body.style.top || "0", 10)) || scrollY;
  document.body.style.top = "";
  window.scrollTo(0, y);
}

/* ===== Search Catalog (전체 제품 데이터) ===== */
const DEFAULT_CATALOG = [
  { id:"volufiline-100", name:"Volufiline 100% Concentrate", subtitle:"Firming & Volumizing", url:"/product-volufiline-100.html", image:"/images/제품/Mask group-1.webp", tags:["volufiline","serum","10ml"] },
  { id:"bakuchiol-30000", name:"Bakuchiol 30,000ppm Serum", subtitle:"Retinol-alternative", url:"/product-bakuchiol-30000.html", image:"/images/제품/Mask group-4.webp", tags:["bakuchiol","serum","30ml"] },
  { id:"pdrn-25", name:"PDRN 25% Concentrate", subtitle:"Skin Regeneration", url:"/product-pdrn-25.html", image:"/images/제품/Mask group-3.webp", tags:["pdrn","serum","30ml"] },
  { id:"pdrn-12-egf", name:"PDRN 12% + EGF Peptide Serum", subtitle:"Total Anti-aging", url:"/product-pdrn-12-egf.html", image:"/images/제품/Mask group.webp", tags:["pdrn","egf peptide","volufiline","serum","30ml"] },
  { id:"pdrn-12-egf-cream", name:"PDRN 12% + EGF Peptide Cream", subtitle:"Deep Moisturizing", url:"/product-pdrn-12-egf-cream.html", image:"/images/제품/Mask group-6.webp", tags:["pdrn","egf peptide","volufiline","cream","50ml"] },
  { id:"arbutxa-glow-cream", name:"ArbutXA Glow Cream", subtitle:"Brightening", url:"/product-arbutxa-glow-cream.html", image:"/images/제품/Mask group-5.webp", tags:["arbutin","txa","niacinamide","cream","50ml"] },
  { id:"gentle-cleanser", name:"Gentle Cleanser", subtitle:"Purifying Touch", url:"/product-gentle-cleanser.html", image:"/images/제품/Mask group-11.webp", tags:["centella","green tea","tea tree","cleanser","150ml"] },
  { id:"cleansing-oil", name:"Pore Purifying Cleansing Oil", subtitle:"Deep Clean", url:"/product-cleansing-oil.html", image:"/images/제품/Mask group-9.webp", tags:["heartleaf","centella","tea tree","cleanser","200ml"] },
  { id:"glutathione-30000", name:"Glutathione 30,000ppm", subtitle:"Antioxidant serum · Glow support", url:"/product-glutathione-30000.html", image:"/images/제품/Mask group-2.webp", tags:["glutathione","niacinamide","adenosine","ceramide","serum","30ml"] },
  { id:"azelaic-12", name:"Azelaic Acid 12%", subtitle:"Clarity serum · Tone & texture", url:"/product-azelaic-12.html", image:"/images/제품/Mask group-7.webp", tags:["azelaic acid","tranexamic acid","salicylic acid","serum","30ml"] },
  { id:"niacinamide-20-advanced", name:"Niacinamide 20% Advanced", subtitle:"High-strength · Tone & texture", url:"/product-niacinamide-20-advanced.html", image:"/images/제품/Mask group-8.webp", tags:["niacinamide","hyaluronic acid","beta-glucan","serum","30ml"] },
  { id:"advanced-retinol-pro-retinal-serum-0-5", name:"Retinal Serum 0.5", subtitle:"Retinal complex · Elasticity care", url:"/product-advanced-retinol-pro-retinal-serum-0-5.html", image:"/images/제품/Mask group-10.webp", tags:["retinal complex","centella 66%","niacinamide","serum","20ml"] },
  { id:"9-peptide-scalp-care-serum", name:"9-Peptide Scalp Serum", subtitle:"Rosemary 2% · Caffeine 1% · PDRN & Spicule 300", url:"/product-9-peptide-scalp-serum.html", image:"/images/제품/ms13.jpg", tags:["9-peptide complex","rosemary 2%","caffeine 1%","pdrn","spicule 300","scalp serum","roll-on","hair growth"] },
];

function getCatalog() {
  return Array.isArray(window.PRODUCT_CATALOG) ? window.PRODUCT_CATALOG : DEFAULT_CATALOG;
}

/* ===== String Highlight Helper ===== */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function highlight(text, query) {
  const t = String(text);
  const q = String(query || "").trim();
  if (!q) return escapeHtml(t);
  const idx = t.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return escapeHtml(t);
  const before = escapeHtml(t.slice(0, idx));
  const mid = escapeHtml(t.slice(idx, idx + q.length));
  const after = escapeHtml(t.slice(idx + q.length));
  return `${before}<span style="text-decoration:underline; text-underline-offset:3px">${mid}</span>${after}`;
}


/* ===== UI Initialization (Mobile Menu & Search Modal) ===== */
function initCommonUI() {
  // --- 1. Mobile Menu Logic ---
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

  function openMenu() {
    mobileMenuBtn?.classList.add('active');
    mobileMenu?.classList.add('active');
    mobileMenuOverlay?.classList.add('active');
    lockBody();
  }
  function closeMenu() {
    mobileMenuBtn?.classList.remove('active');
    mobileMenu?.classList.remove('active');
    mobileMenuOverlay?.classList.remove('active');
    unlockBody();
  }
  function toggleMenu() {
    if (mobileMenu?.classList.contains('active')) closeMenu();
    else openMenu();
  }

  mobileMenuBtn?.addEventListener('click', toggleMenu);
  mobileMenuOverlay?.addEventListener('click', closeMenu);

  // --- 2. Global Search Modal Injection & Logic ---
  // 만약 이미 모달이 없다면 HTML을 동적으로 삽입합니다.
  if (!document.getElementById('globalSearchModal')) {
    const searchModalHTML = `
      <div class="search-modal" id="globalSearchModal" aria-hidden="true">
        <div class="search-shell" role="dialog" aria-modal="true" aria-label="Search">
          <div class="search-top">
            <div class="search-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <div class="search-input-wrap">
              <input type="search" class="search-input" placeholder="Search products..." id="globalSearchInput" autocomplete="off">
            </div>
            <div class="search-actions">
              <button type="button" class="header-search-btn" id="globalSearchCloseBtn">ESC</button>
            </div>
          </div>
          <div class="search-hint">
            <div>Type to search</div>
            <div><span class="kbd">Esc</span> to close</div>
          </div>
          <div class="search-body">
            <div class="search-pane">
              <div class="pane-title">
                <h3>Results</h3>
                <span id="globalResultCount" style="font-size:0.85rem; color:#888;">0 items</span>
              </div>
              <div class="suggestions" id="globalSuggestionList" role="listbox"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', searchModalHTML);
  }

  // 모달 요소 연결
  const modal = document.getElementById('globalSearchModal');
  const input = document.getElementById('globalSearchInput');
  const list = document.getElementById('globalSuggestionList');
  const count = document.getElementById('globalResultCount');
  const closeBtn = document.getElementById('globalSearchCloseBtn');

  // data-open-search 속성이 있는 버튼(헤더 돋보기 등) 클릭 시 모달 열기
  document.addEventListener('click', (e) => {
    const searchTrigger = e.target.closest('[data-open-search]');
    if (searchTrigger) {
      e.preventDefault();
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      lockBody();
      input.value = '';
      renderResults([]);
      setTimeout(() => input.focus(), 100);
    }
  });

  function closeSearch() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    unlockBody();
  }

  closeBtn?.addEventListener('click', closeSearch);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeSearch(); });
  document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape' && modal?.classList.contains('open')) closeSearch(); 
    // Ctrl+K 단축키로 모달 열기
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (!modal?.classList.contains("open")) {
        document.querySelector('[data-open-search]')?.click();
      }
    }
  });

  // 실시간 검색 필터링 로직
  input?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderResults([]);
      return;
    }
    const catalog = getCatalog();
    const matches = catalog.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.subtitle.toLowerCase().includes(query) ||
      p.tags.some(t => t.toLowerCase().includes(query))
    );
    renderResults(matches, query);
  });

  // 검색 결과 렌더링
  function renderResults(items, query = "") {
    if (!count || !list) return;
    count.innerText = `${items.length} items`;
    list.innerHTML = '';
    
    if (items.length === 0 && input.value.trim() !== '') {
        list.innerHTML = '<div style="padding:20px; text-align:center; color:#888;">No products found.</div>';
        return;
    }
    
    items.forEach(item => {
      const el = document.createElement('a');
      el.className = 'suggestion-item';
      el.href = item.url;
      el.innerHTML = `
        <div class="s-img"><img src="${item.image}" alt=""></div>
        <div class="s-info">
          <div class="s-name">${highlight(item.name, query)}</div>
          <div class="s-sub">${escapeHtml(item.subtitle)}</div>
        </div>
      `;
      list.appendChild(el);
    });
  }
}

/* ===== Bootstrap ===== */
document.addEventListener("DOMContentLoaded", async () => {
  // 헤더와 푸터 HTML 주입
  await Promise.all([
    inject("#siteHeader", "/partials/header.html"),
    inject("#siteFooter", "/partials/footer.html"),
  ]);

  // 주입이 끝난 후 공통 UI(모바일 메뉴 및 검색 모달) 초기화
  initCommonUI();
});