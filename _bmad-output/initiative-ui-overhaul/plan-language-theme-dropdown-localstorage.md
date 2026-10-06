---
title: 'Language and Theme Dropdowns with localStorage'
type: 'feature'
ticket: ''
created: '2026-10-06'
status: 'built'
baseline_revision: '15028809c5836981d549e4e42d9bf9e6f5cffdc3'
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

**Problem:** The language and theme controls in the nav are button groups (BG/EN pills, moon/sun icons), which occupy persistent space and lack a label indicating what they control. Users who want dropdowns cannot access them in that form.

**Approach:** Replace both `btn-group` controls in the nav with Bootstrap dropdowns; the toggle shows the current selection (BG/EN text for language, a moon/sun icon for theme). localStorage persistence is already implemented in both `I18n` and `Theme` IIFEs — no backend changes needed.

</frozen-after-approval>

## Implementation Notes

Oneshot: four files, all mechanical. No logic changes — only HTML structure, `apply()` DOM targeting, and CSS class selectors. localStorage reads/writes in `I18n` and `Theme` are already correct and untouched.

**Changes required:**

### 1. `public/index.html` — replace both btn-groups with Bootstrap dropdowns

Replace the two `<div class="btn-group ...">` elements inside the `<div class="d-flex gap-2 align-items-center">` with:

```html
<div class="dropdown theme-switch">
  <button class="btn btn-sm dropdown-toggle theme-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
    <i class="bi bi-moon-stars-fill" aria-hidden="true"></i>
  </button>
  <ul class="dropdown-menu dropdown-menu-end">
    <li><a class="dropdown-item" href="#" data-theme-btn="dark"><i class="bi bi-moon-stars-fill me-2" aria-hidden="true"></i><span data-i18n="themeDark"></span></a></li>
    <li><a class="dropdown-item" href="#" data-theme-btn="light"><i class="bi bi-sun-fill me-2" aria-hidden="true"></i><span data-i18n="themeLight"></span></a></li>
  </ul>
</div>
<div class="dropdown lang-switch">
  <button class="btn btn-sm dropdown-toggle lang-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
    BG
  </button>
  <ul class="dropdown-menu dropdown-menu-end">
    <li><a class="dropdown-item" href="#" data-lang="bg">BG</a></li>
    <li><a class="dropdown-item" href="#" data-lang="en">EN</a></li>
  </ul>
</div>
```

### 2. `src/js/common.ts` — update `I18n.apply()`, `Theme.apply()`, and both click handlers

**I18n — `apply()` function:** replace the `.lang-switch [data-lang]` forEach block with:
```typescript
$('.lang-switch .dropdown-toggle').text(lang.toUpperCase());
$('.lang-switch [data-lang]').each(function (this: HTMLElement) {
  $(this).toggleClass('active', $(this).data('lang') === lang);
});
$('.lang-switch').attr('aria-label', t('langSwitcherLabel'));
```

**I18n — click handler:** add `e.preventDefault()` since the items are now `<a>` tags:
```typescript
$(document).on('click', '.lang-switch [data-lang]', function (this: HTMLElement, e: JQuery.ClickEvent) {
  e.preventDefault();
  set($(this).data('lang') as string);
});
```

**Theme — `apply()` function:** replace the `.theme-switch [data-theme-btn]` forEach block with:
```typescript
const iconClass = current === 'light' ? 'bi-sun-fill' : 'bi-moon-stars-fill';
$('.theme-switch .dropdown-toggle i').attr('class', `bi ${iconClass}`).attr('aria-hidden', 'true');
$('.theme-switch [data-theme-btn]').each(function (this: HTMLElement) {
  $(this).toggleClass('active', $(this).data('theme-btn') === current);
});
$('.theme-switch').attr('aria-label', I18n.t('themeSwitcherLabel'));
```

**Theme — click handler:** add `e.preventDefault()`:
```typescript
$(document).on('click', '.theme-switch [data-theme-btn]', function (this: HTMLElement, e: JQuery.ClickEvent) {
  e.preventDefault();
  set($(this).data('theme-btn') as ThemeValue);
});
```

### 3. `src/js/app.ts` — remove redundant lang-switch block from `renderStatic()`

Remove these three lines from `renderStatic()` (they are now handled entirely by `I18n.apply()`):
```typescript
$('.lang-switch [data-lang]').each(function () {
  const isActive = $(this).data('lang') === I18n.lang;
  $(this).attr('aria-current', isActive ? 'true' : null);
});
$('.lang-switch').attr('aria-label', t('langSwitcherLabel'));
```
Leave `Theme.apply()` in place.

### 4. `public/css/style.css` — replace btn-group nav styles with dropdown styles

Replace the two rule blocks for `.lang-switch .btn / .theme-switch .btn` (lines ~160–178) with:

```css
.lang-switch .dropdown-toggle,
.theme-switch .dropdown-toggle {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--ink-disabled);
  background: transparent;
  border-color: transparent;
  padding: 0.25rem 0.65rem;
}

.lang-switch .dropdown-toggle:hover,
.theme-switch .dropdown-toggle:hover,
.lang-switch .dropdown-toggle:focus-visible,
.theme-switch .dropdown-toggle:focus-visible {
  color: var(--accent);
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.lang-switch .dropdown-menu,
.theme-switch .dropdown-menu {
  background: var(--surface-raised);
  border-color: var(--border-subtle);
  min-width: 8rem;
}

.lang-switch .dropdown-item,
.theme-switch .dropdown-item {
  color: var(--ink-primary);
  font-size: 13px;
}

.lang-switch .dropdown-item:hover,
.theme-switch .dropdown-item:hover,
.lang-switch .dropdown-item.active,
.theme-switch .dropdown-item.active {
  background: var(--surface-overlay);
  color: var(--accent);
}
```

### 5. Build

Run `npm run build` after all source changes.

## Plan Change Log

## Review Triage Log

- **Admin CSS regression** (patched): `.lang-switch .btn` rules deleted by diff; admin/index.html still uses btn-group. Confirmed. Fixed by restoring the btn-group rules above the new dropdown rules.
- **Initial "BG" hardcode** (patched): HTML toggle hardcoded "BG"; if localStorage has "en" it shows wrong until AppPage constructor fires. Confirmed. Fixed by adding synchronous `$('.lang-switch .dropdown-toggle').text(lang.toUpperCase())` at end of I18n IIFE.
- **ARIA lang/theme selection state** (deferred): aria-pressed/aria-current removed; plan spec deliberately omitted them. Not an unmet AC. Deferred to follow-up plan.
- **aria-label on role-less div** (deferred): Plan explicitly specifies setting aria-label on the dropdown wrapper which has no ARIA role. Plan-level decision; touching it would contradict frozen intent. Deferred.

## Verification

**Commands:**
- `npm run build` — expected: zero TypeScript errors, `public/js/common.js` and `public/js/app.js` updated

**Manual checks:**
- Open `http://localhost:8788`; two dropdown toggles appear in the nav (moon icon, "BG" text)
- Click BG/EN dropdown → changes language; reload → language persists (localStorage key `lang`)
- Click moon/sun dropdown → changes theme; reload → theme persists (localStorage key `theme`)
- Switch language while in light theme → theme dropdown shows correct icon, language toggle updates text
- Both dropdowns are styled consistently with the nav in both dark and light themes
