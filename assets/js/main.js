/* ==========================================================================
   Riverside School — site behaviour
   Vanilla JS, no dependencies.

   The display-settings panel is the important part. It writes four attributes
   onto <html> and stores them; an inline script in every page head reads them
   back before the first paint, so a visitor who needs large white-on-black
   text never sees a flash of the default scheme.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- strings that only exist in JS ------------------------------ */

  var S = {
    en: {
      panelOpen: 'Display settings',
      panelClose: 'Hide display settings',
      applied: 'Display settings applied:',
      reset: 'Settings reset to default.',
      sizeNormal: 'normal text', sizeLarge: 'large text', sizeXlarge: 'extra large text',
      schemeNormal: 'normal colours', schemeContrast: 'high contrast', schemeInverted: 'white on black',
      spacingNormal: 'normal spacing', spacingWide: 'wide spacing',
      imagesOn: 'images shown', imagesOff: 'images hidden',
      noRows: 'Nothing in this category.'
    },
    ru: {
      panelOpen: 'Настройки отображения',
      panelClose: 'Скрыть настройки отображения',
      applied: 'Настройки применены:',
      reset: 'Настройки сброшены.',
      sizeNormal: 'обычный текст', sizeLarge: 'крупный текст', sizeXlarge: 'очень крупный текст',
      schemeNormal: 'обычные цвета', schemeContrast: 'высокая контрастность', schemeInverted: 'белым по чёрному',
      spacingNormal: 'обычные интервалы', spacingWide: 'увеличенные интервалы',
      imagesOn: 'изображения показаны', imagesOff: 'изображения скрыты',
      noRows: 'В этой категории ничего нет.'
    },
    ka: {
      panelOpen: 'ჩვენების პარამეტრები',
      panelClose: 'პარამეტრების დამალვა',
      applied: 'პარამეტრები გამოყენებულია:',
      reset: 'პარამეტრები დაბრუნდა საწყისზე.',
      sizeNormal: 'ჩვეულებრივი ტექსტი', sizeLarge: 'მსხვილი ტექსტი', sizeXlarge: 'ძალიან მსხვილი ტექსტი',
      schemeNormal: 'ჩვეულებრივი ფერები', schemeContrast: 'მაღალი კონტრასტი', schemeInverted: 'თეთრი შავზე',
      spacingNormal: 'ჩვეულებრივი დაშორება', spacingWide: 'გაზრდილი დაშორება',
      imagesOn: 'სურათები ჩანს', imagesOff: 'სურათები დამალულია',
      noRows: 'ამ კატეგორიაში არაფერია.'
    }
  };

  function lang() { return root.getAttribute('data-lang') || 'en'; }
  function s(key) { return (S[lang()] || S.en)[key] || S.en[key] || key; }

  /* ==========================================================================
     Display settings
     ========================================================================== */

  var SETTINGS = {
    size: { attr: 'data-a11y-size', values: ['normal', 'large', 'xlarge'], fallback: 'normal' },
    scheme: { attr: 'data-a11y-scheme', values: ['normal', 'contrast', 'inverted'], fallback: 'normal' },
    spacing: { attr: 'data-a11y-spacing', values: ['normal', 'wide'], fallback: 'normal' },
    images: { attr: 'data-a11y-images', values: ['on', 'off'], fallback: 'on' }
  };

  var STORE = 'rs-a11y';

  function readStored() {
    try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { return {}; }
  }

  function write(state) {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  function currentState() {
    var state = {};
    Object.keys(SETTINGS).forEach(function (key) {
      var def = SETTINGS[key];
      var value = root.getAttribute(def.attr);
      state[key] = def.values.indexOf(value) > -1 ? value : def.fallback;
    });
    return state;
  }

  function applyState(state, announce) {
    /* Apply the new scheme without animating every surface into it. */
    root.classList.add('is-switching');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.remove('is-switching'); });
    });

    Object.keys(SETTINGS).forEach(function (key) {
      var def = SETTINGS[key];
      var value = def.values.indexOf(state[key]) > -1 ? state[key] : def.fallback;
      if (value === def.fallback) root.removeAttribute(def.attr);
      else root.setAttribute(def.attr, value);
    });
    write(state);
    syncControls(state);
    if (announce) say(announce);
  }

  function syncControls(state) {
    Object.keys(state).forEach(function (key) {
      document.querySelectorAll('input[name="a11y-' + key + '"]').forEach(function (input) {
        input.checked = input.value === state[key];
      });
    });
  }

  var liveRegion = document.getElementById('a11y-live');
  function say(text) { if (liveRegion) liveRegion.textContent = text; }

  function describe(key, value) {
    var map = {
      size: { normal: 'sizeNormal', large: 'sizeLarge', xlarge: 'sizeXlarge' },
      scheme: { normal: 'schemeNormal', contrast: 'schemeContrast', inverted: 'schemeInverted' },
      spacing: { normal: 'spacingNormal', wide: 'spacingWide' },
      images: { on: 'imagesOn', off: 'imagesOff' }
    };
    return s(map[key][value]);
  }

  document.querySelectorAll('.a11y-panel input[type="radio"]').forEach(function (input) {
    input.addEventListener('change', function () {
      var key = input.name.replace('a11y-', '');
      var state = currentState();
      state[key] = input.value;
      applyState(state, s('applied') + ' ' + describe(key, input.value));
    });
  });

  var resetBtn = document.querySelector('[data-a11y-reset]');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      applyState({ size: 'normal', scheme: 'normal', spacing: 'normal', images: 'on' }, s('reset'));
    });
  }

  var panel = document.getElementById('a11y-panel');
  var panelToggle = document.querySelector('[data-a11y-toggle]');
  if (panel && panelToggle) {
    var labelEl = panelToggle.querySelector('[data-a11y-toggle-label]');
    var setPanel = function (open) {
      panel.hidden = !open;
      panelToggle.setAttribute('aria-expanded', String(open));
      if (labelEl) labelEl.textContent = open ? s('panelClose') : s('panelOpen');
      if (open) {
        var first = panel.querySelector('input');
        if (first) first.focus();
      }
    };
    panelToggle.addEventListener('click', function () { setPanel(panel.hidden); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { setPanel(false); panelToggle.focus(); }
    });
    // The panel starts closed; if the visitor has non-default settings stored,
    // leave it closed but make the toggle say so.
    setPanel(false);
  }

  syncControls(currentState());

  /* ==========================================================================
     Navigation
     ========================================================================== */

  var navToggle = document.querySelector('.nav-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      var open = !mobileMenu.classList.contains('is-open');
      mobileMenu.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900) {
        mobileMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ==========================================================================
     Table filters (document register, staff list)
     ========================================================================== */

  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var targetSelector = group.getAttribute('data-filter-group');
    var buttons = group.querySelectorAll('button[data-filter]');
    var rows = document.querySelectorAll(targetSelector);
    var empty = document.querySelector('[data-filter-empty]');

    function apply(value) {
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === value));
      });
      var shown = 0;
      rows.forEach(function (row) {
        var match = value === 'all' || row.getAttribute('data-category') === value;
        row.hidden = !match;
        if (match) shown++;
      });
      if (empty) { empty.hidden = shown > 0; empty.textContent = s('noRows'); }
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-filter')); });
    });

    document.addEventListener('languagechange', function () {
      var active = group.querySelector('button[aria-pressed="true"]');
      if (active) apply(active.getAttribute('data-filter'));
    });
  });

  /* ==========================================================================
     Language changes: relabel the things JS owns
     ========================================================================== */

  document.addEventListener('languagechange', function () {
    if (panel && panelToggle) {
      var labelEl2 = panelToggle.querySelector('[data-a11y-toggle-label]');
      if (labelEl2) labelEl2.textContent = panel.hidden ? s('panelOpen') : s('panelClose');
    }
    say('');
  });

  /* ---------- year --------------------------------------------------------- */

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
