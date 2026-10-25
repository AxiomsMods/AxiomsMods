/* ==========================================================================
   Axiom Mods — script.js
   Renders the page from site-data.json (fetched with cache:'no-store').
   If the fetch fails, the static copy already in index.html stays in place and
   is wired up exactly the same way. Everything else (starfield, scroll
   progress, reveal-on-scroll) runs either way.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Icons (24x24, stroke) ---------- */
  var ICONS = {
    spawner: '<rect x="4" y="4" width="16" height="16" rx="2.2"/><path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/><rect x="10.3" y="10.3" width="3.4" height="3.4" rx=".6" fill="currentColor"/>',
    meteor: '<circle cx="15.5" cy="8.5" r="4.5"/><path d="M12.3 11.7 4 20M9.6 8.2 6 12M15.8 13.4 12.4 16.8"/>',
    glazed: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="m6.6 8.2 1.5 1M16 6.4l-1 1.7M18 13.6l-1.7-.4M8.2 17l1.3-1.3"/>',
    rig: '<path d="M12 3 6 21M12 3l6 18M8.4 14.5h7.2M10.2 9h3.6M4 21h16"/>',
    tpa: '<path d="M4 12h11m-4-4 4 4-4 4"/><path d="M20 5v14"/>',
    sword: '<path d="M14.5 3.5h6v6L10 20l-6-6z"/><path d="m4 20 2.2-2.2M7.6 13.4l3 3"/>',
    pickaxe: '<path d="M4.5 9C8 5 13.5 3.5 19 4.5c-1 1-2.5 1.5-4 2"/><path d="M15 6.5 5 20.5M15 6.5c1 1.5 1.5 3 1.5 4.5"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    bolt: '<path d="M13 2.5 4.5 13.5H12L11 21.5l8.5-11H12l1-8Z"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6L12 3Z"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    chest: '<rect x="3.5" y="8" width="17" height="11" rx="1.8"/><path d="M3.5 12.5h17M12 11v4M5 8V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v1"/>',
    radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.6"/><path d="M12 12 18.4 5.6"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2"/>'
  };
  var UI = {
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
    shield: ICONS.shield, utility: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>',
    bolt: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>', box: ICONS.box,
    download: '<path d="M12 3.5v11m0 0-4.5-4.5M12 14.5l4.5-4.5M4.5 19.5h15"/>',
    code: '<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.4 4.5l-2.8 15"/>',
    alert: '<path d="M12 3.6 2.4 20h19.2L12 3.6Z"/><path d="M12 10v4.6M12 17.6h.01"/>',
    clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3 1.9"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  var CAT_ICON = { clients: 'shield', utility: 'utility', macros: 'bolt' };
  var NUM = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

  function svg(inner, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + inner + '</svg>';
  }
  function modIcon(name) { return svg(ICONS[name] || ICONS.box); }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeColor(c) { return /^#[0-9a-f]{6}$/i.test(c || '') ? c : '#23c55e'; }
  function safeUrl(u) {
    u = String(u || '').trim();
    return /^https?:\/\//i.test(u) ? u : '';
  }
  function isExternal(u) {
    try { return new URL(u, location.href).origin !== location.origin; } catch (e) { return false; }
  }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

  /* ---------- Rendering ---------- */
  function cardHTML(m, i) {
    var id = slug(m.id || m.name) || 'mod-' + i;
    var url = safeUrl(m.url);
    var cls = 'card' + (m.featured ? ' featured' : '') + (m.updating ? ' updating' : '');
    var badges = (m.badges || []).filter(Boolean).map(function (b) { return '<span class="badge">' + esc(b) + '</span>'; }).join('');
    var button;
    if (m.updating) {
      button = '<button class="btn dl" type="button" aria-disabled="true">' + svg(UI.clock, 'spin') + '<span>Updating — back soon</span></button>';
    } else if (url) {
      button = '<a class="btn btn-primary dl" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + svg(UI.download) + '<span>Download</span></a>' +
        (isExternal(url) ? '<p class="hint">Adblocker on — ignore any other button on that page</p>' : '');
    } else {
      button = '<button class="btn dl" type="button" aria-disabled="true">' + svg(UI.clock) + '<span>Link coming soon</span></button>';
    }
    return '<article class="' + cls + '" id="' + esc(id) + '" data-cat="' + esc(m.category || 'Other') + '" style="--a:' + safeColor(m.accent) + '">' +
      '<div class="card-top"><div class="tile">' + modIcon(m.icon) + '</div><span class="pill">' + esc(m.mc || '1.21.11') + '</span></div>' +
      '<div class="name-row"><h3>' + esc(m.name) + '</h3>' + badges + '</div>' +
      '<div class="desc-wrap"><p class="desc">' + esc(m.description) + '</p><button class="more" type="button" aria-expanded="false">More</button></div>' +
      (m.openSource ? '<span class="oss">' + svg(UI.code) + 'Open source</span>' : '') +
      (m.note ? '<div class="reqs" role="note">' + svg(UI.alert) + '<span>' + esc(m.note) + '</span></div>' : '') +
      '<div class="card-foot">' + button + '</div></article>';
  }

  function tabHTML(cat, label, count, icon, pressed) {
    return '<button class="tab" type="button" data-cat="' + esc(cat) + '" aria-pressed="' + pressed + '">' + svg(icon) +
      '<span class="lbl">' + esc(label) + '</span><span class="n">' + count + '</span></button>';
  }

  function render(data) {
    var mods = Array.isArray(data.mods) ? data.mods : [];

    // hero
    var versions = {};
    mods.forEach(function (m) { versions[m.mc || '1.21.11'] = 1; });
    var nv = Object.keys(versions).length || 1;
    var h1 = $('#hero-title');
    if (h1) {
      h1.innerHTML = '<span class="w">' + (NUM[mods.length] || mods.length) + ' mod' + (mods.length === 1 ? '' : 's') + '.</span> ' +
        '<span class="w">' + (NUM[nv] || nv) + ' version' + (nv === 1 ? '' : 's') + '.</span> <em class="w">Nothing else.</em>';
    }
    var hv = $('#hero-ver');
    if (hv) hv.textContent = 'Fabric ' + Object.keys(versions).join(' · ');
    var hl = $('#hero-live');
    if (hl) hl.textContent = mods.length + (mods.length === 1 ? ' mod' : ' mods') + ' available';

    // categories, in order of first appearance
    var cats = [];
    mods.forEach(function (m) { var c = m.category || 'Other'; if (cats.indexOf(c) === -1) cats.push(c); });
    var tabs = tabHTML('all', 'Everything', mods.length, UI.grid, 'true') + cats.map(function (c) {
      var n = mods.filter(function (m) { return (m.category || 'Other') === c; }).length;
      return tabHTML(c, c, n, UI[CAT_ICON[c.toLowerCase()]] || UI.box, 'false');
    }).join('');
    ['#rail-tabs', '#inline-tabs'].forEach(function (s) { var el = $(s); if (el) el.innerHTML = tabs; });

    // grid
    var grid = $('#grid');
    if (grid) grid.innerHTML = mods.length ? mods.map(cardHTML).join('') : '<p class="empty">No downloads yet — check back soon.</p>';

    // announcement
    var a = data.announcement, bar = $('#announce');
    if (bar) {
      var dismissed = false;
      try { dismissed = a && localStorage.getItem('axiom-dismiss-' + a.id) === '1'; } catch (e) {}
      if (a && a.enabled && a.text && !dismissed) {
        bar.hidden = false;
        bar.dataset.id = a.id || '';
        $('.tag', bar).textContent = a.tag || 'News';
        $('.tag', bar).hidden = !a.tag;
        $('p', bar).textContent = a.text;
        var go = $('.go', bar);
        if (a.link && a.linkText) { go.hidden = false; go.href = a.link; $('span', go).textContent = a.linkText; }
        else go.hidden = true;
      } else bar.hidden = true;
    }

    // discord
    var dc = data.links && /^https?:\/\//i.test(data.links.discord || '') ? data.links.discord : null;
    if (dc) $$('[data-discord]').forEach(function (el) { el.href = dc; });

    if (window.AxiomTheme && data.theme) window.AxiomTheme.apply(data.theme);
  }

  /* ---------- Behaviour (works on rendered or static DOM) ---------- */
  var currentCat = 'all';

  function applyFilter(cat) {
    currentCat = cat;
    $$('.tab').forEach(function (t) { t.setAttribute('aria-pressed', t.dataset.cat === cat ? 'true' : 'false'); });
    var shown = 0;
    $$('#grid .card').forEach(function (c) {
      var match = cat === 'all' || c.dataset.cat === cat;
      c.classList.toggle('is-hidden', !match);
      c.classList.remove('enter');
      if (match) {
        c.style.setProperty('--i', shown++);
        void c.offsetWidth;
        if (!reduceQuery.matches) c.classList.add('enter');
      }
    });
    measureClamp();
  }

  function wireTabs() {
    $$('.tabs').forEach(function (nav) {
      nav.addEventListener('click', function (e) {
        var b = e.target.closest('.tab');
        if (b) applyFilter(b.dataset.cat);
      });
    });
    applyFilter('all');
  }

  function measureClamp() {
    $$('#grid .card').forEach(function (c) {
      if (c.classList.contains('open') || c.classList.contains('is-hidden')) return;
      var d = $('.desc', c);
      if (d) c.classList.toggle('clamped', d.scrollHeight > d.clientHeight + 1);
    });
  }

  function wireCards() {
    var grid = $('#grid');
    if (!grid) return;
    grid.addEventListener('click', function (e) {
      var more = e.target.closest('.more');
      if (!more) return;
      var card = more.closest('.card');
      var open = card.classList.toggle('open');
      more.textContent = open ? 'Less' : 'More';
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) card.classList.add('clamped');
    });
    grid.addEventListener('pointermove', function (e) {
      var card = e.target.closest('.card');
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(measureClamp, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureClamp);
    measureClamp();
  }

  function wireAnnounce() {
    var bar = $('#announce');
    if (!bar) return;
    $('.x', bar).addEventListener('click', function () {
      bar.hidden = true;
      try { localStorage.setItem('axiom-dismiss-' + (bar.dataset.id || ''), '1'); } catch (e) {}
    });
  }

  function wireProgress() {
    var p = $('#progress i');
    if (!p) return;
    var ticking = false;
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      p.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function wireReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Starfield ---------- */
  function starfield() {
    var canvas = $('#stars');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, stars = [], raf = 0, running = false;

    // pre-rendered soft glow, so hundreds of stars stay cheap
    var sprite = document.createElement('canvas');
    sprite.width = sprite.height = 96;
    (function () {
      var g = sprite.getContext('2d');
      var gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.1, 'rgba(240,255,247,.85)');
      gr.addColorStop(0.28, 'rgba(190,255,220,.32)');
      gr.addColorStop(0.6, 'rgba(120,255,175,.07)');
      gr.addColorStop(1, 'rgba(120,255,175,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 96, 96);
    })();

    function seed() {
      var n = Math.max(160, Math.min(950, Math.round((W * H) / 2300)));
      stars = [];
      for (var i = 0; i < n; i++) {
        var big = Math.random() < 0.035;
        var y = Math.pow(Math.random(), 1.85) * H;        // denser toward the top
        stars.push({
          x: Math.random() * W,
          y: y,
          r: big ? 1.1 + Math.random() * 0.8 : 0.35 + Math.pow(Math.random(), 2.4) * 0.85,
          glow: big ? 15 + Math.random() * 12 : 5 + Math.random() * 7,
          period: 3 + Math.random() * 7.5,                  // seconds, per star
          phase: Math.random() * Math.PI * 2,               // so none are in sync
          min: 0.1 + Math.random() * 0.22,
          top: 1 - 0.3 * (y / H)
        });
      }
    }

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function draw(t, still) {
      ctx.clearRect(0, 0, W, H);
      var sec = t / 1000;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var k = still ? 0.72 : 0.5 + 0.5 * Math.sin(sec * 6.2832 / s.period + s.phase);
        k = k * k * (3 - 2 * k);                            // smoothstep: eases up and down
        var a = (s.min + (1 - s.min) * k) * s.top;
        var gs = s.glow * (0.65 + 0.55 * k);
        ctx.globalAlpha = Math.min(1, a * 0.95);
        ctx.drawImage(sprite, s.x - gs, s.y - gs, gs * 2, gs * 2);
        ctx.globalAlpha = Math.min(1, 0.45 + a * 0.6);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (0.85 + 0.25 * k), 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) { draw(t, false); raf = requestAnimationFrame(loop); }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(loop); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function settle() {
      if (reduceQuery.matches) { stop(); draw(0, true); }
      else if (!document.hidden) start();
    }

    size(); settle();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { size(); if (reduceQuery.matches) draw(0, true); }, 160);
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else settle(); });
    if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', settle);
  }

  /* ---------- Boot ---------- */
  function loadData() {
    return fetch('site-data.json', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function boot() {
    starfield();
    wireProgress();
    wireAnnounce();
    wireReveal();

    var hasGrid = !!$('#grid');
    loadData().then(function (data) {
      if (hasGrid) render(data);
      else {
        // pages without the grid (terms) only need links + theme
        var dc = data.links && /^https?:\/\//i.test(data.links.discord || '') ? data.links.discord : null;
        if (dc) $$('[data-discord]').forEach(function (el) { el.href = dc; });
        if (window.AxiomTheme && data.theme) window.AxiomTheme.apply(data.theme);
      }
    }).catch(function (err) {
      if (window.console && console.info) console.info('Using the built-in copy of the downloads (' + err.message + ').');
    }).then(function () {
      if (hasGrid) { wireTabs(); wireCards(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
