import { esTranslations } from './esTranslations';

// Module-level current language so plain functions can translate without
// component context. Kept in sync by the App root via setCurrentLanguage.
let currentLanguage = 'en';

export function setCurrentLanguage(lang) {
  currentLanguage = lang === 'es' ? 'es' : 'en';
}

export function getCurrentLanguage() {
  return currentLanguage;
}

// Translate a static English UI string. Unknown strings fall back to English,
// so a missing dictionary entry is cosmetic, never an error.
export function tr(text) {
  if (currentLanguage !== 'es') return text;
  return esTranslations[text] ?? text;
}

// Translate a template with {0}, {1}, ... placeholders:
// trf('Welcome, {0}!', [name])
export function trf(template, args) {
  let out = tr(template);
  args.forEach((arg, i) => {
    out = out.split(`{${i}}`).join(String(arg));
  });
  return out;
}
