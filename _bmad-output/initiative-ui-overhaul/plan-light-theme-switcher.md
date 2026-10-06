---
title: 'Light Theme Switcher'
type: 'feature'
ticket: ''
created: '2026-10-06'
status: 'built'
baseline_revision: 'e9edfaa'
route: 'oneshot'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The site only offers the Velvet Night dark theme. Users who prefer a lighter UI have no option, and the CSS was already designed with semantic custom-property tokens specifically to enable future theme switching at zero component-rule cost.

**Approach:** Add a warm-light (Rosy Bold-inspired) `:root[data-theme="light"]` token override block to `style.css`; add a `window.Theme` IIFE module to `common.ts` that reads/writes `localStorage` and sets `data-theme` on `<html>`; add a theme toggle button group to the nav in `index.html`; add three i18n keys for accessibility labels.

</frozen-after-approval>

## Implementation Notes

Oneshot: change spans four files but is fully mechanical — token swap in CSS, one nav button group in HTML, one 35-line IIFE in common.ts mirroring the existing I18n pattern, and three i18n key pairs. No logic branches, no API surface, no new dependencies.

**Changes required:**

### 1. `public/css/style.css` — add light-theme token override after the `:root` block

Insert immediately after the closing `}` of the `:root` block (after line 35):

```css
:root[data-theme="light"] {
  --surface-base: #fdf8f5;
  --surface-raised: #ffffff;
  --surface-overlay: #fff4ef;
  --ink-primary: #1a0a12;
  --ink-secondary: #6b3550;
  --ink-disabled: #9e6b7e;
  --accent: #8b2255;
  --accent-hover: #a02868;
  --accent-on: #ffffff;
  --border-subtle: rgba(139, 34, 85, 0.12);
  --border-accent: rgba(139, 34, 85, 0.35);
  --success: #2e7d5a;
  --success-surface: rgba(46, 125, 90, 0.10);
  --error: #c0392b;
  --error-surface: rgba(192, 57, 43, 0.10);
  --bs-primary-rgb: 139, 34, 85;
  --ink-disabled-rgb: 158, 107, 126;
}
```

### 2. `public/index.html` — add theme toggle to nav

In the `.container` inside `<nav class="site-nav">`, add a theme-switch group beside the lang-switch. The nav container already has `justify-content: space-between` with brand on the left and lang-switch on the right. Add the theme toggle inside the same right-side wrapper or as a sibling group:

```html
<div class="btn-group btn-group-sm theme-switch" role="group" aria-label="">
  <button type="button" class="btn" data-theme-btn="dark">
    <i class="bi bi-moon-stars-fill" aria-hidden="true"></i>
  </button>
  <button type="button" class="btn" data-theme-btn="light">
    <i class="bi bi-sun-fill" aria-hidden="true"></i>
  </button>
</div>
```

Place it between the `nav-address` span and the `lang-switch` group (or wrap both in a `<div class="d-flex gap-2 align-items-center">` if spacing needs grouping).

### 3. `src/js/common.ts` — add `window.Theme` IIFE module at the end of the file

```typescript
window.Theme = (function (): ThemeModule {
  const STORAGE_KEY = 'theme';
  type ThemeValue = 'dark' | 'light';
  let current: ThemeValue = 'dark';

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    current = saved === 'light' ? 'light' : 'dark';
  } catch (e) { /* storage unavailable */ }

  function apply(): void {
    if (current === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    $('.theme-switch [data-theme-btn]').each(function (this: HTMLElement) {
      const active = $(this).data('theme-btn') === current;
      $(this).toggleClass('active', active).attr('aria-pressed', String(active));
    });
    $('.theme-switch').attr('aria-label', I18n.t('themeSwitcherLabel'));
  }

  function set(value: ThemeValue): void {
    if (value === current) return;
    current = value;
    try { localStorage.setItem(STORAGE_KEY, current); } catch (e) { /* storage unavailable */ }
    apply();
  }

  $(document).on('click', '.theme-switch [data-theme-btn]', function (this: HTMLElement) {
    set($(this).data('theme-btn') as ThemeValue);
  });

  apply();

  return {
    apply,
    get current() { return current; },
  };
})();
```

Also add the `ThemeModule` interface and `window.Theme` declaration to `src/js/globals.d.ts`.

### 4. `src/js/i18n.ts` — add three keys to both `en` and `bg` translations

```
themeSwitcherLabel: 'Theme'          // en
themeLight: 'Light'                  // en
themeDark: 'Dark'                    // en

themeSwitcherLabel: 'Тема'           // bg
themeLight: 'Светла'                 // bg
themeDark: 'Тъмна'                   // bg
```

### 5. `src/js/globals.d.ts` — add `ThemeModule` interface and extend Window

Add to `TranslationKey` union: `| 'themeSwitcherLabel' | 'themeLight' | 'themeDark'`

Add after the `TimeModule` interface:
```typescript
interface ThemeModule {
  apply(): void;
  readonly current: 'dark' | 'light';
}
```

In the `Window` interface add: `Theme: ThemeModule;`
After the existing `declare const` lines add: `declare const Theme: ThemeModule;`

### 6. `src/js/app.ts` — update `renderStatic()` to refresh theme button aria state

In `renderStatic()`, after the lang-switch aria update block, add:
```typescript
Theme.apply();
```
This keeps the theme button aria-pressed state in sync when `renderStatic()` is called (e.g. on language change).

### 7. `public/css/style.css` — extend `.lang-switch` btn selectors to cover `.theme-switch`

The nav button styling rules currently target only `.lang-switch`. Extend both selectors so the theme toggle inherits the same look:

```css
/* change FROM: */
.lang-switch .btn { … }
.lang-switch .btn.active, .lang-switch .btn[aria-current="true"] { … }

/* change TO: */
.lang-switch .btn, .theme-switch .btn { … }
.lang-switch .btn.active, .lang-switch .btn[aria-current="true"],
.theme-switch .btn.active, .theme-switch .btn[aria-pressed="true"] { … }
```

### 8. Build

Run `npm run build` after all source changes to compile TypeScript to `public/js/`.

## Plan Change Log

## Review Triage Log

- `themeLight`/`themeDark` keys unused / icon buttons unlabeled — **medium, patched**: `Theme.apply()` now sets `aria-label` on each button using the appropriate key; updates on language change via `renderStatic()`.
- Bulgarian `studioBlurb` change in diff — **false**: change is from a prior commit since baseline `e9edfaa`; not introduced by this plan.
- Compiled output missing from diff — **false**: `public/js/*.js` is gitignored; generated at build time.

## Verification

**Commands:**
- `npm run build` — expected: zero TypeScript errors, `public/js/common.js` and `public/js/app.js` updated

**Manual checks:**
- Open `http://localhost:8788`; sun/moon icons appear in the nav next to BG/EN
- Click sun → page switches to warm-light palette; click moon → returns to Velvet Night
- Reload after switching — theme persists (localStorage key `theme`)
- Switch language while in light theme — theme stays light, buttons retain correct aria-pressed states
- Verify all text and interactive elements have sufficient contrast in both themes
