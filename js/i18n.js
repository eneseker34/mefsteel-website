// ===== MefSteel i18n — Çok Dil Desteği =====
const LANGS = {
  tr: { flag: '🇹🇷', label: 'Türkçe' },
  en: { flag: '🇬🇧', label: 'English' },
  de: { flag: '🇩🇪', label: 'Deutsch' },
  fr: { flag: '🇫🇷', label: 'Français' },
  it: { flag: '🇮🇹', label: 'Italiano' }
};

let currentLang = 'tr';
let translations = {};

async function loadLang(lang) {
  if (!LANGS[lang]) lang = 'tr';
  try {
    const res = await fetch(`/lang/${lang}.json?v=1`);
    if (!res.ok) throw new Error();
    translations = await res.json();
    currentLang = lang;
    localStorage.setItem('mefsteel_lang', lang);
    applyTranslations();
    updateLangSwitcher();
    document.documentElement.lang = lang;
  } catch {
    if (lang !== 'tr') loadLang('tr');
  }
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key] === undefined) return;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      el.placeholder = translations[key];
    } else if (tag === 'OPTION') {
      el.textContent = translations[key];
    } else {
      el.textContent = translations[key];
    }
  });
}

function updateLangSwitcher() {
  const btn = document.getElementById('lang-btn');
  if (btn) btn.innerHTML = `${LANGS[currentLang].flag} ${currentLang.toUpperCase()} <span class="lang-caret">▾</span>`;
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.lang === currentLang);
  });
}

function buildLangSwitcher() {
  const wrapper = document.getElementById('lang-switcher');
  if (!wrapper) return;

  const btn = document.createElement('button');
  btn.id = 'lang-btn';
  btn.className = 'lang-btn';
  btn.setAttribute('aria-label', 'Dil seç');

  const dropdown = document.createElement('div');
  dropdown.className = 'lang-dropdown';

  Object.entries(LANGS).forEach(([code, { flag, label }]) => {
    const opt = document.createElement('button');
    opt.className = 'lang-option';
    opt.dataset.lang = code;
    opt.innerHTML = `${flag} ${label}`;
    opt.addEventListener('click', () => {
      loadLang(code);
      dropdown.classList.remove('open');
    });
    dropdown.appendChild(opt);
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'));

  wrapper.appendChild(btn);
  wrapper.appendChild(dropdown);
}

// Başlat
document.addEventListener('DOMContentLoaded', () => {
  buildLangSwitcher();
  const saved = localStorage.getItem('mefsteel_lang');
  const browser = (navigator.language || 'tr').split('-')[0];
  const initial = saved || (LANGS[browser] ? browser : 'tr');
  loadLang(initial);
});
