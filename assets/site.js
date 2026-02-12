/* ===== Partials inject ===== */
async function inject(selector, url) {
  const host = document.querySelector(selector);
  if (!host) return;

  const res = await fetch(url, { cache: "no-cache" });
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

/* ===== Search Catalog (기본값) =====
   페이지별로 다르게 쓰고 싶으면, 각 페이지에서 site.js 로드 전에
   window.PRODUCT_CATALOG = [...] / window.RECOMMENDED_IDS = [...]
   이렇게 덮어쓰면 됩니다.
*/
const DEFAULT_CATALOG = [
  { id:"volufiline-100", name:"Volufiline 100%", subtitle:"Pure concentrate · Firming & volumizing", url:"/product-detail.html?sku=volufiline-100", image:"https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop", tags:["volufiline","firming","volume","sederma","concentrate"] },
  { id:"niacinamide-20", name:"Niacinamide 20%", subtitle:"High-strength · Tone & texture", url:"/product-detail.html?sku=niacinamide-20", image:"https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop", tags:["niacinamide","vitamin b3","texture","pores","serum"] },
  { id:"bakuchiol-30000", name:"Bakuchiol 30,000ppm", subtitle:"Retinol-alternative · Elasticity care", url:"/product-detail.html?sku=bakuchiol-30000", image:"https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=400&fit=crop", tags:["bakuchiol","retinol alternative","elasticity","anti-aging"] },
  { id:"vitamin-c-20", name:"Vitamin C 20%", subtitle:"Brightening · Antioxidant", url:"/product-detail.html?sku=vitamin-c-20", image:"https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?w=400&h=400&fit=crop", tags:["vitamin c","ascorbic","glow","antioxidant"] }
];

function getCatalog() {
  return Array.isArray(window.PRODUCT_CATALOG) ? window.PRODUCT_CATALOG : DEFAULT_CATALOG;
}
function getRecommendedIds() {
  return Array.isArray(window.RECOMMENDED_IDS) ? window.RECOMMENDED_IDS : ["volufiline-100","bakuchiol-30000","niacinamide-20"];
}

/* ===== Search helpers ===== */
const RECENT_KEY="celdyque_recent_searches_v1";
const RECENT_MAX=10;

function normalize(str){return (str||"").toLowerCase().replace(/\s+/g," ").trim()}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function highlight(text, query){
  const t=String(text);
  const q=String(query||"").trim();
  if(!q) return escapeHtml(t);
  const idx=t.toLowerCase().indexOf(q.toLowerCase());
  if(idx<0) return escapeHtml(t);
  const before=escapeHtml(t.slice(0,idx));
  const mid=escapeHtml(t.slice(idx, idx+q.length));
  const after=escapeHtml(t.slice(idx+q.length));
  return `${before}<span style="text-decoration:underline; text-underline-offset:3px">${mid}</span>${after}`;
}

function loadRecent(){
  try{
    const raw=localStorage.getItem(RECENT_KEY);
    const arr=raw?JSON.parse(raw):[];
    return Array.isArray(arr)?arr:[];
  }catch(_){return[]}
}
function saveRecent(arr){localStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0,RECENT_MAX)))}
function addRecent(query){
  const q=(query||"").trim();
  if(!q) return;
  const prev=loadRecent();
  const next=[q, ...prev.filter(x=>x.toLowerCase()!==q.toLowerCase())];
  saveRecent(next);
}
function removeRecent(query){
  const prev=loadRecent();
  const next=prev.filter(x=>x!==query);
  saveRecent(next);
}
function clearRecent(){saveRecent([])}

/* ===== Search scoring ===== */
function scoreProduct(p, qNorm){
  const name=normalize(p.name);
  const sub=normalize(p.subtitle);
  const tags=(p.tags||[]).map(normalize).join(" ");
  let score=0;
  if(!qNorm) return 0;
  if(name===qNorm) score+=100;
  if(name.startsWith(qNorm)) score+=70;
  if(name.includes(qNorm)) score+=45;
  if(sub.includes(qNorm)) score+=15;
  if(tags.includes(qNorm)) score+=12;

  const tokens=qNorm.split(" ").filter(Boolean);
  for(const t of tokens){
    if(t.length<2) continue;
    if(name.includes(t)) score+=10;
    if(tags.includes(t)) score+=6;
    if(sub.includes(t)) score+=4;
  }
  return score;
}

function searchProducts(query){
  const qNorm=normalize(query);
  if(!qNorm) return [];
  const catalog = getCatalog();
  return catalog
    .map(p=>({p, s:scoreProduct(p,qNorm)}))
    .filter(x=>x.s>0)
    .sort((a,b)=>b.s-a.s)
    .map(x=>x.p)
    .slice(0,8);
}

/* ===== Init common UI (after injection) ===== */
function initCommonUI() {
  // Mobile Menu
  const mobileMenuBtn=document.getElementById('mobileMenuBtn');
  const mobileMenu=document.getElementById('mobileMenu');
  const mobileMenuOverlay=document.getElementById('mobileMenuOverlay');

  function openMenu(){
    mobileMenuBtn?.classList.add('active');
    mobileMenu?.classList.add('active');
    mobileMenuOverlay?.classList.add('active');
    lockBody();
  }
  function closeMenu(){
    mobileMenuBtn?.classList.remove('active');
    mobileMenu?.classList.remove('active');
    mobileMenuOverlay?.classList.remove('active');
    unlockBody();
  }
  function toggleMenu(){
    if(mobileMenu?.classList.contains('active')) closeMenu();
    else openMenu();
  }

  mobileMenuBtn?.addEventListener('click', toggleMenu);
  mobileMenuOverlay?.addEventListener('click', closeMenu);

  // Search Modal
  const elModal=document.getElementById("searchModal");
  const elShell = elModal?.querySelector(".search-shell");
  const elInput=document.getElementById("searchInput");
  const elSuggestionList=document.getElementById("suggestionList");
  const elRecentChips=document.getElementById("recentChips");
  const elResultCount=document.getElementById("resultCount");
  const elStatus=document.getElementById("searchStatus");
  const elRecommendGrid=document.getElementById("recommendGrid");
  const elClearBtn=document.getElementById("clearBtn");
  const elClearRecentBtn=document.getElementById("clearRecentBtn");
  const elViewAllBtn=document.getElementById("viewAllBtn");
  const elCloseBtn=document.getElementById("closeBtn");
  const elGoShopBtn=document.getElementById("goShopBtn");

  let currentResults=[];
  let activeIndex=-1;

  function setActive(index){
    activeIndex=index;
    const items=[...(elSuggestionList?.querySelectorAll(".suggestion")||[])];
    items.forEach((node,i)=>node.classList.toggle("active", i===activeIndex));
  }

  function renderRecent(){
    if(!elRecentChips) return;
    const recents=loadRecent();
    elRecentChips.innerHTML="";
    if(recents.length===0){
      elRecentChips.innerHTML = `<div style="color:rgba(26,26,26,0.55);font-size:0.92rem;line-height:1.7">No recent searches yet.</div>`;
      return;
    }
    recents.forEach(q=>{
      const chip=document.createElement("div");
      chip.className="chip";
      chip.innerHTML=`<span>${escapeHtml(q)}</span><div class="x" title="Remove">×</div>`;
      chip.addEventListener("click",(e)=>{
        if(e.target && e.target.classList.contains("x")){
          e.stopPropagation();
          removeRecent(q);
          renderRecent();
          return;
        }
        elInput.value=q;
        handleInput();
        elInput.focus();
      });
      elRecentChips.appendChild(chip);
    });
  }

  function renderRecommended(){
    if(!elRecommendGrid) return;
    elRecommendGrid.innerHTML="";
    const catalog = getCatalog();
    const ids = getRecommendedIds();
    const items=ids.map(id=>catalog.find(p=>p.id===id)).filter(Boolean);
    items.forEach(p=>{
      const card=document.createElement("div");
      card.className="rec-card";
      card.innerHTML=`
        <div class="rec-thumb"><img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy"></div>
        <div class="rec-info">
          <div class="rec-name">${escapeHtml(p.name)}</div>
          <div class="rec-meta">${escapeHtml(p.subtitle)}</div>
        </div>
      `;
      card.addEventListener("click",()=>window.location.href=p.url);
      elRecommendGrid.appendChild(card);
    });
  }

  function renderSuggestions(list, query){
    if(!elSuggestionList || !elResultCount || !elStatus) return;
    elSuggestionList.innerHTML="";
    currentResults=list;
    activeIndex=-1;

    elResultCount.textContent = `${list.length} item${list.length===1?"":"s"}`;

    if(!query.trim()){
      elStatus.textContent="Type to search products.";
      return;
    }

    if(list.length===0){
      elStatus.textContent="No matches. Try another keyword.";
      elSuggestionList.innerHTML = `
        <div style="padding:14px 12px;color:rgba(26,26,26,0.55);font-size:0.92rem">
          No results for "<strong>${escapeHtml(query)}</strong>"
        </div>`;
      return;
    }

    elStatus.textContent="Use ↑↓ to navigate, Enter to open.";

    list.forEach((p, idx)=>{
      const el=document.createElement("div");
      el.className="suggestion";
      el.setAttribute("role","option");

      const priceHtml = (typeof p.price === "number")
        ? `<div class="s-price">$${p.price.toFixed(2)}</div>`
        : "";

      el.innerHTML=`
        <div class="s-left">
          <div class="s-title">${highlight(p.name, query)}</div>
          <div class="s-sub">${escapeHtml(p.subtitle)}</div>
        </div>
        <div class="s-right">
          ${priceHtml}
          <div class="s-go">↗</div>
        </div>
      `;
      el.addEventListener("mouseenter", ()=>setActive(idx));
      el.addEventListener("mouseleave", ()=>setActive(-1));
      el.addEventListener("click", ()=>{
        addRecent(query);
        window.location.href=p.url;
      });
      elSuggestionList.appendChild(el);
    });
  }

  function handleInput(){
    if(!elInput || !elClearBtn) return;
    const q=elInput.value||"";
    elClearBtn.style.opacity = q.trim() ? "1" : "0.6";
    const results=searchProducts(q);
    renderSuggestions(results, q);
  }

  function viewAllSearch(){
    const q=(elInput?.value||"").trim();
    if(!q) return;
    addRecent(q);
    window.location.href="/shop.html?q="+encodeURIComponent(q);
  }

  function openActive(){
    if(activeIndex>=0 && currentResults[activeIndex]){
      const p=currentResults[activeIndex];
      addRecent(elInput.value);
      window.location.href=p.url;
      return;
    }
    viewAllSearch();
  }

  function openSearch(){
    if(!elModal) return;
    elModal.classList.add("active");
    elModal.setAttribute("aria-hidden","false");
    lockBody();
    renderRecent();
    renderRecommended();
    handleInput();
    setTimeout(()=>elInput?.focus(), 30);
  }

  function closeSearchForce(){
    if(!elModal) return;
    elModal.classList.remove("active");
    elModal.setAttribute("aria-hidden","true");
    unlockBody();
  }

  // open 버튼(헤더 안)
  document.querySelectorAll("[data-open-search]").forEach(btn=>{
    btn.addEventListener("click", openSearch);
  });

  // 바깥 클릭 닫기: modal 배경 클릭 시
  elModal?.addEventListener("click",(e)=>{
    if(e.target && e.target.id === "searchModal") closeSearchForce();
  });

  // shell 클릭은 전파 방지
  elShell?.addEventListener("click",(e)=>e.stopPropagation());

  elInput?.addEventListener("input", handleInput);

  elInput?.addEventListener("keydown",(e)=>{
    const items=currentResults||[];
    if(e.key==="ArrowDown"){
      e.preventDefault(); if(!items.length) return;
      setActive(Math.min(activeIndex+1, items.length-1));
    }else if(e.key==="ArrowUp"){
      e.preventDefault(); if(!items.length) return;
      setActive(Math.max(activeIndex-1, 0));
    }else if(e.key==="Enter"){
      e.preventDefault(); openActive();
    }else if(e.key==="Escape"){
      closeSearchForce();
    }
  });

  document.addEventListener("keydown",(e)=>{
    if(e.key==="Escape" && elModal?.classList.contains("active")) closeSearchForce();
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="k"){
      e.preventDefault();
      if(!elModal?.classList.contains("active")) openSearch();
    }
  });

  const clickLike = (el, fn) => {
    if(!el) return;
    el.addEventListener("click", fn);
    el.addEventListener("keydown",(e)=>{ if(e.key==="Enter"||e.key===" ") fn(); });
  };

  clickLike(elClearBtn, ()=>{ elInput.value=""; handleInput(); elInput.focus(); });
  elClearRecentBtn?.addEventListener("click", ()=>{ clearRecent(); renderRecent(); });
  elViewAllBtn?.addEventListener("click", viewAllSearch);
  clickLike(elCloseBtn, closeSearchForce);
  elGoShopBtn?.addEventListener("click", ()=>window.location.href="/shop.html");
}

/* ===== Bootstrap ===== */
document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    inject("#siteHeader", "/partials/header.html"),
    inject("#siteFooter", "/partials/footer.html"),
  ]);

  initCommonUI();
});
