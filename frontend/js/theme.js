/**
 * WIGO Herbal — Theme System v2
 * ─────────────────────────────
 * • FOUC-safe: sets [data-theme] on <html> immediately
 * • Reads OS prefers-color-scheme on first visit
 * • Persists choice in localStorage under key "wigoTheme"
 * • Animated toggle button (track + thumb + sun/moon icons)
 * • Injects scroll-progress bar automatically
 * • Adds .scrolled class to #mainNav on scroll > 60 px
 * • Removes #pageLoader after window "load" event
 * • Exposes window.WigoTheme.toggle / .set / .get
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'wigoTheme';

  /* ─── 1. Determine starting theme (FOUC-safe) ─────────────────── */
  function getInitialTheme() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    try {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch (e) {}
    return 'light';
  }

  var currentTheme = getInitialTheme();

  /* Apply immediately — before any style recalc */
  document.documentElement.setAttribute('data-theme', currentTheme);

  /* ─── 2. Core apply function ──────────────────────────────────── */
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateAllToggles();
  }

  /* ─── 3. Toggle ───────────────────────────────────────────────── */
  function toggleTheme() {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  /* ─── 4. Refresh every toggle button UI ──────────────────────── */
  function updateAllToggles() {
    document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
      refreshToggleUI(btn, currentTheme);
    });
  }

  function refreshToggleUI(btn, theme) {
    var sun   = btn.querySelector('.toggle-icon-sun');
    var moon  = btn.querySelector('.toggle-icon-moon');
    var label = btn.querySelector('.toggle-label');
    var aria  = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

    btn.setAttribute('aria-label', aria);
    btn.setAttribute('title', aria);
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');

    if (sun)  sun.style.display  = theme === 'light' ? 'inline' : 'none';
    if (moon) moon.style.display = theme === 'dark'  ? 'inline' : 'none';
    if (label) label.textContent = theme === 'dark'  ? 'Light'  : 'Dark';
  }

  /* ─── 5. Bind click handlers (idempotent via data-attr) ──────── */
  function bindToggles() {
    document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
      if (btn.dataset.themeBound === '1') return;
      btn.dataset.themeBound = '1';
      btn.addEventListener('click', toggleTheme);
      refreshToggleUI(btn, currentTheme);
    });
  }

  /* ─── 6. Scroll progress bar ──────────────────────────────────── */
  function initScrollProgress() {
    if (document.getElementById('scrollProgressBar')) return;
    var bar = document.createElement('div');
    bar.id = 'scrollProgressBar';
    bar.className = 'scroll-progress-bar';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', '0');
    document.body.prepend(bar);

    window.addEventListener('scroll', function () {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var pct   = total > 0 ? (window.scrollY / total) * 100 : 0;
      bar.style.width = pct.toFixed(1) + '%';
      bar.setAttribute('aria-valuenow', Math.round(pct));
    }, { passive: true });
  }

  /* ─── 7. Glassmorphism navbar on scroll ───────────────────────── */
  function initNavScroll() {
    var nav = document.getElementById('mainNav');
    if (!nav) return;
    function onScroll() {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); /* run once on load */
  }

  /* ─── 8. Page loader ──────────────────────────────────────────── */
  function initPageLoader() {
    var loader = document.getElementById('pageLoader');
    if (!loader) return;
    function hide() {
      loader.classList.add('hidden');
      setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 450);
    }
    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', hide);
    }
  }

  /* ─── 9. OS theme-change listener ────────────────────────────── */
  function listenOSTheme() {
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        /* Only follow OS if user has never explicitly chosen */
        if (!localStorage.getItem(STORAGE_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    } catch (e) {}
  }

  /* ─── 10. DOM-ready init ──────────────────────────────────────── */
  function init() {
    bindToggles();
    initScrollProgress();
    initNavScroll();
    initPageLoader();
    listenOSTheme();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Re-bind if new toggle buttons are added dynamically */
  if (window.MutationObserver) {
    var observer = new MutationObserver(function () { bindToggles(); });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  /* ─── Public API ──────────────────────────────────────────────── */
  window.WigoTheme = {
    toggle : toggleTheme,
    set    : applyTheme,
    get    : function () { return currentTheme; }
  };

}());
