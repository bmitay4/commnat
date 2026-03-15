import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import he from './locales/he.json';

await i18next
  .use(LanguageDetector)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'he'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'nc_lang',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;

// Apply RTL/LTR to the document
export function applyDir(lang) {
  const isRTL = lang === 'he';
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);
  document.body.classList.toggle('rtl', isRTL);
}

// Translate all [data-i18n] elements in the DOM
export function translateDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const params = el.getAttribute('data-i18n-params');
    const translated = i18next.t(key, params ? JSON.parse(params) : {});
    el.textContent = translated;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = i18next.t(el.getAttribute('data-i18n-placeholder'));
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = i18next.t(el.getAttribute('data-i18n-title'));
  });
}
