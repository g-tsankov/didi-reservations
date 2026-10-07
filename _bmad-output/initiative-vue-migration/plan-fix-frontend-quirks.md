---
title: 'Fix frontend quirks found during the Vue migration'
type: 'bugfix'
ticket: ''
created: '2026-10-07'
status: 'done'
baseline_revision: 'da03b1a94bdb0405991497668317dfb829ca099a'
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

**Problem:** The investigation for the Vue migration found behaviour that is wrong or inconsistent, but it was kept as-is so the migration could be checked for parity:

1. **Onboarding counter ticks on admin.** The shared onboarding code runs on every page load, including `/admin/`, which has no tip. Admin visits use up the three showings and register a document-wide click handler there.
2. **Inconsistent language switch.** The public page uses a dropdown (`.lang-switch` dropdown); the admin page still uses the older btn-group. Its CSS rules were kept on purpose.
3. **Theme flash.** The theme is applied when the page script runs, so light-theme users briefly see the dark theme on every load. The theme also applies on admin, which has no theme switcher.
4. **Switcher accessibility** (deferred from initiative-ui-overhaul): the active language/theme dropdown item has no `aria-current="true"`, which `EXPERIENCE.md` requires, and the `aria-label` sits on a plain `div` with no role, so assistive technology ignores it. It needs `role="group"`, or the label should move to the toggle button.
5. **Unused translation key.** `loading` is never used, because skeleton cards replaced it.
6. **Stale CSS stub.** The end of `style.css` still has a stub named `rosy-bold`; the light theme already covers it.

**Approach:** Decide per item whether to fix it, then fix the chosen ones in the Vue code. For item 3, add an early theme application in `<head>` (and check whether `public/_headers` gains a CSP); also decide whether admin should get a theme switcher or always be dark.

**Decisions (2026-10-07):**
- All six items were re-checked against the Vue code, are still present, and are all fixed.
- Admin gets the shared `ThemeSwitch` (same stored choice as the public page). It does not stay switcher-less, and it is not forced dark.
- `public/_headers` has no CSP, so a small inline `<head>` script is allowed.
- Added at checkpoint 1 (user): fix the admin topbar's light-theme contrast. The brand is `text-white` and the buttons are `btn-outline-light`/`btn-light`, and `.topbar` has no styles, so they are near-invisible on the light background. Make the topbar use theme tokens.

</frozen-after-approval>

## Code Map

- `src/vue/admin/AdminApp.vue:7-13` -- `import '@src/useTheme'` side-effect and the `countOnboardingVisit()` call; `:3,28,30,159-168` -- `BButtonGroup` language switch, `LANGS`, `setLang`.
- `src/js/onboarding.ts:1` -- header says admin counts visits too.
- `src/vue/shared/LangSwitch.vue`, `ThemeSwitch.vue` -- wrapper `div` carries `aria-label` with no role; items only get `.active`.
- `public/index.html`, `public/admin/index.html` -- `<head>` has no early theme script. `src/js/useTheme.ts` applies it (key `theme`, `'light'` → `data-theme="light"`, else none); keep that, since it is idempotent.
- `src/js/i18n.ts:8,97`, `src/js/types.ts:13` -- unused `loading` key.
- `public/css/style.css:163-183` -- btn-group switch rules (only admin uses them); `:616-621` -- `rosy-bold` stub.

## Tasks & Acceptance

**Execution:**
- [ ] `src/vue/admin/AdminApp.vue` -- drop the `countOnboardingVisit` import and call and the `BButtonGroup` switch (plus `BButtonGroup`/`LANGS`/`setLang` if they become unused); render `<ThemeSwitch />` and `<LangSwitch />`; drop the `useTheme` side-effect import (ThemeSwitch brings it).
- [ ] `src/js/onboarding.ts` -- header comment: used only by the public tip.
- [ ] `src/vue/shared/LangSwitch.vue`, `ThemeSwitch.vue` -- add `role="group"` to the wrapper; add `:aria-current="active ? 'true' : undefined"` to each item.
- [ ] `public/index.html`, `public/admin/index.html` -- add an inline `<head>` script, before any stylesheet, that sets `data-theme="light"` when `localStorage.theme === 'light'`, wrapped in try/catch.
- [ ] `src/js/i18n.ts`, `src/js/types.ts` -- remove `loading`.
- [ ] `public/css/style.css` -- remove the btn-group switch rules (keep the dropdown ones) and the `rosy-bold` stub; add `.topbar` rules (surface background, subtle bottom border, `.navbar-brand` in `--ink-primary`).
- [ ] `src/vue/admin/AdminApp.vue` (topbar) -- drop `text-white`; view-site and logout buttons become `btn-outline-primary` (already themed).

**Acceptance Criteria:**
- Given a fresh browser, when `/admin/` is opened 5 times and then `/`, then the tip shows on `/` and `onboarding_count` is `1`.
- Given the theme is set to light, when either page is hard-reloaded, then no dark frame is shown.
- Given `/admin/`, then the topbar shows the same theme and language dropdowns as the public page, and switching either one works and persists.
- Given a screen reader, when a switcher is focused, then its group label is announced and the active item is exposed as current.
- Given `/admin/` in the light and in the dark theme, then the topbar's brand, buttons and switchers are all clearly readable.
- `npm run build` and the type-check pass.

## Implementation Notes

Oneshot: about 60 lines across 9 files, all small and mechanical. Topbar contrast was added to scope at checkpoint 1.

- Admin: removed `countOnboardingVisit()`, the `BButtonGroup` switch, `LANGS`, `setLang`, the `Lang` import and the `useTheme` side-effect import (ThemeSwitch imports it). It now renders `<ThemeSwitch />` and `<LangSwitch />`. Topbar buttons are now `btn-outline-primary` (logout was a filled `btn-light`).
- The early `<head>` script runs before Vite's injected CSS links (checked in `dist/admin/index.html`).
- Switchers: `role="group"` on the wrapper; `aria-current="true"` on the active item. The `.btn` btn-group rules are deleted, since only the admin used them.
- `npm run build` and `npm run typecheck` pass. Browser ACs are not checked yet (no test runner).
- Follow-up after the user asked about light-theme admin CSS: the modal `.btn-close` invert now applies only in the dark theme (it made the X light grey on light modals, admin and public); table hover is `rgba(var(--bs-primary-rgb), 0.06)` (`--surface-raised` was white on near-white in light); `color-scheme: dark`/`light` added to the theme roots for native date/time icons. CSS-only, checked statically; not seen in a browser.

## Plan Change Log

## Review Triage Log

- medium, patch: the deleted `.lang-switch .btn` rules also styled the `BDropdown` toggles (the toggle is a `BButton`, so it has `.btn`, confirmed in `BDropdown-*.js`), so both pages lost the pill radius. `border-radius: var(--rounded-full)` moved into the `.dropdown-toggle` rule.
- medium, defer: the switcher toggles use `--ink-disabled`, which is low contrast in both themes. This was already true on the public page; it is a design-token choice, so it went to `deferred-work.md`. The topbar-readable AC is met for the brand and buttons only.

## Verification

**Commands:**
- `npm run build` -- expected: succeeds with no type errors.

**Manual checks (if no CLI):**
- Run `npm run dev`; check the ACs above in the browser.
