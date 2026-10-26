/* =========================================================
   Axiom Mods — site script
   Works when the site is online and when index.html is opened
   straight from a folder: the mod data is also embedded in the
   page, so nothing depends on a network request succeeding.
   ========================================================= */
(function () {
'use strict';

var reduceMotion = false;
try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
var finePointer = false;
try { finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) {}

function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function safeUrl(v) { var s = String(v || '').trim(); return /^https?:\/\/[^\s"'<>]+$/i.test(s) ? s : ''; }
function safeHref(v) { var s = String(v || '').trim(); return /^#[\w\/-]*$/.test(s) ? s : safeUrl(s); }
function safeRgb(v) { return /^\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*$/.test(v || '') ? String(v).trim() : '34, 197, 94'; }
function slug(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other'; }
function store(k, v) {
  try {
    if (v === undefined) return window.localStorage.getItem(k);
    window.localStorage.setItem(k, v);
  } catch (e) { /* private mode or blocked storage: fine */ }
  return null;
}

var MOD_ICONS = ['spawner', 'meteor', 'glazed', 'rig', 'tpa', 'sword', 'pickaxe', 'eye', 'star', 'box', 'bolt', 'shield', 'map', 'crystal', 'potion', 'compass', 'chest'];
var CAT_ICONS = { clients: 'i-clients', utility: 'i-utility', macros: 'i-macros' };
var NUMBERS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

var DATA = window.AXIOM_FALLBACK || null;
var currentTab = 'all';

function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

ready(function () {
  if (DATA) safely(function () { render(DATA); });
  safely(initSky);
  safely(initTerms);
  safely(initTicket);
  safely(initTabs);
  safely(initCards);
  safely(initAnnouncement);
  safely(initNav);
  safely(initFaq);
  safely(initProgress);
  safely(initEgg);
  safely(initReveal);
  safely(initDeepLink);
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.className += ' ready'; }); });
  refreshData();
});

function safely(fn) { try { fn(); } catch (e) { if (window.console) console.error('[axiom]', e); } }

/* =========================================================
   Data: embedded copy first, then the live file if newer
   ========================================================= */
function refreshData() {
  var done = function () { safely(initDiscordCount); };
  if (!window.fetch || location.protocol === 'file:') { done(); return; }
  fetch('site-data.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (d && JSON.stringify(d) !== JSON.stringify(DATA)) {
        DATA = d;
        safely(function () { render(d); select(currentTab, { animate: false }); revealNow(); });
      }
      done();
    })
    .catch(done);
}

function liveMods(d) { return (d && d.mods && d.mods.length ? d.mods : []).filter(function (m) { return m && m.name; }); }

function render(d) {
  var discord = safeUrl(d.links && d.links.discord);
  if (discord) $$('.js-discord').forEach(function (a) { a.href = discord; });
  if (d.discord) setCounts(d.discord.members, d.discord.online, false);
  safely(function () { renderExtras(d); });

  var mods = liveMods(d);
  var grid = $('#grid');
  if (!mods.length || !grid) return;

  var n = mods.length;
  var updating = mods.filter(function (m) { return m.updating; }).length;
  var live = $('#live');
  if (live) {
    live.className = 'live' + (updating ? ' warn' : '');
    $('#live-text').textContent = updating ? updating + ' mod' + (updating > 1 ? 's' : '') + ' updating' : 'All ' + n + ' mod' + (n > 1 ? 's' : '') + ' online';
  }
  var cw = $('#count-word'); if (cw) cw.textContent = NUMBERS[n] || String(n);

  grid.innerHTML = mods.map(cardHtml).join('');
  var list = $('#tablist');
  if (list) { $$('.tab', list).forEach(function (t) { t.parentNode.removeChild(t); }); list.insertAdjacentHTML('beforeend', tabsHtml(mods)); }

  var a = d.announcement || {};
  var bar = $('#announce');
  if (bar && !bar.classList.contains('gone')) {
    if (!a.enabled) bar.style.display = 'none';
    else {
      bar.style.display = '';
      bar.setAttribute('data-id', a.id || 'a');
      $('#ann-tag').textContent = a.tag || 'New';
      $('#ann-title').textContent = a.title || '';
      $('#ann-text').textContent = a.text || '';
      var link = $('#ann-link'); var href = safeHref(a.link);
      if (link) {
        if (href && a.linkText) { link.style.display = ''; link.href = href; link.textContent = a.linkText; if (/^https?:/.test(href)) { link.target = '_blank'; link.rel = 'noopener'; } }
        else link.style.display = 'none';
      }
    }
  }
}

function ago(dateStr) {
  var t = Date.parse(dateStr); if (isNaN(t)) return null;
  var days = Math.floor((Date.now() - t) / 86400000);
  var txt = days <= 0 ? 'Updated today' : days === 1 ? 'Updated yesterday' : days < 30 ? 'Updated ' + days + ' days ago'
    : days < 60 ? 'Updated a month ago' : 'Updated ' + Math.floor(days / 30) + ' months ago';
  return { txt: txt, fresh: days < 7 };
}

function badgeList(m) {
  var out = [];
  if (m.updating) out.push('<span class="badge b-upd">Updating</span>');
  (m.badges || []).forEach(function (b) { out.push('<span class="badge' + (/^new$/i.test(String(b).trim()) ? ' b-new' : '') + '">' + esc(b) + '</span>'); });
  return out.join('');
}

function downloadHtml(m) {
  if (m.updating) return '<span class="dl off" aria-disabled="true"><svg class="ic"><use href="#i-clock"/></svg>Updating — back soon</span>';
  var url = safeUrl(m.url);
  if (!url) return '<span class="dl off" aria-disabled="true"><svg class="ic"><use href="#i-clock"/></svg>Link coming soon</span>';
  return '<a class="dl" href="' + esc(url) + '" rel="noreferrer" data-id="' + esc(slug(m.id || m.name)) + '"><svg class="ic"><use href="#i-download"/></svg>Download</a>' +
    '<p class="hint"><svg class="ic"><use href="#i-shield"/></svg>Adblocker on — ignore any other button on that page.</p>';
}

function cardHtml(m, i) {
  var icon = MOD_ICONS.indexOf(m.icon) >= 0 ? m.icon : 'box';
  var acc = safeRgb(m.accent);
  var id = slug(m.id || m.name);
  var ver = esc(m.mc || '1.21.11');
  var when = ago(m.updated);
  var meta = (m.file || when) ? '<p class="meta">' + (m.file ? '<span class="file">' + esc(m.file) + '</span>' : '') +
    (when ? '<span class="when' + (when.fresh ? ' fresh' : '') + '"><svg class="ic"><use href="#i-clock"/></svg>' + when.txt + '</span>' : '') + '</p>' : '';
  var oss = m.openSource ? '<p class="oss"><svg class="ic"><use href="#i-code"/></svg>Open source</p>' : '';
  var req = m.note ? '<p class="req"><svg class="ic"><use href="#i-alert"/></svg>' + esc(m.note) + '</p>' : '';
  var tile = '<span class="tile" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#m-' + icon + '"/></svg></span>';
  var topR = '<span class="top-r"><span class="vpill">' + ver + '</span><button class="share" type="button" data-share="' + esc(id) + '" aria-label="Copy a link to ' + esc(m.name) + '"><svg class="ic"><use href="#i-share"/></svg></button></span>';
  var attrs = 'id="mod-' + esc(id) + '" data-cat="' + slug(m.category || 'Other') + '" data-new="' + (m.new ? 1 : 0) + '" style="--acc:' + acc + ';--rd:' + ((i % 4) * 0.07) + 's"';

  if (m.featured) {
    var feats = (m.features || []).filter(Boolean).map(function (f) { return '<li><svg class="ic"><use href="#i-check"/></svg>' + esc(f) + '</li>'; }).join('');
    return '<article class="card feat reveal' + (m.updating ? ' is-upd' : '') + '" ' + attrs + '>' +
      '<div><div class="card-top">' + tile + '<span class="feat-m">' + topR + '</span></div>' +
      '<div class="card-name"><h3>' + esc(m.name) + '</h3>' + badgeList(m) + '</div>' +
      '<p class="desc">' + esc(m.description) + '</p>' + (feats ? '<ul class="feats">' + feats + '</ul>' : '') + oss + req + '</div>' +
      '<div class="feat-side">' + topR + '<div class="card-foot">' + meta + '<div style="height:12px"></div>' + downloadHtml(m) + '</div></div></article>';
  }
  return '<article class="card reveal' + (m.updating ? ' is-upd' : '') + '" ' + attrs + '>' +
    '<div class="card-top">' + tile + topR + '</div>' +
    '<div class="card-name"><h3>' + esc(m.name) + '</h3>' + badgeList(m) + '</div>' +
    '<p class="desc">' + esc(m.description) + '</p>' + meta + oss + req +
    '<div class="card-foot">' + downloadHtml(m) + '</div></article>';
}

function tabsHtml(mods) {
  var cats = [];
  mods.forEach(function (m) { var c = String(m.category || 'Other').trim() || 'Other'; if (cats.indexOf(c) < 0) cats.push(c); });
  function tab(key, label, icon, count) {
    return '<button class="tab" type="button" role="tab" id="tab-' + key + '" data-key="' + key + '" aria-selected="false" aria-controls="grid" tabindex="-1">' +
      '<svg class="ic"><use href="#' + icon + '"/></svg>' + esc(label) + '<span class="n">' + count + '</span></button>';
  }
  var html = tab('all', 'Everything', 'i-grid', mods.length);
  cats.forEach(function (c) {
    var key = slug(c);
    html += tab(key, c, CAT_ICONS[key] || 'i-tag', mods.filter(function (m) { return slug(m.category || 'Other') === key; }).length);
  });
  var fresh = mods.filter(function (m) { return m.new; }).length;
  if (fresh) html += tab('new', 'Just added', 'i-spark', fresh);
  return html;
}

function modById(id) { return liveMods(DATA).filter(function (m) { return slug(m.id || m.name) === id; })[0]; }

/* =========================================================
   Discord counts: the saved numbers always show; when Discord
   answers, they count up to the live figures.
   ========================================================= */
function fmt(n) { n = Number(n) || 0; return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

function setCounts(members, online, animate) {
  $$('[data-count]').forEach(function (el) {
    var target = el.getAttribute('data-count') === 'members' ? members : online;
    if (target == null) return;
    if (animate && !reduceMotion) countUp(el, Number(target) || 0);
    else el.textContent = fmt(target);
  });
}

function countUp(el, target) {
  var from = Number(String(el.textContent).replace(/[^\d]/g, '')) || 0;
  var start = null;
  function tick(now) {
    if (start === null) start = now;
    var p = Math.min(1, (now - start) / 1400);
    el.textContent = fmt(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initDiscordCount() {
  var link = (DATA && DATA.links && DATA.links.discord) || '';
  var m = String(link).match(/(?:discord\.gg|discord(?:app)?\.com\/invite)\/([\w-]+)/i);
  if (!m || !window.fetch) return;
  var code = m[1];
  var key = 'axiom_discord_' + code;
  try {
    var cached = JSON.parse(store(key) || 'null');
    if (cached && Date.now() - cached.at < 10 * 60 * 1000) { setCounts(cached.members, cached.online, false); return; }
  } catch (e) {}
  fetch('https://discord.com/api/v9/invites/' + encodeURIComponent(code) + '?with_counts=true')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j || typeof j.approximate_member_count !== 'number') return;
      var c = { members: j.approximate_member_count, online: j.approximate_presence_count || 0, at: Date.now() };
      store(key, JSON.stringify(c));
      setCounts(c.members, c.online, true);
    })
    .catch(function () { /* the saved numbers stay on screen */ });
}

/* =========================================================
   Tabs
   ========================================================= */
function initTabs() {
  var list = $('#tablist'); if (!list) return;
  function tabs() { return $$('.tab', list); }
  list.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('.tab') : null; if (!t) return;
    select(t.getAttribute('data-key'), { animate: true, push: true });
  });
  list.addEventListener('keydown', function (e) {
    var all = tabs(); var i = all.indexOf(document.activeElement); if (i < 0) return;
    var j = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % all.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + all.length) % all.length;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = all.length - 1;
    if (j === null) return;
    e.preventDefault(); all[j].focus(); select(all[j].getAttribute('data-key'), { animate: true, push: true });
  });
  window.addEventListener('popstate', function () { var k = hashTab(); select(k || 'all', { animate: true }); });
  window.addEventListener('resize', function () { placeIndicator(false); });
  var start = hashTab();
  select(start || 'all', { animate: false });
  if (start) setTimeout(function () { var d = $('#downloads'); if (d) d.scrollIntoView(); }, 200);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeIndicator(false); });
  setTimeout(function () { placeIndicator(false); }, 600);
}

function hashTab() {
  var k = decodeURIComponent(location.hash.slice(1));
  return $$('#tablist .tab').some(function (t) { return t.getAttribute('data-key') === k; }) ? k : null;
}

function placeIndicator(animate) {
  var ind = $('#tab-ind'); var on = $('.tab[aria-selected="true"]');
  if (!ind || !on) return;
  if (animate === false) ind.style.transition = 'none';
  ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
  ind.style.width = on.offsetWidth + 'px';
  if (animate === false) { void ind.offsetWidth; ind.style.transition = ''; }
  var list = $('#tablist');
  if (list && list.scrollWidth > list.clientWidth) {
    var target = on.offsetLeft - (list.clientWidth - on.offsetWidth) / 2;
    if (list.scrollTo) list.scrollTo({ left: target, behavior: animate && !reduceMotion ? 'smooth' : 'auto' }); else list.scrollLeft = target;
  }
}

function matches(card, key) { return key === 'all' ? true : key === 'new' ? card.getAttribute('data-new') === '1' : card.getAttribute('data-cat') === key; }

function select(key, opts) {
  opts = opts || {};
  var tabs = $$('#tablist .tab');
  if (!tabs.some(function (t) { return t.getAttribute('data-key') === key; })) key = 'all';
  tabs.forEach(function (t) { var on = t.getAttribute('data-key') === key; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
  var grid = $('#grid'); if (grid) grid.setAttribute('aria-labelledby', 'tab-' + key);
  placeIndicator(opts.animate);
  if (opts.push && key !== currentTab && window.history && history.pushState) history.pushState(null, '', key === 'all' ? '#downloads' : '#' + key);
  var changed = key !== currentTab;
  currentTab = key;
  filterCards(key, opts.animate && changed && !reduceMotion);
}

var filterRun = 0;
function filterCards(key, animate) {
  var run = ++filterRun;
  var grid = $('#grid'); if (!grid) return;
  var cards = $$('.card', grid);
  var show = cards.filter(function (c) { return matches(c, key); });
  var hide = cards.filter(function (c) { return !matches(c, key); });
  var canAnimate = animate && typeof Element.prototype.animate === 'function';

  function finish() {
    if (run !== filterRun) return;
    hide.forEach(function (c) { c.style.display = 'none'; });
    var arriving = show.filter(function (c) { return c.style.display === 'none'; });
    show.forEach(function (c) { c.style.display = ''; if (canAnimate) c.classList.add('in'); });
    var empty = $('.empty', grid);
    if (!show.length && !empty) grid.insertAdjacentHTML('beforeend', '<p class="empty">Nothing in this category yet. Check back soon, or ask in the Discord.</p>');
    if (show.length && empty) empty.parentNode.removeChild(empty);
    if (canAnimate) {
      (arriving.length ? arriving : show).forEach(function (c, i) {
        c.animate([{ opacity: 0, transform: 'translateY(16px) scale(.98)' }, { opacity: 1, transform: 'none' }],
          { duration: 560, delay: i * 55, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      });
    }
  }
  var leaving = hide.filter(function (c) { return c.style.display !== 'none'; });
  if (!canAnimate || !leaving.length) { finish(); return; }
  var left = leaving.length;
  leaving.forEach(function (c) {
    var a = c.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 200, easing: 'cubic-bezier(.65,0,.35,1)' });
    a.onfinish = function () { if (--left === 0) finish(); };
  });
}

/* =========================================================
   Cards: tilt, spotlight, ripple, share, requirement helper
   ========================================================= */
function initCards() {
  var grid = $('#grid'); if (!grid) return;
  if (finePointer && !reduceMotion) {
    grid.addEventListener('mousemove', function (e) {
      var card = e.target.closest ? e.target.closest('.card') : null; if (!card) return;
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width; var y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (x * 100) + '%');
      card.style.setProperty('--my', (y * 100) + '%');
      var k = card.classList.contains('feat') ? 2.5 : 5;
      card.style.setProperty('--rx', ((0.5 - y) * k) + 'deg');
      card.style.setProperty('--ry', ((x - 0.5) * k) + 'deg');
    });
    grid.addEventListener('mouseout', function (e) {
      var card = e.target.closest ? e.target.closest('.card') : null;
      if (!card || card.contains(e.relatedTarget)) return;
      card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
    });
  }
  // the featured card's glowing edge slowly travels round
  if (!reduceMotion) {
    var deg = 0;
    (function spinEdge() {
      deg = (deg + 0.6) % 360;
      var f = $('#grid .card.feat'); if (f) f.style.setProperty('--edge', deg + 'deg');
      requestAnimationFrame(spinEdge);
    })();
  }

  grid.addEventListener('click', function (e) {
    var share = e.target.closest ? e.target.closest('[data-share]') : null;
    if (share) { shareMod(share.getAttribute('data-share')); return; }
    var a = e.target.closest ? e.target.closest('a.dl') : null; if (!a) return;
    if (!termsAgreed()) { e.preventDefault(); openTerms(a.href); return; }
    if (!reduceMotion) {
      var r = a.getBoundingClientRect(); var size = Math.max(r.width, r.height) * 2;
      var dot = document.createElement('span'); dot.className = 'ripple';
      dot.style.width = dot.style.height = size + 'px';
      dot.style.left = (e.clientX - r.left - size / 2) + 'px'; dot.style.top = (e.clientY - r.top - size / 2) + 'px';
      a.appendChild(dot); setTimeout(function () { if (dot.parentNode) dot.parentNode.removeChild(dot); }, 700);
    }
    var mod = modById(a.getAttribute('data-id'));
    var needs = (mod && mod.requires || []).map(modById).filter(function (x) { return x && !x.updating && safeUrl(x.url); });
    if (needs.length) {
      var n = needs[0];
      toast(mod.name + ' needs ' + n.name, 'It won\'t load on its own. Grab both and put them in your mods folder.',
        { warn: true, icon: 'i-alert', action: { text: 'Download ' + n.name, href: safeUrl(n.url) }, ms: 9000 });
    } else {
      toast('Downloading ' + (mod ? mod.name : 'your mod'), 'Remember: only the real download button.');
    }
  });
}

function shareMod(id) {
  var url = location.href.split('#')[0] + '#mod/' + id;
  var mod = modById(id);
  function ok() { toast('Link copied', 'Anyone who opens it lands right on ' + (mod ? mod.name : 'this mod') + '.', { icon: 'i-share' }); }
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(ok, fallback); else fallback();
  function fallback() {
    var t = document.createElement('textarea'); t.value = url; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); ok(); } catch (e) { window.prompt('Copy this link:', url); }
    document.body.removeChild(t);
  }
}

function initDeepLink() {
  var m = location.hash.match(/^#mod\/([\w-]+)$/); if (!m) return;
  setTimeout(function () {
    var card = document.getElementById('mod-' + m[1]); if (!card) return;
    card.classList.add('in');
    card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    setTimeout(function () { card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash'); }, 500);
  }, 450);
}

var toastTimer;
function toast(title, sub, opts) {
  opts = opts || {};
  var t = $('#toast'); if (!t) return;
  $('#toast-title').textContent = title;
  $('#toast-sub').textContent = sub || '';
  $('#toast-icon').setAttribute('href', '#' + (opts.icon || 'i-download'));
  var act = $('#toast-act');
  act.innerHTML = opts.action && opts.action.href
    ? '<a class="btn btn-solid btn-sm t-act" href="' + esc(opts.action.href) + '" rel="noreferrer"><svg class="ic"><use href="#i-download"/></svg>' + esc(opts.action.text) + '</a>' : '';
  t.className = 'toast show' + (opts.warn ? ' warn' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.className = t.className.replace(' show', ''); }, opts.ms || 4200);
}

/* =========================================================
   Announcement, nav, menu
   ========================================================= */
function initAnnouncement() {
  var bar = $('#announce'); var x = $('#ann-close'); if (!bar || !x) return;
  var key = 'axiom_ann_' + (bar.getAttribute('data-id') || 'a');
  if (store(key) === 'closed') { bar.classList.add('gone'); bar.style.display = 'none'; return; }
  x.addEventListener('click', function () { bar.classList.add('gone'); store('axiom_ann_' + (bar.getAttribute('data-id') || 'a'), 'closed'); });
}

function initNav() {
  var nav = $('#nav');
  function onScroll() { if (nav) nav.classList.toggle('scrolled', window.pageYOffset > 10); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var links = $$('.navlinks a[data-sec]'); var mlinks = $$('#menu a');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-sec') === id); });
        mlinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['downloads', 'install', 'faq', 'discord'].forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  var btn = $('#menu-btn'); var menu = $('#menu');
  if (!btn || !menu) return;
  function set(open) {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
  }
  btn.addEventListener('click', function () { set(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
}

/* FAQ: one open at a time, measured height so every browser animates it */
function initFaq() {
  var items = $$('.qa');
  items.forEach(function (qa) {
    var q = $('.qa-q', qa); var a = $('.qa-a', qa);
    q.addEventListener('click', function () {
      var opening = !qa.classList.contains('open');
      items.forEach(function (o) { if (o.classList.contains('open')) { o.classList.remove('open'); $('.qa-q', o).setAttribute('aria-expanded', 'false'); $('.qa-a', o).style.height = '0px'; } });
      if (opening) { qa.classList.add('open'); q.setAttribute('aria-expanded', 'true'); a.style.height = a.scrollHeight + 'px'; }
    });
  });
  window.addEventListener('resize', function () { var o = $('.qa.open .qa-a'); if (o) o.style.height = o.scrollHeight + 'px'; });
}

function initProgress() {
  var bar = $('#progress'); var top = $('#totop'); var ring = $('#totop-ring');
  var C = 2 * Math.PI * 25;
  if (ring) { ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C; }
  var ticking = false;
  function update() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.pageYOffset / max) : 0;
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    if (ring) ring.style.strokeDashoffset = C * (1 - p);
    if (top) top.classList.toggle('show', window.pageYOffset > window.innerHeight * 0.8);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
  update();
}

/* Scroll reveals with a stagger */
var revealIO = null;
function initReveal() {
  if (!('IntersectionObserver' in window)) { revealNow(); return; }
  revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  observeReveals();
}
function observeReveals() {
  $$('.reveal:not(.in)').forEach(function (el, i) {
    if (!el.style.getPropertyValue('--rd')) {
      var sibs = el.parentNode ? $$('.reveal', el.parentNode) : [];
      el.style.setProperty('--rd', (Math.min(sibs.indexOf(el), 6) * 0.06) + 's');
    }
    if (revealIO) revealIO.observe(el); else el.classList.add('in');
  });
}
function revealNow() { if (revealIO) observeReveals(); else $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }

/* Easter egg: five clicks on the logo */
function initEgg() {
  var gem = $('#brand-gem'); if (!gem) return;
  var clicks = 0, timer;
  gem.parentNode.addEventListener('click', function (e) {
    clicks++; clearTimeout(timer); timer = setTimeout(function () { clicks = 0; }, 1400);
    if (!reduceMotion) { gem.classList.remove('wiggle'); void gem.offsetWidth; gem.classList.add('wiggle'); }
    if (clicks < 5) return;
    e.preventDefault(); clicks = 0;
    var r = gem.getBoundingClientRect();
    if (!reduceMotion) burst(r.left + r.width / 2, r.top + r.height / 2);
    toast('You found the secret', 'Made by k35c', { icon: 'i-spark' });
  });
}
function burst(cx, cy) {
  for (var i = 0; i < 28; i++) {
    var g = document.createElement('span'); g.className = 'gem-burst';
    g.innerHTML = '<svg viewBox="0 0 64 64"><use href="#logo"/></svg>';
    var ang = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 280, s = 10 + Math.random() * 14;
    g.style.left = (cx - s / 2) + 'px'; g.style.top = (cy - s / 2) + 'px'; g.style.width = g.style.height = s + 'px';
    g.style.setProperty('--dx', Math.cos(ang) * dist + 'px'); g.style.setProperty('--dy', Math.sin(ang) * dist + 160 + 'px');
    g.style.setProperty('--rot', (Math.random() - 0.5) * 720 + 'deg');
    document.body.appendChild(g);
    (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1400); })(g);
  }
}

/* =========================================================
   The starlight headliner
   Hundreds of fibre-optic pinpoints that pop and fade on
   their own rhythm, glints on the brightest ones, shooting
   stars every few seconds, motes drifting up, and stars that
   light up around your cursor. Click the sky to send a
   shooting star across it.
   ========================================================= */
function initSky() {
  var canvas = $('#sky'); if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0, stars = [], motes = [], shooters = [];
  var mouse = { x: -9999, y: -9999 };
  var nextShot = 0, last = 0, running = false;

  function sprite(r, g, b) {
    var c = document.createElement('canvas'); var S = 64; c.width = c.height = S;
    var x = c.getContext('2d'); var gr = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.1, 'rgba(' + r + ',' + g + ',' + b + ',.95)');
    gr.addColorStop(0.28, 'rgba(' + r + ',' + g + ',' + b + ',.35)');
    gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, S, S); return c;
  }
  var TINTS = [
    { c: '255,255,255', s: sprite(255, 255, 255), p: 0.7 },
    { c: '200,255,226', s: sprite(170, 255, 210), p: 0.14 },
    { c: '214,232,255', s: sprite(190, 220, 255), p: 0.1 },
    { c: '255,244,214', s: sprite(255, 236, 190), p: 0.06 }
  ];
  function tint() { var r = Math.random(), a = 0; for (var i = 0; i < TINTS.length; i++) { a += TINTS[i].p; if (r < a) return TINTS[i]; } return TINTS[0]; }

  function build() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.min(950, Math.round((w * h) / 1500));
    stars = [];
    for (var i = 0; i < count; i++) {
      var roll = Math.random();
      var kind = roll < 0.08 ? 2 : roll < 0.32 ? 1 : 0;           // 0 tiny, 1 glowing, 2 big with glints
      var t = tint();
      stars.push({
        x: Math.random() * w,
        y: Math.pow(Math.random(), 1.45) * h,                      // denser toward the top, like a headliner
        r: kind === 2 ? 1.3 + Math.random() * 1.1 : kind === 1 ? 0.8 + Math.random() * 0.6 : 0.35 + Math.random() * 0.5,
        kind: kind, tint: t,
        peak: kind === 0 ? 0.5 + Math.random() * 0.5 : 0.85 + Math.random() * 0.15,
        speed: (0.6 + Math.random() * 2.6) / 1000,                  // a full twinkle every ~2–10 s
        phase: Math.random() * Math.PI * 2,
        drift: (kind === 0 ? 2 : kind === 1 ? 4 : 6) * (0.6 + Math.random() * 0.8),
        depth: kind === 0 ? 0.02 : kind === 1 ? 0.05 : 0.08,
        boost: 0
      });
    }
    motes = [];
    for (var j = 0; j < Math.round(w / 55); j++) motes.push(newMote(true));
  }
  function newMote(anywhere) {
    return { x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10, r: 0.8 + Math.random() * 1.6,
      vy: 6 + Math.random() * 16, sway: Math.random() * Math.PI * 2, a: 0.08 + Math.random() * 0.22 };
  }
  function shoot(x, y, angle) {
    var ang = angle != null ? angle : (Math.PI / 180) * (14 + Math.random() * 22);
    var sp = 900 + Math.random() * 700;
    shooters.push({ x: x != null ? x : Math.random() * w * 0.75, y: y != null ? y : Math.random() * h * 0.4,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, max: 0.75 + Math.random() * 0.5, len: 0.11 + Math.random() * 0.07 });
  }

  function twinkle(s, t) {
    // a soft rise and fall with a held glow at the top: reads as a fibre-optic shimmer, not a flicker
    var v = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
    v = v * v * (3 - 2 * v);
    return 0.12 + 0.88 * v;
  }

  function frame(t) {
    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
    ctx.clearRect(0, 0, w, h);
    var sy = window.pageYOffset || 0;
    ctx.globalCompositeOperation = 'lighter';

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (!reduceMotion) { s.x += s.drift * dt; if (s.x > w + 4) s.x = -4; }
      var y = s.y - (reduceMotion ? 0 : sy * s.depth);
      y = ((y % h) + h) % h;
      var a = s.peak * twinkle(s, reduceMotion ? t * 0.35 : t);
      // stars near the cursor light up
      var dx = s.x - mouse.x, dy = y - mouse.y, d2 = dx * dx + dy * dy;
      var near = d2 < 22500 ? 1 - Math.sqrt(d2) / 150 : 0;
      s.boost += (near - s.boost) * 0.12;
      a = Math.min(1, a + s.boost * 0.9);
      var r = s.r * (1 + s.boost * 0.9);

      if (s.kind > 0 || s.boost > 0.05) {
        var size = r * (s.kind === 2 ? 15 : 11);
        ctx.globalAlpha = a * (s.kind === 2 ? 0.95 : 0.7);
        ctx.drawImage(s.tint.s, s.x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgb(' + s.tint.c + ')';
      ctx.beginPath(); ctx.arc(s.x, y, r, 0, 6.2832); ctx.fill();

      // four-point glints on the brightest stars when they peak
      if ((s.kind === 2 && a > 0.72) || s.boost > 0.4) {
        var L = r * (5 + 8 * Math.max(a - 0.6, s.boost));
        ctx.globalAlpha = Math.min(1, (a - 0.55) * 1.6 + s.boost * 0.6);
        ctx.strokeStyle = 'rgb(' + s.tint.c + ')'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(s.x - L, y); ctx.lineTo(s.x + L, y); ctx.moveTo(s.x, y - L); ctx.lineTo(s.x, y + L); ctx.stroke();
      }
    }

    if (!reduceMotion) {
      // motes drifting up through the green glow
      for (var m = 0; m < motes.length; m++) {
        var o = motes[m];
        o.y -= o.vy * dt; o.sway += dt;
        var ox = o.x + Math.sin(o.sway) * 10;
        if (o.y < -10) motes[m] = newMote(false);
        var fade = Math.min(1, (h - o.y) / 200) * Math.min(1, o.y / 200);
        ctx.globalAlpha = o.a * Math.max(0, fade);
        ctx.fillStyle = 'rgb(143,240,180)';
        ctx.beginPath(); ctx.arc(ox, o.y, o.r, 0, 6.2832); ctx.fill();
      }
      // shooting stars every few seconds
      if (t > nextShot) { shoot(); if (Math.random() < 0.25) shoot(); nextShot = t + 2500 + Math.random() * 4000; }
      for (var k = shooters.length - 1; k >= 0; k--) {
        var sh = shooters[k];
        sh.life += dt; if (sh.life > sh.max) { shooters.splice(k, 1); continue; }
        sh.x += sh.vx * dt; sh.y += sh.vy * dt;
        var p = sh.life / sh.max; var f = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
        var tx = sh.x - sh.vx * sh.len, ty = sh.y - sh.vy * sh.len;
        var g = ctx.createLinearGradient(tx, ty, sh.x, sh.y);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(200,255,226,' + (0.5 * f) + ')'); g.addColorStop(1, 'rgba(255,255,255,' + f + ')');
        ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(sh.x, sh.y); ctx.stroke();
        ctx.globalAlpha = f; ctx.drawImage(TINTS[0].s, sh.x - 9, sh.y - 9, 18, 18);
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (running) requestAnimationFrame(frame);
  }

  function start() { if (running) return; running = true; last = 0; nextShot = (window.performance ? performance.now() : 0) + 1200; requestAnimationFrame(frame); }
  function stop() { running = false; }

  window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });
  // click empty sky to launch a shooting star from where you clicked
  document.addEventListener('click', function (e) {
    if (reduceMotion) return;
    if (e.target.closest && e.target.closest('a,button,input,textarea,select,summary,label,.card,.notice,.qa,.join,.tabbar,.launch,.modal,.step,.folder')) return;
    shoot(e.clientX, e.clientY, (Math.PI / 180) * (20 + Math.random() * 20));
  });
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 150); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  build(); start();
}

/* =========================================================
   YouTube, launcher, staff online, ticket mod list
   ========================================================= */
function renderExtras(d) {
  var links = d.links || {};
  var yt = safeUrl(links.youtube);
  $$('.js-youtube').forEach(function (a) { if (yt) { a.href = yt; a.hidden = false; } else a.hidden = true; });

  var launcher = safeUrl(links.launcher) || 'https://modrinth.com/app';
  var ll = $('#launch-link'); if (ll) ll.href = launcher;

  // the little launcher window lists the real mods
  var wm = $('#win-mods');
  if (wm) {
    var names = ['Fabric API'].concat(liveMods(d).slice(0, 4).map(function (m) { return m.name; }));
    wm.innerHTML = names.map(function (n, i) { return '<li style="--i:' + i + '"><span>' + esc(n) + '</span><em></em></li>'; }).join('');
  }

  // staff online
  var sup = d.support || {};
  var staff = (sup.staff || []).filter(function (p) { return p && p.name; });
  var on = staff.filter(function (p) { return p.online; });
  var box = $('#staff');
  if (box) {
    box.className = 'staff' + (on.length ? ' is-on' : ' is-off');
    $('#staff-title').textContent = on.length
      ? on.length + ' staff online that can help'
      : 'No staff online right now';
    $('#staff-sub').textContent = on.length
      ? 'Stuck? Make a ticket and a staff member will DM you on Discord.'
      : 'Make a ticket anyway. We\'ll DM you on Discord as soon as someone\'s back.';
    var sorted = on.concat(staff.filter(function (p) { return !p.online; }));
    $('#staff-list').innerHTML = sorted.map(function (p) {
      var initial = esc(String(p.name).trim().charAt(0).toUpperCase());
      return '<li class="' + (p.online ? 'on' : 'off') + '"><span class="av">' + initial + '<i></i></span><span class="nm"><b>' + esc(p.name) + '</b>' +
        (p.role ? '<small>' + esc(p.role) + '</small>' : '') + '</span><span class="st">' + (p.online ? 'Online' : 'Offline') + '</span></li>';
    }).join('');
    $('#staff-list').style.display = sorted.length ? '' : 'none';
  }

  // tickets switched off in the admin panel: send people to Discord instead
  ticketsOn = sup.ticketsOn !== false && !!safeUrl(sup.webhook);
  document.documentElement.classList.toggle('no-tickets', !ticketsOn);

  var sel = $('#tk-mod');
  if (sel) {
    var cur = sel.value;
    sel.innerHTML = '<option value="">Not about one mod</option>' + liveMods(d).map(function (m) { return '<option>' + esc(m.name) + '</option>'; }).join('');
    sel.value = cur;
  }
}

/* =========================================================
   Modals (shared)
   ========================================================= */
var openModalEl = null, lastFocus = null;
function openModal(el, focusSel) {
  if (!el) return;
  lastFocus = document.activeElement;
  openModalEl = el;
  el.classList.add('open');
  document.documentElement.classList.add('modal-open');
  setTimeout(function () { var f = focusSel ? $(focusSel, el) : null; if (f) try { f.focus(); } catch (e) {} }, 60);
}
function closeModal(el) {
  el = el || openModalEl; if (!el) return;
  el.classList.remove('open');
  document.documentElement.classList.remove('modal-open');
  openModalEl = null;
  if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
}
document.addEventListener('keydown', function (e) {
  if (!openModalEl) return;
  if ((e.key === 'Escape' || e.key === 'Esc') && openModalEl.id !== 'terms-modal') closeModal();
  if (e.key === 'Tab') { // keep focus inside the box
    var f = $$('a[href],button:not([disabled]),input:not([type=hidden]):not([tabindex="-1"]),select,textarea,[tabindex="0"]', openModalEl)
      .filter(function (x) { return x.offsetWidth || x.offsetHeight; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* =========================================================
   Terms: everyone agrees once before downloading
   ========================================================= */
var TERMS_KEY = 'axiom_terms_v1';
var termsMem = false, pendingDownload = null;
function termsAgreed() { return termsMem || store(TERMS_KEY) === 'yes'; }
function openTerms(href) {
  pendingDownload = href || null;
  openModal($('#terms-modal'), '#tm-check');
}
function initTerms() {
  var m = $('#terms-modal'); if (!m) return;
  var check = $('#tm-check'), btn = $('#tm-agree');
  check.addEventListener('change', function () { btn.disabled = !check.checked; m.classList.toggle('ticked', check.checked); });
  btn.addEventListener('click', function () {
    if (!check.checked) return;
    termsMem = true; store(TERMS_KEY, 'yes');
    closeModal(m);
    var go = pendingDownload; pendingDownload = null;
    if (go) { toast('Thanks, you\'re all set', 'Your download is starting.'); setTimeout(function () { location.href = go; }, 350); }
    else toast('Thanks, you\'re all set', 'Enjoy the mods. Adblocker on!', { icon: 'i-check' });
  });
  if (!termsAgreed() && !/^#mod\//.test(location.hash)) setTimeout(function () { if (!termsAgreed() && !openModalEl) openTerms(); }, 900);
  // the requirement toast's button is a download too
  var act = $('#toast-act');
  if (act) act.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (a && !termsAgreed()) { e.preventDefault(); openTerms(a.href); }
  });
}

/* =========================================================
   Tickets → Discord webhook
   ========================================================= */
var ticketsOn = true;
var TK = { cooldownMin: 10, perDay: 3, minChars: 20, maxImg: 8 * 1024 * 1024 };
function tkLog() { try { return JSON.parse(store('axiom_tk') || '[]').filter(function (t) { return Date.now() - t < 864e5; }); } catch (e) { return []; } }
var tkMem = [];
function tkHistory() { var a = tkLog(); return a.length >= tkMem.length ? a : tkMem; }
function tkWait() {
  var h = tkHistory(); if (!h.length) return 0;
  if (h.length >= TK.perDay) return Math.max(0, h[0] + 864e5 - Date.now());
  return Math.max(0, h[h.length - 1] + TK.cooldownMin * 6e4 - Date.now());
}
function mins(ms) { var m = Math.ceil(ms / 6e4); return m >= 60 ? Math.ceil(m / 60) + ' hour' + (Math.ceil(m / 60) > 1 ? 's' : '') : m + ' minute' + (m > 1 ? 's' : ''); }
function noPing(s) { return String(s).replace(/@(everyone|here)/gi, '@​$1').replace(/<@[!&]?\d+>/g, '[mention]'); }

function initTicket() {
  var m = $('#ticket-modal'); if (!m) return;
  var form = $('#tk-form'), done = $('#tk-done');
  var user = $('#tk-user'), issue = $('#tk-issue'), err = $('#tk-err'), send = $('#tk-send');
  var drop = $('#tk-drop'), file = $('#tk-file'), prev = $('#tk-prev'), dropIn = $('#tk-drop-in');
  var image = null, openedAt = 0, topic = 'Download problem', sending = false, lastText = store('axiom_tk_last') || '';

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-ticket]') : null;
    if (t) {
      e.preventDefault();
      if (!ticketsOn) { var dc = $('.js-discord'); if (dc) window.open(dc.href, '_blank'); return; }
      var menu = $('#menu'); if (menu && menu.classList.contains('open')) { var mb = $('#menu-btn'); if (mb) mb.click(); }
      form.hidden = false; done.hidden = true; openedAt = Date.now(); showErr('');
      var w = tkWait(); if (w) showErr('You\'ve sent a ticket recently. You can send another in ' + mins(w) + '. Need it faster? Ask in the Discord.');
      openModal(m, '#tk-user');
      return;
    }
    if (openModalEl === m && e.target.closest && e.target.closest('[data-close]')) closeModal(m);
  });

  $$('#tk-topics button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('#tk-topics button').forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
      topic = b.getAttribute('data-v');
    });
  });

  issue.addEventListener('input', function () {
    var n = issue.value.length; $('#tk-count').textContent = n + ' / 1500';
    $('#tk-count').className = 'tk-count' + (n > 1400 ? ' hot' : '');
    var left = TK.minChars - issue.value.trim().length;
    $('#tk-issue-hint').textContent = left > 0 ? left + ' more character' + (left > 1 ? 's' : '') + ' needed.' : 'Looks good.';
    issue.parentNode.classList.toggle('ok', left <= 0);
  });
  user.addEventListener('input', function () {
    user.value = user.value.replace(/^@+/, '').replace(/\s+/g, '');
    user.closest('.tk-field').classList.toggle('ok', validUser(user.value));
  });

  function validUser(v) { return /^[a-z0-9_.]{2,32}$/i.test(v) || /^.{2,32}#\d{4}$/.test(v); }

  // screenshot: paste, drop or pick
  function take(f) {
    if (!f) return;
    if (!/^image\/(png|jpe?g|gif|webp)$/i.test(f.type)) { showErr('That file isn\'t a picture. Use PNG, JPG, GIF or WebP.'); return; }
    if (f.size > TK.maxImg) { showErr('That picture is over 8 MB. Try a smaller screenshot.'); return; }
    image = f; showErr('');
    var url = (window.URL || window.webkitURL).createObjectURL(f);
    $('#tk-img').src = url;
    $('#tk-img-name').textContent = f.name && f.name !== 'image.png' ? f.name : 'Pasted screenshot';
    $('#tk-img-size').textContent = (f.size / 1024 > 1024 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB');
    prev.hidden = false; dropIn.hidden = true; drop.classList.add('has');
  }
  function clearImg() { image = null; prev.hidden = true; dropIn.hidden = false; drop.classList.remove('has'); file.value = ''; }
  drop.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#tk-rm')) return; if (!image) file.click(); });
  drop.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !image) { e.preventDefault(); file.click(); } });
  $('#tk-rm').addEventListener('click', function (e) { e.stopPropagation(); clearImg(); });
  file.addEventListener('change', function () { take(file.files && file.files[0]); });
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; take(f); });
  document.addEventListener('paste', function (e) {
    if (openModalEl !== m || form.hidden) return;
    var items = (e.clipboardData && e.clipboardData.items) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && /^image\//.test(items[i].type)) {
        e.preventDefault(); take(items[i].getAsFile());
        drop.classList.remove('pop'); void drop.offsetWidth; drop.classList.add('pop');
        return;
      }
    }
  });

  function showErr(t) { err.textContent = t; err.className = 'tk-err' + (t ? ' show' : ''); }
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); try { el.focus(); } catch (e) {} }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    var name = user.value.trim().replace(/^@+/, ''), text = issue.value.trim();
    if ($('#tk-web').value) return;                                   // bots fill the hidden box
    if (!validUser(name)) { showErr('Type your Discord username, like "steve_123" (letters, numbers, _ and .).'); shake(user.closest('.tk-at')); return; }
    if (text.length < TK.minChars) { showErr('Tell us a little more about the issue (at least ' + TK.minChars + ' characters).'); shake(issue); return; }
    if (Date.now() - openedAt < 4000) { showErr('Give it a second and press Send again.'); return; }
    var w = tkWait(); if (w) { showErr('You\'ve sent a ticket recently. You can send another in ' + mins(w) + '.'); return; }
    if (text === lastText) { showErr('You already sent this exact ticket. We\'ve got it, hang tight.'); return; }
    var hook = safeUrl(DATA && DATA.support && DATA.support.webhook);
    if (!/^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(hook)) { showErr('Tickets aren\'t set up right now. Please ask in the Discord.'); return; }

    var num = 'AX-' + String(Math.floor(1000 + Math.random() * 9000));
    var mod = $('#tk-mod').value;
    var embed = {
      title: '🎫 New ticket · ' + num,
      color: 0x22c55e,
      fields: [
        { name: 'Discord username', value: '`' + name.replace(/`/g, '') + '`', inline: true },
        { name: 'Topic', value: topic, inline: true },
        { name: 'Mod', value: mod || '—', inline: true },
        { name: 'Issue', value: noPing(text).slice(0, 1024) }
      ],
      footer: { text: 'Sent from the Axiom Mods website' },
      timestamp: new Date().toISOString()
    };
    if (image) embed.image = { url: 'attachment://' + (image.type === 'image/png' ? 'screenshot.png' : image.type === 'image/gif' ? 'screenshot.gif' : image.type === 'image/webp' ? 'screenshot.webp' : 'screenshot.jpg') };
    var payload = {
      username: 'Axiom Tickets',
      content: '**New ticket ' + num + '** — add **' + name.replace(/[*_`~|]/g, '\\$&') + '** on Discord',
      embeds: [embed],
      allowed_mentions: { parse: [] }
    };
    var body = new FormData();
    body.append('payload_json', JSON.stringify(payload));
    if (image) body.append('files[0]', image, embed.image.url.replace('attachment://', ''));

    sending = true; send.classList.add('busy'); send.disabled = true; $('#tk-send-txt').textContent = 'Sending…'; showErr('');
    fetch(hook, { method: 'POST', body: body }).then(function (r) {
      if (r.status === 429) throw { busy: true };
      if (!r.ok) throw { status: r.status };
      var h = tkHistory().concat(Date.now()); tkMem = h; store('axiom_tk', JSON.stringify(h));
      lastText = text; store('axiom_tk_last', text);
      $('#tk-num').textContent = '#' + num; $('#tk-who').textContent = '@' + name;
      form.hidden = true; done.hidden = false;
      form.reset(); clearImg(); issue.dispatchEvent(new Event('input'));
      $$('.tk-field.ok', form).forEach(function (f) { f.classList.remove('ok'); });
    }).catch(function (x) {
      showErr(x && x.busy ? 'Lots of tickets right now. Wait a minute and try again.'
        : 'Couldn\'t send your ticket. Check your connection, or make a ticket in the Discord instead.');
    }).then(function () { sending = false; send.classList.remove('busy'); send.disabled = false; $('#tk-send-txt').textContent = 'Send ticket'; });
  });
}

})();
