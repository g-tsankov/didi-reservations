// Reactive colour theme for the Vue apps. Dark is the default and has no `data-theme` attribute.

import { readonly, ref } from 'vue';
import type { ThemeValue } from './types';

const STORAGE_KEY = 'theme';

function initialTheme(): ThemeValue {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function apply(value: ThemeValue): void {
  if (value === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

const theme = ref<ThemeValue>(initialTheme());
apply(theme.value);

function setTheme(value: ThemeValue): void {
  if (value === theme.value) return;
  theme.value = value;
  try { localStorage.setItem(STORAGE_KEY, value); } catch { /* storage unavailable */ }
  apply(value);
}

export function useTheme() {
  return {
    theme: readonly(theme),
    setTheme,
  };
}
