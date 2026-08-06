/**
 * WIGO Herbal - Bilingual Language System v3
 * ─────────────────────────────────────────────
 * Uses data-en / data-am attributes on elements.
 * SAFE: only updates text on LEAF nodes (no child elements).
 * Never destroys child HTML.
 *
 * Usage:
 *   <h1 data-en="Welcome" data-am="እንኳን ደህና መጡ">Welcome</h1>
 *   <input data-en="Full Name" data-am="ሙሉ ስም" placeholder="Full Name">
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'wigoLang';
  var currentLang = localStorage.getItem(STORAGE_KEY) || 'en';

  /* ── Is this a leaf node? (no child ELEMENTS, only text) ── */
  function isLeaf(el) {
    /* Allow elements whose only children are inline icons <i> or <span class="lang-flag"> */
    var children = el.children;
    if (children.length === 0) return true;
    /* Allow if every child is <i> or .lang-flag span (icon-only) */
    for (var i = 0; i < children.length; i++) {
      var ch = children[i];
      var tag = ch.tagName.toUpperCase();
      if (tag === 'I') continue;                          /* FontAwesome icon */
      if (tag === 'SPAN' && ch.classList.contains('lang-flag')) continue;
      return false;                                        /* has real child content */
    }
    return true;
  }

  /* ── Apply text to a single element safely ── */
  function applyToElement(el, lang) {
    var text = el.getAttribute('data-' + lang) || el.getAttribute('data-en');
    if (!text) return;

    var tag = el.tagName.toUpperCase();

    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      /* Only update placeholder, never value */
      el.placeholder = text;
      return;
    }

    if (tag === 'OPTION') {
      el.textContent = text;
      return;
    }

    if (el.hasAttribute('data-html')) {
      el.innerHTML = text;
      return;
    }

    /* Only update textContent on leaf nodes — never destroy child elements */
    if (isLeaf(el)) {
      /* Preserve icons: find the text node and update only that */
      var hasIcons = el.querySelector('i, .lang-flag');
      if (hasIcons) {
        /* Replace only the text nodes, keep child elements intact */
        var nodes = el.childNodes;
        var found = false;
        for (var n = 0; n < nodes.length; n++) {
          if (nodes[n].nodeType === 3) { /* TEXT_NODE */
            nodes[n].textContent = ' ' + text;
            found = true;
            break;
          }
        }
        if (!found) {
          el.appendChild(document.createTextNode(' ' + text));
        }
      } else {
        el.textContent = text;
      }
    }
    /* If not a leaf, skip — child elements handle their own translations */
  }

  /* ── Core: apply all translations on the page ── */
  function applyLanguage(lang) {
    if (lang !== 'en' && lang !== 'am') return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    document.documentElement.lang = lang === 'am' ? 'am' : 'en';
    document.body.classList.remove('lang-en', 'lang-am');
    document.body.classList.add('lang-' + lang);

    document.querySelectorAll('[data-en]').forEach(function (el) {
      applyToElement(el, lang);
    });

    /* Update lang-btn active states */
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    /* Notify page-specific scripts */
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
    document.dispatchEvent(new CustomEvent('langChanged',     { detail: { lang: lang } }));
  }

  /* ── Init ── */
  function init() {
    /* Wire lang buttons */
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      var clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
      clone.addEventListener('click', function () {
        applyLanguage(clone.getAttribute('data-lang'));
      });
    });

    /* Apply stored / default language */
    applyLanguage(currentLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Public API ── */
  window.WigoLang = {
    getCurrentLang  : function () { return currentLang; },
    switchLanguage  : applyLanguage,
    applyLanguage   : applyLanguage,
    updateContent   : function () { applyLanguage(currentLang); },
    getTranslation  : function () { return ''; },
    getTranslations : function () { return {}; }
  };

}());
