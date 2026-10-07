// Reactive translations for the Vue apps. State is module-level, so every component shares one language.

import { readonly, ref } from 'vue';
import { SITE_CONFIG } from './config';
import { TRANSLATIONS } from './i18n';
import { createTime } from './time';
import type { Lang, TranslationKey } from './types';

export type TranslationVars = Record<string, string | number>;

const STORAGE_KEY = 'lang';

function isLang(value: unknown): value is Lang {
  return value === 'bg' || value === 'en';
}

function defaultLang(): Lang {
  // An unsupported configured value falls back to 'bg'.
  return isLang(SITE_CONFIG.defaultLanguage) ? SITE_CONFIG.defaultLanguage : 'bg';
}

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isLang(saved) ? saved : defaultLang();
  } catch {
    return defaultLang();
  }
}

const lang = ref<Lang>(initialLang());
document.documentElement.lang = lang.value;

function has(key: string): key is TranslationKey {
  return key in TRANSLATIONS[lang.value];
}

function t(key: TranslationKey, vars?: TranslationVars): string {
  let text: string = has(key) ? TRANSLATIONS[lang.value][key] : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.split(`{${k}}`).join(String(v));
    }
  }
  return text;
}

function setLang(newLang: Lang): void {
  if (newLang === lang.value) return;
  lang.value = newLang;
  try { localStorage.setItem(STORAGE_KEY, newLang); } catch { /* storage unavailable */ }
  document.documentElement.lang = newLang;
}

// Sofia-time formatting in the current language; reading `lang` keeps it reactive in templates.
const time = createTime(() => lang.value);

export function useI18n() {
  return {
    lang: readonly(lang),
    t,
    has,
    setLang,
    time,
  };
}
