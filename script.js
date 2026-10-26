/* =========================================================
   Axiom Mods — site script
   Renders from site-data.json, runs the starlight sky, the
   download tabs, and every interaction on the page.
   ========================================================= */
'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const MOD_ICONS = ['spawner', 'meteor', 'glazed', 'rig', 'tpa', 'sword', 'pickaxe', 'shield', 'eye', 'star',
  'box', 'bolt', 'map', 'crystal', 'potion', 'compass', 'chest'];
const CAT_ICONS = { clients: 'i-clients', utility: 'i-utility', macros: 'i-macros' };
const NUMBERS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

/* ---------- Small, careful helpers ---------- */
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = v => (/^https?:\/\/[^\s"'<>]+$/i.test(String(v || '').trim()) ? String(v).trim() : '');
const safeHref = v => {
  const s = String(v || '').trim();
  return /^#[\w-]*$/.test(s) ? s : safeUrl(s);
};
const safeRgb = v => (/^\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*$/.test(v || '') ? v.trim() : '34, 197, 94');
const slug = v => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other';
const store = (k, v) => {
  try {
    if (v === undefined) return localStorage.getItem(k);
    localStorage.setItem(k, v);
  } catch (e) { return null; }
  return null;
};

let DATA = null;
let currentTab = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  initSky();
  await loadData();
  initTabs();
  initCards();
  initAnnouncement();
  initRailNav();
  initMenu();
  initFaq();
  initProgress();
  initEgg();
  initDiscordCount();
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  // one orchestrated entrance, once
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('ready')));
});

/* =========================================================
   Data + rendering
   ========================================================= */
async function loadData() {
  try {
    const r = await fetch('site-data.json', { cache: 'no-store' });
    if (!r.ok) return;
    DATA = await r.json();
  } catch (e) { return; }               // the static copy in index.html stays
  try { render(DATA); } catch (e) { console.error('[axiom] render failed — showing the built-in copy', e); }
}

function liveMods(d) { return (Array.isArray(d.mods) ? d.mods : []).filter(m => m && m.name); }

function render(d) {
  const discord = safeUrl(d.links && d.links.discord);
  if (discord) $$('.js-discord').forEach(a => { a.href = discord; });
  const mods = liveMods(d);
  if (!mods.length || !$('#grid')) return;      // terms.html shares this script but has no grid

  // status line + headline count
  const n = mods.length;
  const updating = mods.filter(m => m.updating).length;
  const live = $('#live');
  if (live) {
    live.classList.toggle('warn', updating > 0);
    $('#live-text').textContent = updating
      ? `${updating} mod${updating > 1 ? 's' : ''} updating`
      : `All ${n} mod${n > 1 ? 's' : ''} online`;
  }
  const cw = $('#count-word'); if (cw) cw.textContent = NUMBERS[n] || String(n);
  const sub = $('#tabs-sub'); if (sub) sub.textContent = `${n} mod${n > 1 ? 's' : ''} for ${esc((d.site && d.site.version) || '1.21.11')}`;

  // cards + tabs
  $('#grid').innerHTML = mods.map((m, i) => cardHtml(m, i)).join('');
  const list = $('#tablist');
  $$('.tab', list).forEach(t => t.remove());
  list.insertAdjacentHTML('beforeend', tabsHtml(mods));


  // announcement
  const a = d.announcement || {};
  const bar = $('#announce');
  if (bar) {
    if (!a.enabled) bar.remove();
    else {
      bar.dataset.id = a.id || 'a';
      $('#ann-tag').textContent = a.tag || 'New';
      $('#ann-title').textContent = a.title || '';
      $('#ann-text').textContent = a.text || '';
      const link = $('#ann-link');
      const href = safeHref(a.link);
      if (href && a.linkText) { link.href = href; link.textContent = a.linkText; if (/^https?:/.test(href)) { link.target = '_blank'; link.rel = 'noopener'; } }
      else link.remove();
    }
  }
}

function badgeList(m) {
  const out = [];
  if (m.updating) out.push('<span class="badge b-upd">Updating</span>');
  (m.badges || []).forEach(b => {
    const isNew = /^new$/i.test(String(b).trim());
    out.push(`<span class="badge${isNew ? ' b-new' : ''}">${esc(b)}</span>`);
  });
  return out.join('');
}

function downloadHtml(m) {
  if (m.updating) {
    return `<span class="dl off" aria-disabled="true"><svg class="ic"><use href="#i-clock"/></svg>Updating — back soon</span>`;
  }
  const url = safeUrl(m.url);
  if (!url) return `<span class="dl off" aria-disabled="true"><svg class="ic"><use href="#i-clock"/></svg>Link coming soon</span>`;
  return `<a class="dl" href="${esc(url)}" rel="noreferrer" data-mod="${esc(m.name)}">
      <svg class="ic"><use href="#i-download"/></svg>Download</a>
    <p class="hint"><svg class="ic"><use href="#i-shield"/></svg>Adblocker on — ignore any other button on that page.</p>`;
}

function cardHtml(m, i) {
  const icon = MOD_ICONS.includes(m.icon) ? m.icon : 'box';
  const acc = safeRgb(m.accent);
  const cat = slug(m.category || 'Other');
  const ver = esc(m.mc || '1.21.11');
  const id = slug(m.id || m.name) || `mod-${i}`;
  const common = `id="${id}" data-cat="${cat}" data-new="${m.new ? 1 : 0}" style="--acc:${acc}"`;
  const oss = m.openSource ? `<p class="oss"><svg class="ic"><use href="#i-code"/></svg>Open source</p>` : '';
  const req = m.note ? `<p class="req"><svg class="ic"><use href="#i-alert"/></svg>${esc(m.note)}</p>` : '';
  const file = m.file ? `<p class="file">${esc(m.file)}</p>` : '';
  const tile = `<span class="tile" aria-hidden="true"><svg><use href="#m-${icon}"/></svg></span>`;

  if (m.featured) {
    const feats = (m.features || []).filter(Boolean)
      .map(f => `<li><svg class="ic"><use href="#i-check"/></svg>${esc(f)}</li>`).join('');
    return `<article class="card feat${m.updating ? ' is-upd' : ''}" ${common}>
      <span class="glowband" aria-hidden="true"></span>
      <div class="feat-main">
        <div class="card-top">${tile}<span class="vpill feat-pill-m">${ver}</span></div>
        <div class="card-name"><h3>${esc(m.name)}</h3>${badgeList(m)}</div>
        <p class="desc">${esc(m.description)}</p>
        ${feats ? `<ul class="feats">${feats}</ul>` : ''}
        ${oss}${req}
      </div>
      <div class="feat-side">
        <span class="vpill feat-pill">${ver}</span>
        <div class="card-foot">${file}${downloadHtml(m)}</div>
      </div>
    </article>`;
  }
  return `<article class="card${m.updating ? ' is-upd' : ''}" ${common}>
    <div class="card-top">${tile}<span class="vpill">${ver}</span></div>
    <div class="card-name"><h3>${esc(m.name)}</h3>${badgeList(m)}</div>
    <p class="desc">${esc(m.description)}</p>
    ${file}${oss}${req}
    <div class="card-foot">${downloadHtml(m)}</div>
  </article>`;
}

function tabsHtml(mods) {
  const cats = [];
  mods.forEach(m => { const c = (m.category || 'Other').trim() || 'Other'; if (!cats.includes(c)) cats.push(c); });
  const tab = (key, label, icon, count) =>
    `<button class="tab" role="tab" id="tab-${key}" data-key="${key}" aria-selected="false" aria-controls="grid" tabindex="-1">
      <svg class="ic"><use href="#${icon}"/></svg>${esc(label)}<span class="n">${count}</span></button>`;
  let html = tab('all', 'Everything', 'i-grid', mods.length);
  cats.forEach(c => {
    const key = slug(c);
    html += tab(key, c, CAT_ICONS[key] || 'i-tag', mods.filter(m => slug(m.category || 'Other') === key).length);
  });
  const fresh = mods.filter(m => m.new).length;
  if (fresh) html += tab('new', 'Just added', 'i-spark', fresh);
  return html;
}

/* =========================================================
   Tabs: slide the indicator, filter with a stagger,
   keep the choice in the URL
   ========================================================= */
function initTabs() {
  const list = $('#tablist');
  if (!list) return;
  const tabs = () => $$('.tab', list);

  list.addEventListener('click', e => {
    const t = e.target.closest('.tab'); if (!t) return;
    select(t.dataset.key, { animate: true, push: true });
  });
  list.addEventListener('keydown', e => {
    const all = tabs(); const i = all.indexOf(document.activeElement);
    if (i < 0) return;
    let j = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % all.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + all.length) % all.length;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = all.length - 1;
    if (j === null) return;
    e.preventDefault(); all[j].focus();
    select(all[j].dataset.key, { animate: true, push: true });
  });

  const fromHash = () => {
    const k = decodeURIComponent(location.hash.slice(1));
    return tabs().some(t => t.dataset.key === k) ? k : null;
  };
  window.addEventListener('popstate', () => select(fromHash() || 'all', { animate: true }));
  window.addEventListener('resize', () => placeIndicator(false));

  const start = fromHash();
  select(start || 'all', { animate: false });
  if (start) setTimeout(() => $('#downloads').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }), 300);
  // fonts can shift the tabs a little once loaded
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => placeIndicator(false));
}

function placeIndicator(animate = true) {
  const ind = $('#tab-ind'); const on = $('.tab[aria-selected="true"]');
  if (!ind || !on) return;
  const horizontal = getComputedStyle($('#tablist')).flexDirection === 'row';
  if (!animate) ind.style.transition = 'none';
  if (horizontal) {
    ind.style.transform = `translateX(${on.offsetLeft}px)`;
    ind.style.width = `${on.offsetWidth}px`;
    ind.style.height = `${on.offsetHeight}px`;
  } else {
    ind.style.transform = `translateY(${on.offsetTop}px)`;
    ind.style.width = '';
    ind.style.height = `${on.offsetHeight}px`;
  }
  if (!animate) { void ind.offsetWidth; ind.style.transition = ''; }
  if (horizontal && animate) on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
}

const matches = (card, key) =>
  key === 'all' ? true : key === 'new' ? card.dataset.new === '1' : card.dataset.cat === key;

function select(key, { animate = true, push = false } = {}) {
  const tabs = $$('#tablist .tab');
  if (!tabs.some(t => t.dataset.key === key)) key = 'all';
  tabs.forEach(t => {
    const on = t.dataset.key === key;
    t.setAttribute('aria-selected', on ? 'true' : 'false');
    t.tabIndex = on ? 0 : -1;
  });
  $('#grid').setAttribute('aria-labelledby', `tab-${key}`);
  placeIndicator(animate);
  if (push && key !== currentTab) history.pushState(null, '', key === 'all' ? '#downloads' : `#${key}`);
  const changed = key !== currentTab;
  currentTab = key;
  filterCards(key, animate && changed && !reduceMotion);
}

let filterRun = 0;
function filterCards(key, animate) {
  const run = ++filterRun;
  const grid = $('#grid');
  const cards = $$('.card', grid);
  const show = cards.filter(c => matches(c, key));
  const hide = cards.filter(c => !matches(c, key));
  const empty = $('.empty', grid);

  const finish = () => {
    if (run !== filterRun) return;
    hide.forEach(c => { c.hidden = true; c.classList.remove('leaving'); });
    const arriving = show.filter(c => c.hidden);
    show.forEach(c => { c.hidden = false; });
    if (!show.length && !empty) grid.insertAdjacentHTML('beforeend', '<p class="empty">Nothing in this category yet. Check back soon, or ask in the Discord.</p>');
    if (show.length && empty) empty.remove();
    if (animate) {
      (arriving.length ? arriving : show).forEach((c, i) => c.animate(
        [{ opacity: 0, transform: 'translateY(14px) scale(.985)' }, { opacity: 1, transform: 'none' }],
        { duration: 520, delay: i * 45, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
    }
  };

  const leaving = hide.filter(c => !c.hidden);
  if (!animate || !leaving.length) { finish(); return; }
  leaving.forEach(c => c.classList.add('leaving'));
  const anims = leaving.map(c => c.animate(
    [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.97)' }],
    { duration: 200, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }));
  Promise.all(anims.map(a => a.finished.catch(() => {}))).then(() => {
    anims.forEach(a => a.cancel());
    finish();
  });
}

/* =========================================================
   Cards: cursor spotlight, ripple, toast
   ========================================================= */
function initCards() {
  const grid = $('#grid');
  if (!grid) return;
  if (!reduceMotion && matchMedia('(hover: hover)').matches) {
    grid.addEventListener('pointermove', e => {
      const card = e.target.closest('.card'); if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }
  grid.addEventListener('click', e => {
    const a = e.target.closest('a.dl'); if (!a) return;
    if (!reduceMotion) {
      const r = a.getBoundingClientRect(); const size = Math.max(r.width, r.height) * 2;
      const dot = document.createElement('span');
      dot.className = 'ripple';
      Object.assign(dot.style, { width: `${size}px`, height: `${size}px`, left: `${e.clientX - r.left - size / 2}px`, top: `${e.clientY - r.top - size / 2}px` });
      a.appendChild(dot); setTimeout(() => dot.remove(), 700);
    }
    toast(`Downloading ${a.dataset.mod || 'your mod'}`, 'Remember: only the real download button.');
  });
}

let toastTimer;
function toast(title, sub) {
  const t = $('#toast'); if (!t) return;
  $('#toast-title').textContent = title;
  $('#toast-sub').textContent = sub;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 4200);
}

/* =========================================================
   Announcement (dismissal remembered per announcement)
   ========================================================= */
function initAnnouncement() {
  const bar = $('#announce'); const x = $('#ann-close');
  if (!bar || !x) return;
  const key = `axiom_ann_${bar.dataset.id || 'a'}`;
  if (store(key) === 'closed') { bar.remove(); return; }
  x.addEventListener('click', () => {
    bar.classList.add('gone'); store(key, 'closed');
    setTimeout(() => bar.remove(), 500);
  });
}

/* =========================================================
   Rail nav: highlight the section you're reading
   ========================================================= */
function initRailNav() {
  const links = $$('.railnav a[data-sec]');
  const menuLinks = $$('#menu a[href^="#"]');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      links.forEach(a => a.classList.toggle('on', a.dataset.sec === id));
      menuLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === `#${id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['downloads', 'install', 'faq', 'discord'].forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });
}

function initMenu() {
  const btn = $('#menu-btn'); const menu = $('#menu');
  if (!btn || !menu) return;
  const set = open => {
    menu.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
  };
  btn.addEventListener('click', () => set(!menu.classList.contains('open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
}

/* =========================================================
   FAQ: one open at a time, smooth height
   ========================================================= */
function initFaq() {
  const items = $$('.qa');
  items.forEach(qa => {
    const q = $('.qa-q', qa);
    q.addEventListener('click', () => {
      const open = !qa.classList.contains('open');
      items.forEach(o => { o.classList.remove('open'); $('.qa-q', o).setAttribute('aria-expanded', 'false'); });
      if (open) { qa.classList.add('open'); q.setAttribute('aria-expanded', 'true'); }
    });
  });
}

/* =========================================================
   Scroll progress + back-to-top ring
   ========================================================= */
function initProgress() {
  const bar = $('#progress'); const top = $('#totop'); const ring = $('#totop-ring');
  const C = 2 * Math.PI * 24;
  if (ring) { ring.style.strokeDasharray = `${C}`; ring.style.strokeDashoffset = `${C}`; }
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    if (bar) bar.style.transform = `scaleX(${p})`;
    if (ring) ring.style.strokeDashoffset = `${C * (1 - p)}`;
    if (top) top.classList.toggle('show', scrollY > innerHeight * 0.8);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  if (top) top.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  update();
}

/* =========================================================
   Easter egg: five clicks on the diamond
   ========================================================= */
function initEgg() {
  $$('.mark').forEach(mark => {
    let clicks = 0; let timer;
    mark.addEventListener('click', e => {
      clicks++;
      clearTimeout(timer); timer = setTimeout(() => { clicks = 0; }, 1400);
      if (!reduceMotion) { mark.classList.remove('wiggle'); void mark.offsetWidth; mark.classList.add('wiggle'); }
      if (clicks < 5) return;
      e.preventDefault(); clicks = 0;
      if (!reduceMotion) burst(mark);
      toast('You found the secret', 'Made by k35c');
    });
  });
}

function burst(el) {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
  for (let i = 0; i < 26; i++) {
    const g = document.createElement('span');
    g.className = 'gem-burst';
    g.innerHTML = '<svg viewBox="0 0 64 64"><use href="#logo"/></svg>';
    const ang = Math.random() * Math.PI * 2; const dist = 120 + Math.random() * 260;
    const s = 10 + Math.random() * 12;
    Object.assign(g.style, { left: `${cx - s / 2}px`, top: `${cy - s / 2}px`, width: `${s}px`, height: `${s}px` });
    g.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    g.style.setProperty('--dy', `${Math.sin(ang) * dist + 140}px`);
    g.style.setProperty('--rot', `${(Math.random() - 0.5) * 720}deg`);
    document.body.appendChild(g);
    setTimeout(() => g.remove(), 1400);
  }
}

/* =========================================================
   The starlight headliner
   Pinpoint stars, denser toward the top, each breathing on
   its own slow cycle. Two depth layers drift with scroll.
   ========================================================= */
function initSky() {
  const canvas = $('#sky');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0; let h = 0; let stars = []; let raf = 0; let running = false;
  let flare = null; let nextFlare = 0; let shooter = null; let nextShooter = 0;

  // one pre-rendered halo, stamped for every bright star (far cheaper than gradients per frame)
  const halo = document.createElement('canvas');
  const H = 64; halo.width = halo.height = H;
  const hc = halo.getContext('2d');
  const g = hc.createRadialGradient(H / 2, H / 2, 0, H / 2, H / 2, H / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,255,255,.75)');
  g.addColorStop(0.35, 'rgba(225,255,240,.18)');
  g.addColorStop(1, 'rgba(225,255,240,0)');
  hc.fillStyle = g; hc.fillRect(0, 0, H, H);

  const TINTS = ['255,255,255', '255,255,255', '255,255,255', '226,238,255', '205,255,228'];

  function build() {
    w = innerWidth; h = innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(620, Math.round((w * h) / 2300));
    stars = Array.from({ length: count }, () => {
      const bright = Math.random() < 0.1;
      const near = Math.random() < 0.35;
      return {
        x: Math.random() * w,
        y: Math.pow(Math.random(), 1.7) * h * 1.15,     // a headliner: thick at the top, thinning out
        r: bright ? 0.9 + Math.random() * 0.7 : 0.35 + Math.random() * 0.6,
        base: bright ? 0.55 + Math.random() * 0.25 : 0.18 + Math.random() * 0.4,
        amp: bright ? 0.35 + Math.random() * 0.25 : 0.25 + Math.random() * 0.4,
        speed: (0.18 + Math.random() * 0.55) / 1000,     // radians per ms — slow
        phase: Math.random() * Math.PI * 2,
        depth: near ? 0.06 : 0.025,
        bright,
        tint: TINTS[(Math.random() * TINTS.length) | 0],
      };
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const sy = scrollY;

    for (const s of stars) {
      // eased breathing: sine shaped into a softer rise and a longer, gentle fade
      const wave = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      let a = s.base + s.amp * (reduceMotion ? 0.6 : wave * wave * (3 - 2 * wave)) - s.amp * 0.3;
      let r = s.r;
      if (flare && flare.star === s) {
        const p = (t - flare.start) / flare.dur;
        const k = p < 0.25 ? p / 0.25 : p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45;
        a += k * 0.9; r *= 1 + k * 1.6;
      }
      a = Math.max(0, Math.min(1, a));
      let y = s.y - (reduceMotion ? 0 : sy * s.depth);
      y = ((y % (h * 1.15)) + h * 1.15) % (h * 1.15);
      if (y > h + 4) continue;

      if (s.bright || (flare && flare.star === s)) {
        const size = r * 14;
        ctx.globalAlpha = a * 0.85;
        ctx.drawImage(halo, s.x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${s.tint})`;
      ctx.beginPath(); ctx.arc(s.x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (reduceMotion) return;

    // now and then one star catches your eye
    if (t > nextFlare) {
      const pool = stars.filter(s => s.y < h * 0.7);
      flare = { star: pool[(Math.random() * pool.length) | 0], start: t, dur: 2600 };
      nextFlare = t + 10000 + Math.random() * 10000;
    }
    if (flare && t - flare.start > flare.dur) flare = null;

    // and very occasionally, a shooting star across the top
    if (t > nextShooter && !shooter) {
      const ang = (Math.PI / 180) * (16 + Math.random() * 14);
      shooter = { x: Math.random() * w * 0.6, y: Math.random() * h * 0.28, vx: Math.cos(ang) * 13, vy: Math.sin(ang) * 13, life: 0, max: 55 };
      nextShooter = t + 25000 + Math.random() * 20000;
    }
    if (shooter) {
      const p = shooter.life / shooter.max;
      const fade = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
      const tx = shooter.x - shooter.vx * 10; const ty = shooter.y - shooter.vy * 10;
      const grd = ctx.createLinearGradient(tx, ty, shooter.x, shooter.y);
      grd.addColorStop(0, 'rgba(255,255,255,0)');
      grd.addColorStop(1, `rgba(255,255,255,${fade})`);
      ctx.strokeStyle = grd; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(shooter.x, shooter.y); ctx.stroke();
      shooter.x += shooter.vx; shooter.y += shooter.vy; shooter.life++;
      if (shooter.life > shooter.max) shooter = null;
    }
  }

  function loop(t) { draw(t); if (running) raf = requestAnimationFrame(loop); }
  function start() {
    if (reduceMotion) { draw(0); return; }
    if (running) return;
    const now = performance.now();
    nextFlare = now + 4000; nextShooter = now + 9000;
    running = true; raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { build(); if (reduceMotion) draw(0); }, 150);
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  build();
  start();
}

/* =========================================================
   Live Discord member count
   Discord publishes approximate member and online counts for
   any invite. Cached for 10 minutes; hidden if it can't load.
   ========================================================= */
async function initDiscordCount() {
  const link = (DATA && DATA.links && DATA.links.discord) || ($('.js-discord') || {}).href || '';
  const m = String(link).match(/(?:discord\.gg|discord(?:app)?\.com\/invite)\/([\w-]+)/i);
  if (!m) return;
  const code = m[1];
  const key = `axiom_discord_${code}`;
  let counts = null;
  try {
    const cached = JSON.parse(store(key) || 'null');
    if (cached && Date.now() - cached.at < 10 * 60 * 1000) counts = cached;
  } catch (e) { /* ignore */ }
  if (!counts) {
    try {
      const r = await fetch(`https://discord.com/api/v9/invites/${encodeURIComponent(code)}?with_counts=true`);
      if (!r.ok) return;
      const j = await r.json();
      if (typeof j.approximate_member_count !== 'number') return;
      counts = { members: j.approximate_member_count, online: j.approximate_presence_count || 0, at: Date.now() };
      store(key, JSON.stringify(counts));
    } catch (e) { return; }
  }
  $$('#hero-members, #join-counts').forEach(el => el.classList.remove('hidden'));
  $$('[data-count]').forEach(el => countUp(el, counts[el.dataset.count] || 0));
}

function countUp(el, target) {
  const fmt = n => n.toLocaleString('en-GB');
  if (reduceMotion) { el.textContent = fmt(target); return; }
  const start = performance.now(); const dur = 1400;
  const tick = now => {
    const p = Math.min(1, (now - start) / dur);
    el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
