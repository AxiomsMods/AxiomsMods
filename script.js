/* ==========================================================================
   Axiom Mods — script.js
   Renders the page from site-data.json (fetched with cache:'no-store'). If that
   fails (e.g. opened from file://), it falls back to the copy embedded in
   index.html (#fallback-data). Everything else — starfield, sidebar, filters,
   modal, effects widget — works the same either way.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktopQuery = window.matchMedia('(min-width: 1024px)');
  var fineQuery = window.matchMedia('(pointer: fine)');

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

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
    utility: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>',
    macro: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
    download: '<path d="M12 3.5v11m0 0-4.5-4.5M12 14.5l4.5-4.5M4.5 19.5h15"/>',
    code: '<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.4 4.5l-2.8 15"/>',
    alert: '<path d="M12 3.6 2.4 20h19.2L12 3.6Z"/><path d="M12 10v4.6M12 17.6h.01"/>',
    clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3 1.9"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.2"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    list: '<path d="M4 6.5h16M4 12h16M4 17.5h10"/>',
    star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5Z"/>'
  };
  var CAT_ICON = { clients: 'shield', utility: 'utility', macros: 'macro' };
  var NUM = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

  function svg(inner, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + inner + '</svg>';
  }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeColor(c) { return /^#[0-9a-f]{6}$/i.test(c || '') ? c : '#23c55e'; }
  function safeUrl(u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? u : ''; }
  function isExternal(u) { try { return new URL(u, location.href).origin !== location.origin; } catch (e) { return false; } }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function isHot(b) { return /^(new|updated|hot|beta)$/i.test(b); }

  /* ---------- State ---------- */
  var state = { mods: [], cat: 'all', q: '' };

  /* ---------- Rendering ---------- */
  function artHTML(m) {
    var img = safeUrl(m.image);
    var badges = (m.badges || []).filter(Boolean).slice(0, 3);
    return '<div class="card-art" data-details>' +
      (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : '<div class="art">' + svg(ICONS[m.icon] || ICONS.box) + '</div>') +
      '<div class="art-badges"><span class="pill">' + esc(m.mc || '1.21.11') + '</span>' +
      badges.map(function (b) { return '<span class="pill' + (isHot(b) ? ' hot' : '') + '">' + esc(b) + '</span>'; }).join('') + '</div></div>';
  }

  function downloadButton(m) {
    var url = safeUrl(m.url);
    if (m.updating) return '<button class="btn dl" type="button" aria-disabled="true">' + svg(UI.clock, 'spin') + '<span>Updating — back soon</span></button>';
    if (url) return '<a class="btn btn-primary dl" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + svg(UI.download) + '<span>Download Now</span></a>';
    return '<button class="btn dl" type="button" aria-disabled="true">' + svg(UI.clock) + '<span>Link coming soon</span></button>';
  }

  function cardHTML(m, i) {
    var id = slug(m.id || m.name) || 'mod-' + i;
    var url = safeUrl(m.url);
    var cls = 'card' + (m.featured ? ' featured' : '') + (m.updating ? ' updating' : '');
    return '<article class="' + cls + '" id="' + esc(id) + '" data-i="' + i + '" data-cat="' + esc(m.category || 'Other') + '" style="--a:' + safeColor(m.accent) + '">' +
      artHTML(m) +
      '<div class="card-body">' +
        '<div class="meta"><span class="tagc">' + esc(m.category || 'Other') + '</span>' +
        (m.openSource ? '<span class="oss">' + svg(UI.code) + 'Open source</span>' : '') + '</div>' +
        '<h3>' + esc(m.name) + '</h3>' +
        '<p class="desc">' + esc(m.description) + '</p>' +
        (m.note ? '<div class="reqs" role="note">' + svg(UI.alert) + '<span>' + esc(m.note) + '</span></div>' : '') +
        '<div class="card-foot">' + downloadButton(m) +
        '<button class="btn" type="button" data-details aria-label="View details for ' + esc(m.name) + '"><span>View Details</span></button>' +
        (!m.updating && url && isExternal(url) ? '<p class="hint">Adblocker on — ignore any other button on that page</p>' : '') +
        '</div></div></article>';
  }

  function catButton(cat, label, count, icon, pressed) {
    return '<button class="cat" type="button" data-cat="' + esc(cat) + '" aria-pressed="' + pressed + '">' + svg(icon) +
      '<span class="lbl">' + esc(label) + '</span><span class="n">' + count + '</span></button>';
  }

  function render(data) {
    var mods = Array.isArray(data.mods) ? data.mods : [];
    state.mods = mods;

    // hero copy
    var versions = {};
    mods.forEach(function (m) { versions[m.mc || '1.21.11'] = 1; });
    var vlist = Object.keys(versions);
    var nv = vlist.length || 1;
    var h1 = $('#hero-title');
    if (h1) {
      h1.innerHTML = '<span class="w">' + (NUM[mods.length] || mods.length) + ' mod' + (mods.length === 1 ? '' : 's') + '.</span> ' +
        '<span class="w">' + (NUM[nv] || nv) + ' version' + (nv === 1 ? '' : 's') + '.</span> <em class="w">Nothing else.</em>';
    }
    var hv = $('#hero-ver'); if (hv) hv.textContent = 'Fabric ' + (vlist.join(' · ') || '1.21.11');
    var hl = $('#hero-live'); if (hl) hl.textContent = mods.length + (mods.length === 1 ? ' mod' : ' mods') + ' available';

    // categories, in order of first appearance
    var cats = [];
    mods.forEach(function (m) { var c = m.category || 'Other'; if (cats.indexOf(c) === -1) cats.push(c); });
    state.cats = cats;
    var tabs = catButton('all', 'Everything', mods.length, UI.grid, 'true') + cats.map(function (c) {
      var n = mods.filter(function (m) { return (m.category || 'Other') === c; }).length;
      return catButton(c, c, n, UI[CAT_ICON[c.toLowerCase()]] || ICONS.box, 'false');
    }).join('');
    ['#side-cats', '#pills'].forEach(function (s) {
      var el = $(s);
      if (!el) return;
      var ind = $('.ind', el);
      el.innerHTML = tabs;
      if (ind) el.insertBefore(ind, el.firstChild);
    });

    // grid
    var grid = $('#grid');
    if (grid) grid.innerHTML = mods.length ? mods.map(cardHTML).join('') : '<p class="empty"><b>No downloads yet</b>Check back soon.</p>';

    renderStats(mods, cats, vlist);

    // announcement
    var a = data.announcement, bar = $('#announce');
    if (bar) {
      var dismissed = a && lsGet('axiom-dismiss-' + a.id) === '1';
      if (a && a.enabled && a.text && !dismissed) {
        bar.hidden = false;
        bar.dataset.id = a.id || '';
        var tag = $('.tag', bar); tag.textContent = a.tag || 'News'; tag.hidden = !a.tag;
        $('p', bar).textContent = a.text;
        var go = $('.go', bar);
        if (a.link && a.linkText) { go.hidden = false; go.href = a.link; $('span', go).textContent = a.linkText; }
        else go.hidden = true;
      } else bar.hidden = true;
    }

    applyLinks(data);
    if (window.AxiomTheme && data.theme) window.AxiomTheme.apply(data.theme);
  }

  function applyLinks(data) {
    var dc = data.links && /^https?:\/\//i.test(data.links.discord || '') ? data.links.discord : null;
    if (dc) $$('[data-discord]').forEach(function (el) { el.href = dc; });
    return dc;
  }

  /* ---------- Stats + counters ---------- */
  function renderStats(mods, cats, vlist) {
    var el = $('#stats');
    if (!el) return;
    var open = mods.filter(function (m) { return m.openSource; }).length;
    var items = [
      { n: mods.length, label: mods.length === 1 ? 'Mod' : 'Mods' },
      { n: cats.length, label: cats.length === 1 ? 'Category' : 'Categories' },
      { t: vlist[0] || '1.21.11', label: 'Minecraft version' }
    ];
    if (open) items.push({ n: open, label: 'Open source' });
    items.push({ id: 'stat-discord', n: 0, label: 'Discord members', hidden: true });
    el.innerHTML = items.map(function (s) {
      return '<div class="stat"' + (s.id ? ' id="' + s.id + '"' : '') + (s.hidden ? ' hidden' : '') + '><b' + (s.t ? '' : ' class="count" data-to="' + s.n + '"') + '>' + esc(s.t != null ? s.t : '0') + '</b><span>' + esc(s.label) + '</span></div>';
    }).join('');
    watchCounters();
  }

  function fmt(n) { return Math.round(n).toLocaleString('en-GB'); }
  function animateCount(el, to) {
    if (reduceQuery.matches || to < 2) { el.textContent = fmt(to); return; }
    var t0 = null, dur = 1300;
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counterIO = null;
  function watchCounters() {
    var els = $$('.count');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.textContent = fmt(+el.dataset.to || 0); }); return; }
    if (!counterIO) {
      counterIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          counterIO.unobserve(en.target);
          en.target.dataset.done = '1';
          animateCount(en.target, +en.target.dataset.to || 0);
        });
      }, { threshold: 0.4 });
    }
    els.forEach(function (el) { if (!el.dataset.done) counterIO.observe(el); });
  }

  /* ---------- Discord widget (live counts, fails quietly) ---------- */
  function wireDiscord(link) {
    var m = /discord(?:\.gg|(?:app)?\.com\/invite)\/([\w-]+)/i.exec(link || '');
    if (!m || !window.fetch) return;
    fetch('https://discord.com/api/v10/invites/' + m[1] + '?with_counts=true', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.approximate_member_count) return;
        var counts = $('#dc-counts'); if (counts) counts.hidden = false;
        if (d.guild && d.guild.name && $('#dc-name')) $('#dc-name').textContent = d.guild.name;
        if ($('#dc-online')) animateCount($('#dc-online'), d.approximate_presence_count || 0);
        if ($('#dc-members')) animateCount($('#dc-members'), d.approximate_member_count);
        var tile = $('#stat-discord');
        if (tile) {
          tile.hidden = false;
          var b = $('b', tile); b.className = 'count'; b.dataset.to = d.approximate_member_count;
          watchCounters();
        }
      })
      .catch(function () {});
  }

  /* ---------- Filtering ---------- */
  function applyFilter() {
    var q = state.q.trim().toLowerCase();
    var shown = 0, total = state.mods.length;
    $$('#grid .card').forEach(function (c) {
      var m = state.mods[+c.dataset.i];
      var hay = m ? [m.name, m.description, m.category, m.note, (m.badges || []).join(' ')].join(' ').toLowerCase() : '';
      var match = (state.cat === 'all' || c.dataset.cat === state.cat) && (!q || hay.indexOf(q) !== -1);
      c.hidden = !match;
      c.classList.remove('enter');
      if (match) {
        c.style.setProperty('--i', shown++);
        void c.offsetWidth;
        if (!reduceQuery.matches) c.classList.add('enter');
      }
    });
    var grid = $('#grid'), empty = $('#grid .empty');
    if (grid && total) {
      if (!shown && !empty) {
        grid.insertAdjacentHTML('beforeend', '<p class="empty" data-none><b>No mods match</b>Try a different word, or clear the filter.</p>');
      } else if (shown && empty && empty.hasAttribute('data-none')) empty.remove();
    }
    var line = $('#result-line');
    if (line) line.textContent = total ? (shown === total ? total + ' mod' + (total === 1 ? '' : 's') : 'Showing ' + shown + ' of ' + total) : '';
    $$('.cat').forEach(function (t) { t.setAttribute('aria-pressed', t.dataset.cat === state.cat ? 'true' : 'false'); });
    moveIndicators();
  }

  function moveInd(box) {
    var ind = $('.ind', box), on = $('.cat[aria-pressed="true"]', box);
    if (!ind || !on || !box.offsetParent) return;
    ind.style.width = on.offsetWidth + 'px';
    ind.style.height = on.offsetHeight + 'px';
    ind.style.transform = 'translate(' + on.offsetLeft + 'px,' + on.offsetTop + 'px)';
    ind.classList.add('ready');
  }
  function moveIndicators() {
    ['#side-cats', '#pills'].forEach(function (s) { var b = $(s); if (b) moveInd(b); });
    var on = $('#pills .cat[aria-pressed="true"]');
    if (on && on.scrollIntoView && on.parentNode.parentNode.scrollWidth > on.parentNode.parentNode.clientWidth) {
      var sc = on.parentNode.parentNode;
      sc.scrollTo({ left: on.offsetLeft - 24, behavior: reduceQuery.matches ? 'auto' : 'smooth' });
    }
  }

  function wireFilters() {
    ['#side-cats', '#pills'].forEach(function (s) {
      var box = $(s);
      if (!box) return;
      box.addEventListener('click', function (e) {
        var b = e.target.closest('.cat');
        if (!b) return;
        state.cat = b.dataset.cat;
        applyFilter();
        var sec = $('#downloads'), r = sec.getBoundingClientRect();
        if (s === '#side-cats' && (r.top < 0 || r.top > window.innerHeight * 0.5)) sec.scrollIntoView({ behavior: reduceQuery.matches ? 'auto' : 'smooth' });
        if (!desktopQuery.matches) closeSide();
      });
    });
    var input = $('#search');
    if (input) {
      input.addEventListener('input', function () { state.q = input.value; applyFilter(); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { input.value = ''; state.q = ''; applyFilter(); input.blur(); } });
      document.addEventListener('keydown', function (e) {
        if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
        var t = e.target;
        if (t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable)) return;
        e.preventDefault(); input.focus();
      });
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(moveIndicators, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicators);
    var side = $('#side');
    if (side) side.addEventListener('transitionend', function (e) { if (e.propertyName === 'transform') moveIndicators(); });
    applyFilter();
  }

  /* ---------- Sidebar ---------- */
  var burger = $('#burger'), scrim = $('#scrim');
  function sideVisible() { return desktopQuery.matches ? !document.body.classList.contains('side-closed') : document.body.classList.contains('side-open'); }
  function syncBurger() { if (burger) burger.setAttribute('aria-expanded', sideVisible() ? 'true' : 'false'); }
  function closeSide() {
    document.body.classList.remove('side-open');
    if (desktopQuery.matches) document.body.classList.add('side-closed');
    syncBurger();
  }
  function wireSidebar() {
    if (!burger) return;
    if (desktopQuery.matches && lsGet('axiom-side') === 'closed') document.body.classList.add('side-closed');
    syncBurger();
    burger.addEventListener('click', function () {
      if (desktopQuery.matches) {
        var closed = document.body.classList.toggle('side-closed');
        lsSet('axiom-side', closed ? 'closed' : 'open');
      } else document.body.classList.toggle('side-open');
      syncBurger();
      setTimeout(moveIndicators, 480);
    });
    if (scrim) scrim.addEventListener('click', closeSide);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !desktopQuery.matches && document.body.classList.contains('side-open')) { closeSide(); burger.focus(); }
    });
    // jump links close the drawer on small screens
    $('#jump') && $('#jump').addEventListener('click', function (e) { if (e.target.closest('a') && !desktopQuery.matches) closeSide(); });
    var onChange = function () { document.body.classList.remove('side-open'); syncBurger(); moveIndicators(); };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onChange);
  }

  /* ---------- Top bar + scroll spy + progress ---------- */
  function wireScroll() {
    var nav = $('#nav'), bar = $('#progress i');
    var ticking = false;
    function update() {
      ticking = false;
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 12);
      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
      }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();

    var sections = ['features', 'downloads', 'install', 'faq', 'discord'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = '#' + en.target.id;
        $$('#top-links a, #jump a').forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === id ? 'true' : 'false'); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  function wireReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Announcement ---------- */
  function wireAnnounce() {
    var bar = $('#announce');
    if (!bar) return;
    $('.x', bar).addEventListener('click', function () {
      bar.hidden = true;
      lsSet('axiom-dismiss-' + (bar.dataset.id || ''), '1');
    });
  }

  /* ---------- Buttons: ripple + copy ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); } finally { ta.remove(); }
    });
  }
  function flashCopied(btn, doneLabel) {
    var old = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = svg(UI.check) + '<span>' + (doneLabel || 'Copied!') + '</span>';
    clearTimeout(btn._t);
    btn._t = setTimeout(function () { btn.classList.remove('copied'); btn.innerHTML = btn._old || old; }, 1700);
    if (!btn._old) btn._old = old;
  }
  function wireButtons() {
    document.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.btn');
      if (!b || reduceQuery.matches || b.getAttribute('aria-disabled') === 'true') return;
      var r = b.getBoundingClientRect(), dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.left = (e.clientX - r.left) + 'px'; dot.style.top = (e.clientY - r.top) + 'px';
      b.appendChild(dot);
      setTimeout(function () { dot.remove(); }, 700);
    });
    document.addEventListener('click', function (e) {
      var c = e.target.closest('[data-copy]');
      if (!c) return;
      copyText(c.getAttribute('data-copy')).then(function () { flashCopied(c); }, function () {
        window.prompt('Copy this:', c.getAttribute('data-copy'));
      });
    });
    document.addEventListener('pointermove', function (e) {
      var f = e.target.closest && e.target.closest('.feat');
      if (!f) return;
      var r = f.getBoundingClientRect();
      f.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      f.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ---------- Details modal ---------- */
  var modal = $('#modal'), lastFocus = null, closeTimer = 0;
  function openModal(m) {
    if (!modal) return;
    var url = safeUrl(m.url);
    var details = [['Version', m.mc || '1.21.11'], ['Category', m.category || 'Other'], ['Loader', 'Fabric'], ['Licence', m.openSource ? 'Open source' : 'Closed source']];
    $('#modal-content').innerHTML =
      '<div style="--a:' + safeColor(m.accent) + '">' + artHTML(m).replace('data-details', '') + '</div>' +
      '<div class="modal-body"><h3 id="m-title">' + esc(m.name) + '</h3>' +
      '<p class="desc">' + esc(m.description) + '</p>' +
      (m.note ? '<div class="reqs" role="note">' + svg(UI.alert) + '<span>' + esc(m.note) + '</span></div>' : '') +
      '<div class="kv">' + details.map(function (d) { return '<div><small>' + d[0] + '</small><span>' + esc(d[1]) + '</span></div>'; }).join('') + '</div>' +
      '<div class="modal-actions">' + downloadButton(m) +
      (url ? '<button class="copy" type="button" data-copy="' + esc(url) + '">' + svg(UI.copy) + '<span>Copy link</span></button>' : '') + '</div>' +
      (url && !m.updating && isExternal(url) ? '<p class="hint" style="font-size:12.5px;color:var(--silver-2)">Adblocker on — ignore any other button on the download page. A mod is always a single .jar.</p>' : '') +
      '</div>';
    clearTimeout(closeTimer);
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('locked');
    requestAnimationFrame(function () { requestAnimationFrame(function () { modal.classList.add('open'); }); });
    $('.modal-card', modal).focus({ preventScroll: true });
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('open');
    document.body.classList.remove('locked');
    closeTimer = setTimeout(function () { modal.hidden = true; }, reduceQuery.matches ? 0 : 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function wireModal() {
    var grid = $('#grid');
    if (grid) grid.addEventListener('click', function (e) {
      var d = e.target.closest('[data-details]');
      if (!d) return;
      var card = d.closest('.card');
      if (card && state.mods[+card.dataset.i]) openModal(state.mods[+card.dataset.i]);
    });
    if (!modal) return;
    modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a[href], button:not([disabled]):not([aria-disabled="true"])', $('.modal-card', modal));
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === $('.modal-card', modal))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Starfield ---------- */
  var Stars = (function () {
    var canvas = $('#stars');
    if (!canvas || !canvas.getContext) return { set: function () {} };
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, stars = [], meteors = [], sparks = [];
    var raf = 0, running = false, last = 0, nextMeteor = 2.5, clock = 0;
    var mouse = { x: -9999, y: -9999 };
    var opt = { on: true, shooting: true, density: 1 };

    // pre-rendered soft glow so 400+ stars stay cheap
    var sprite = document.createElement('canvas');
    sprite.width = sprite.height = 96;
    (function () {
      var g = sprite.getContext('2d');
      var gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.1, 'rgba(235,255,244,.85)');
      gr.addColorStop(0.28, 'rgba(170,255,205,.32)');
      gr.addColorStop(0.6, 'rgba(90,255,160,.07)');
      gr.addColorStop(1, 'rgba(90,255,160,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
    })();

    function seed() {
      var base = Math.max(170, Math.min(420, Math.round((W * H) / 5200)));
      var n = Math.round(base * opt.density);
      stars = [];
      for (var i = 0; i < n; i++) {
        var big = Math.random() < 0.05;
        stars.push({
          x: Math.random() * W, y: Math.random() * H, ox: 0, oy: 0, vx: 0, vy: 0,
          r: big ? 1.0 + Math.random() * 0.7 : 0.35 + Math.pow(Math.random(), 2.2) * 0.8,
          glow: big ? 14 + Math.random() * 10 : 4 + Math.random() * 6,
          period: 2.5 + Math.random() * 7, phase: Math.random() * 6.2832,
          min: 0.08 + Math.random() * 0.25, depth: 0.5 + Math.random() * 0.9
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

    function spawnMeteor() {
      var ang = (Math.PI / 180) * (18 + Math.random() * 24);       // shallow downward slope
      var dir = Math.random() < 0.5 ? 1 : -1;
      var speed = 750 + Math.random() * 600;
      meteors.push({
        x: dir === 1 ? -80 + Math.random() * W * 0.55 : W + 80 - Math.random() * W * 0.55,
        y: -30 + Math.random() * H * 0.45,
        vx: Math.cos(ang) * speed * dir, vy: Math.sin(ang) * speed,
        len: 140 + Math.random() * 160, life: 0, max: 1.1 + Math.random() * 0.7
      });
    }

    function step(dt) {
      clock += dt;
      var R = 150, R2 = R * R;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var dx = s.x + s.ox - mouse.x, dy = s.y + s.oy - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {                                // soft push away from the cursor
          var d = Math.sqrt(d2), f = (1 - d / R); f *= f;
          s.vx += (dx / d) * f * 2600 * s.depth * dt;
          s.vy += (dy / d) * f * 2600 * s.depth * dt;
        }
        s.vx += -s.ox * 16 * dt; s.vy += -s.oy * 16 * dt;          // spring home
        var damp = Math.exp(-4.2 * dt);
        s.vx *= damp; s.vy *= damp;
        s.ox += s.vx * dt; s.oy += s.vy * dt;
      }
      if (opt.shooting) {
        nextMeteor -= dt;
        if (nextMeteor <= 0 && meteors.length < 2) { spawnMeteor(); nextMeteor = 3 + Math.random() * 6; }
      }
      for (var m = meteors.length - 1; m >= 0; m--) {
        var mt = meteors[m];
        mt.life += dt; mt.x += mt.vx * dt; mt.y += mt.vy * dt;
        if (sparks.length < 90) for (var k = 0; k < 2; k++) sparks.push({ x: mt.x, y: mt.y, vx: (Math.random() - .5) * 40 - mt.vx * .05, vy: (Math.random() - .5) * 40 - mt.vy * .05, life: 0, max: .4 + Math.random() * .5, r: 3 + Math.random() * 5 });
        if (mt.life > mt.max || mt.x < -400 || mt.x > W + 400 || mt.y > H + 200) meteors.splice(m, 1);
      }
      for (var p = sparks.length - 1; p >= 0; p--) {
        var sp = sparks[p]; sp.life += dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt;
        if (sp.life > sp.max) sparks.splice(p, 1);
      }
    }

    function draw(still) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var k = still ? 0.7 : 0.5 + 0.5 * Math.sin(clock * 6.2832 / s.period + s.phase);
        k = k * k * (3 - 2 * k);
        var a = s.min + (1 - s.min) * k;
        var gs = s.glow * (0.65 + 0.55 * k), x = s.x + s.ox, y = s.y + s.oy;
        ctx.globalAlpha = Math.min(1, a * 0.9);
        ctx.drawImage(sprite, x - gs, y - gs, gs * 2, gs * 2);
        ctx.globalAlpha = Math.min(1, 0.4 + a * 0.6);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x, y, s.r * (0.85 + 0.3 * k), 0, 6.2832); ctx.fill();
      }
      for (var m = 0; m < meteors.length; m++) {
        var mt = meteors[m], sp = Math.hypot(mt.vx, mt.vy), ux = mt.vx / sp, uy = mt.vy / sp;
        var fade = Math.min(1, mt.life / .12) * Math.min(1, (mt.max - mt.life) / .35);
        var tx = mt.x - ux * mt.len, ty = mt.y - uy * mt.len;
        var g = ctx.createLinearGradient(mt.x, mt.y, tx, ty);
        g.addColorStop(0, 'rgba(255,255,255,' + (0.95 * fade) + ')');
        g.addColorStop(0.25, 'rgba(120,255,175,' + (0.45 * fade) + ')');
        g.addColorStop(1, 'rgba(0,255,102,0)');
        ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(mt.x, mt.y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.globalAlpha = fade; ctx.drawImage(sprite, mt.x - 18, mt.y - 18, 36, 36);
      }
      for (var p = 0; p < sparks.length; p++) {
        var q = sparks[p], t = 1 - q.life / q.max;
        ctx.globalAlpha = t * 0.55;
        ctx.drawImage(sprite, q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;
      step(dt); draw(false);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(loop); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function settle() {
      canvas.style.display = opt.on ? '' : 'none';
      if (!opt.on) { stop(); return; }
      if (reduceQuery.matches) { stop(); draw(true); }
      else if (!document.hidden) start();
    }

    window.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') { mouse.x = e.clientX; mouse.y = e.clientY; } }, { passive: true });
    document.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { size(); if (reduceQuery.matches && opt.on) draw(true); }, 160);
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else settle(); });
    if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', settle);

    size(); settle();
    return {
      set: function (o) {
        var reseed = o.density != null && o.density !== opt.density;
        for (var k in o) opt[k] = o[k];
        if (reseed) seed();
        if (!opt.shooting) { meteors.length = 0; sparks.length = 0; }
        settle();
      }
    };
  })();

  /* ---------- Cursor glow ---------- */
  var Cursor = (function () {
    var el = $('#cursor-glow');
    if (!el) return { set: function () {} };
    var on = true, x = -999, y = -999, tx = -999, ty = -999, raf = 0, shown = false;
    function loop() {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      raf = on ? requestAnimationFrame(loop) : 0;
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || !on || !fineQuery.matches || reduceQuery.matches) return;
      tx = e.clientX; ty = e.clientY;
      if (!shown) { x = tx; y = ty; shown = true; el.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { el.classList.remove('on'); shown = false; });
    return {
      set: function (v) {
        on = v;
        if (!v) { el.classList.remove('on'); shown = false; cancelAnimationFrame(raf); raf = 0; }
      }
    };
  })();

  /* ---------- Effects widget ---------- */
  function wireFx() {
    var box = $('#fx'), btn = $('#fx-btn');
    if (!box || !btn) return;
    var fx = { stars: true, shooting: true, cursor: true, density: 1 };
    try { var saved = JSON.parse(lsGet('axiom-fx') || 'null'); if (saved) for (var k in fx) if (k in saved) fx[k] = saved[k]; } catch (e) {}
    fx.density = Math.max(0.4, Math.min(2, +fx.density || 1));

    function push() {
      Stars.set({ on: !!fx.stars, shooting: !!fx.shooting, density: fx.density });
      Cursor.set(!!fx.cursor);
      lsSet('axiom-fx', JSON.stringify(fx));
    }
    $$('[data-fx]', box).forEach(function (inp) {
      var key = inp.dataset.fx;
      if (inp.type === 'checkbox') inp.checked = !!fx[key]; else inp.value = fx[key];
      inp.addEventListener('input', function () {
        fx[key] = inp.type === 'checkbox' ? inp.checked : +inp.value;
        if (key === 'density') $('#fx-density-out').textContent = Math.round(fx.density * 100) + '%';
        push();
      });
    });
    $('#fx-density-out').textContent = Math.round(fx.density * 100) + '%';

    function toggle(force) {
      var open = typeof force === 'boolean' ? force : !box.classList.contains('open');
      box.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function () { toggle(); });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) toggle(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
    push();
  }

  /* ---------- Boot ---------- */
  function loadData() {
    return fetch('site-data.json', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).catch(function (err) {
      var el = $('#fallback-data');
      if (el) {
        try { var d = JSON.parse(el.textContent); if (window.console && console.info) console.info('Using the built-in copy of the downloads (' + err.message + ').'); return d; } catch (e) {}
      }
      throw err;
    });
  }

  function boot() {
    wireFx();
    wireScroll();
    wireButtons();
    wireReveal();
    wireAnnounce();
    wireSidebar();

    var hasGrid = !!$('#grid');
    if (hasGrid) { wireModal(); wireFilters(); }
    loadData().then(function (data) {
      if (hasGrid) { render(data); applyFilter(); watchCounters(); }
      else { applyLinks(data); if (window.AxiomTheme && data.theme) window.AxiomTheme.apply(data.theme); }
      wireDiscord(data.links && data.links.discord);
      setTimeout(moveIndicators, 60);
    }).catch(function (err) {
      var g = $('#grid');
      if (g) g.innerHTML = '<p class="empty"><b>Couldn’t load the mod list</b>Refresh the page, or ask in the Discord.</p>';
      if (window.console && console.warn) console.warn(err);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
