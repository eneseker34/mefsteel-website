/* Static-page language switcher for /blog/.
   Unlike js/i18n.js (which swaps data-i18n text in place on a single URL),
   blog posts are fully translated static HTML per language, so switching
   language means navigating to the sibling URL declared in BLOG_LANG_MAP.
   Each blog page sets window.BLOG_LANG_MAP and window.BLOG_CURRENT_LANG
   before loading this script. Reuses the .lang-switcher/.lang-btn/
   .lang-dropdown/.lang-option CSS already defined in css/style.css. */
(function () {
  var LANGS = {
    tr: { flag: '🇹🇷', label: 'Türkçe' },
    en: { flag: '🇬🇧', label: 'English' },
    de: { flag: '🇩🇪', label: 'Deutsch' },
    fr: { flag: '🇫🇷', label: 'Français' },
    it: { flag: '🇮🇹', label: 'Italiano' },
    es: { flag: '🇪🇸', label: 'Español' },
    bg: { flag: '🇧🇬', label: 'Български' },
    el: { flag: '🇬🇷', label: 'Ελληνικά' }
  };

  function init() {
    var wrapper = document.getElementById('lang-switcher');
    var map = window.BLOG_LANG_MAP;
    var current = window.BLOG_CURRENT_LANG;
    if (!wrapper || !map || !current || !LANGS[current]) return;

    var btn = document.createElement('button');
    btn.id = 'lang-btn';
    btn.type = 'button';
    btn.className = 'lang-btn';
    btn.innerHTML = LANGS[current].flag + ' ' + current.toUpperCase() + ' <span class="lang-caret">▾</span>';

    var dropdown = document.createElement('div');
    dropdown.className = 'lang-dropdown';

    Object.keys(LANGS).forEach(function (code) {
      var url = map[code];
      if (!url) return;
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'lang-option' + (code === current ? ' active' : '');
      opt.dataset.lang = code;
      opt.innerHTML = LANGS[code].flag + ' ' + LANGS[code].label;
      opt.addEventListener('click', function () {
        try { localStorage.setItem('mefsteel_lang', code); } catch (e) {}
        window.location.href = url;
      });
      dropdown.appendChild(opt);
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', function () {
      dropdown.classList.remove('open');
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
