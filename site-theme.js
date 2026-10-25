/* Axiom Mods — theme bootstrap.
   Loaded in <head> on every page so the right palette is on screen before first paint.
   The real setting lives in site-data.json ("theme"); script.js and the admin call
   AxiomTheme.apply() with it. The last value seen is remembered in localStorage only to
   avoid a colour flash on the next visit — site-data.json is always the source of truth.
   Preview any theme with ?theme=mint in the address bar. */
(function () {
  var THEMES = ['emerald', 'mint', 'moss', 'jade'];
  var root = document.documentElement;
  root.classList.add('js');

  function apply(name) {
    if (THEMES.indexOf(name) === -1) name = 'emerald';
    root.setAttribute('data-theme', name);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', '#000000');
    return name;
  }
  function remember(name) {
    try { localStorage.setItem('axiom-theme', name); } catch (e) {}
  }

  var fromUrl = null, cached = null;
  try { fromUrl = new URLSearchParams(location.search).get('theme'); } catch (e) {}
  try { cached = localStorage.getItem('axiom-theme'); } catch (e) {}
  apply(fromUrl || cached || 'emerald');

  window.AxiomTheme = {
    list: THEMES,
    apply: function (name) {
      var used = apply(name);
      remember(used);
      return used;
    }
  };
})();
