---
title: 'Migrate public booking page to Vue 3'
type: 'refactor'
ticket: ''
created: '2026-10-07'
status: 'built'
baseline_revision: 'da03b1a94bdb0405991497668317dfb829ca099a'
route: 'full'
route_source: 'auto'
risk: 'high'    
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The public booking page is imperative jQuery DOM code (`src/js/app.ts` + `common.ts`), hard to extend, and depends on jQuery globals injected by `@rollup/plugin-inject`.

**Approach:** Rewrite the public page as a Vue 3 app (SFCs, `<script setup lang="ts">`) with `bootstrap-vue-next` for the modal and dropdowns, and add shared Vue foundations (i18n composable, theme composable, Sofia time module, fetch-based API helper) that the admin migration (`plan-migrate-admin-to-vue.md`) will reuse. The admin page stays on jQuery untouched until then.

**Decisions:** Modals/dropdowns use `bootstrap-vue-next` (1b). Translations stay in-house behind a reactive composable, no `vue-i18n` (2a). Strict behavioural parity, including known quirks; quirks are documented in `plan-fix-frontend-quirks.md` for later (3a).

## Boundaries & Constraints

**Always:**
- Pixel/behaviour parity: keep the classes/ids `public/css/style.css` targets, the localStorage keys `lang`, `theme`, `onboarding_count`, `onboarding_dismissed`, and try/catch around every storage access.
- Bootstrap 5 CSS, bootstrap-icons, self-hosted Cormorant fonts; no CDN.
- Sofia-time logic exists once: shared by the new Vue code and the admin's `window.Time`.
- API errors `{ error: code }` → `err.<code>` key with the body as interpolation vars, unknown → `err.generic`; all copy in `src/js/i18n.ts`.
- TypeScript strict, no `any`; `npm run build` and `npm run typecheck` pass.
- The admin page keeps working exactly as at baseline.

**Never:**
- No changes to `functions/`, `lib/`, `db/`, `wrangler.toml`, API contracts, or admin behaviour.
- No jQuery in the public bundle; no Vue Router, Pinia, `vue-i18n`, runtime template compiler, or CDN scripts.
- No visual redesign, new features, or quirk fixes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Book a class | Valid name/email/phone on a bookable card | POST reserve → success alert, form hidden, list + modal refresh | — |
| Booking rejected | 409 `{error:"full"}` | `err.full` text in the modal, list reloads | Mapped error |
| Unknown code / non-JSON body | 500 with an HTML body | `err.generic` | No uncaught exception |
| Invalid form | Empty or malformed field | Bootstrap `was-validated` feedback, no request sent | — |
| First load fails | GET events errors, no data yet | Error state + retry button | Retry re-fetches |
| Reload fails | Data already shown | Stale list kept, no error state | Silent |
| Storage blocked | localStorage throws | Defaults (`SITE_CONFIG.defaultLanguage`, dark), no onboarding tip | Swallowed |

</frozen-after-approval>

## Code Map

- `src/js/app.ts` (`AppPage`) -- source of truth for public behaviour: static fill 94-104 (title, business, tel stripped to `[+\d]`), status badge 110-127 (yellow ≤3, `spotsLeftOne`), cards 129-165 (`role=button tabindex=0` + Enter/Space only when bookable; `is-bookable`/`is-unavailable`, `aria-disabled`), list states 167-198 (3 skeletons, retry, empty, keep stale list), reserve modal 204-234 (reset + clear `was-validated` on open, focus `#r-name` on shown, restore trigger focus on hidden, spinner, success 66-74, failure 75-78), language re-render 82-86. Delete it after porting.
- `src/js/common.ts` -- `I18n` 3-64 (lang fallback, `t` interpolation, `error` 30-36), `Time` 79-148, `Theme` 152-194, onboarding IIFE 196-222. Stays for admin; move `Time` internals to `src/js/time.ts` and make `window.Time` delegate.
- `src/js/config.ts`, `src/js/i18n.ts` -- keep the `window` assignment (admin needs it) and add named exports.
- `src/js/globals.d.ts` -- keep for admin; new code imports types instead of using ambient globals.
- `public/index.html` -- markup to move into SFCs; becomes head + `<div id="app">`.
- `public/js/entry-main.ts` -- keep CSS/font imports; replace the script imports with `createApp(PublicApp).use(createBootstrap()).mount('#app')` and add the bootstrap-vue-next CSS.
- `vite.config.ts` -- add `@vitejs/plugin-vue`; keep the inject plugin (admin), multi-page input and copy plugins.
- `tsconfig.json`, `package.json`, `public/js/vite-env.d.ts` -- include `src/**/*.vue`; `typecheck` → `vue-tsc --noEmit`.

## Tasks & Acceptance

**Execution:**
- [ ] `package.json` -- add `vue`, `bootstrap-vue-next`, `@vitejs/plugin-vue`, `vue-tsc`; switch `typecheck` to `vue-tsc --noEmit`. Keep jQuery deps.
- [ ] `vite.config.ts`, `tsconfig.json`, `public/js/vite-env.d.ts` -- Vue plugin; `.vue` included.
- [ ] `src/js/config.ts`, `src/js/i18n.ts`, `src/js/types.ts` -- named exports plus shared types (`ClassEvent`, `TranslationKey`).
- [ ] `src/js/time.ts` + `src/js/common.ts` -- extract `Time` taking a lang getter; `window.Time` delegates.
- [ ] `src/js/useI18n.ts`, `src/js/useTheme.ts`, `src/js/api.ts` -- reactive lang/theme with storage and `<html lang>`/`data-theme` sync; `apiFetch` throwing `ApiError {status, body}` for non-2xx or unparseable JSON; `errorText()`.
- [ ] `src/vue/shared/LangSwitch.vue`, `ThemeSwitch.vue`, `OnboardingTip.vue` -- BDropdown-based switchers and the tip, same markup classes.
- [ ] `src/vue/public/PublicApp.vue`, `EventCard.vue`, `ReserveModal.vue` -- public page; BModal with the focus behaviour above.
- [ ] `public/index.html`, `public/js/entry-main.ts` -- shell + mount; delete `src/js/app.ts`.

**Acceptance Criteria:**
- Given a clean install, when `npm run build` and `npm run typecheck` run, then both exit 0.
- Given the built `dist/`, when the public page's JS bundle is searched for `jQuery`, then there is no match, and the admin bundle still loads and works.
- Given the public page in BG/EN and light/dark, when compared side by side with the baseline build, then layout, text and colours match, including the dropdown and modal.
- Given saved `lang=en` and `theme=light`, when the page loads, then it renders English/light with the matching toggle label and icon.
- Given a fresh browser, when the public page is loaded four times, then the tip shows on the first three only; "Got it" hides it for good.
- Given keyboard-only use, when pressing Enter/Space on a bookable card and later closing the modal, then focus lands on `#r-name` and then returns to the card.
- Given the admin page, when logging in and creating, editing and deleting a class, then it behaves exactly as at baseline.

## Design Notes

- One `createApp` per entry; shared state lives in module-level `ref`s inside composables (no Pinia).
- `ApiError` carries `status` and the parsed `body`, so `errorText` reproduces `I18n.error(xhr)` and the admin migration can detect 401s globally.

## Verification

**Commands:**
- `npm run build` -- expected: exit 0, `dist/index.html` and `dist/admin/index.html` emitted.
- `npm run typecheck` -- expected: exit 0.

**Manual checks (if no CLI):**
- `npm run dev`: walk every I/O row and AC at `http://localhost:8788`, then smoke-test `/admin/`.

## Review Triage Log

| # | Lens | Location | Finding | Verdict | Evidence | Route |
|---|------|----------|---------|---------|----------|-------|
| 1 | quick | `src/vue/public/PublicApp.vue:113`, `ReserveModal.vue` `onHidden` | After a booking attempt, focus now returns to the card; at baseline it was lost because `renderEvents()` rebuilt every card and detached the saved trigger | low | Confirmed against baseline `app.ts` (`loadEvents` → `renderEvents` empties `#events`; `_triggerEl` is detached). No user harm; the plan's keyboard AC explicitly expects focus to return to the card. Reproducing the bug would mean adding code to break focus on purpose | rejected (raised with the human at present) |
| 2a | quick | `src/vue/shared/LangSwitch.vue`, `ThemeSwitch.vue` | `BDropdown` defaults the menu `<ul>` to `role="menu"`, but its items have no `menuitem` role; baseline `<ul>` had no role | low | Confirmed: `role: { default: "menu" }` in `BDropdown-CnxUzs42.js:66`, rendered at :378. Screen readers announce an empty menu | patch: `role="list"` restores the baseline list semantics |
| 2b | quick | same | The menu gets `overflow-auto b-floating-size` and Floating UI positioning instead of Popper's; visual parity is unproven | maybe-false | Needs the manual side-by-side comparison already listed in the ACs; would be low at most | rejected (covered by manual AC check) |
| 3 | quick | `src/js/useI18n.ts:18` | Comment claims "same fallback as the admin's I18n", but admin uses an invalid `defaultLanguage` unchecked (and throws); public page falls back to `bg` | low | Confirmed against `common.ts`. Only a misconfigured config triggers the difference, but the comment would mislead the admin migration | patch: corrected the comment |
| 4 | quick | `tsconfig.json` `include` | `src/vue/**/*.ts` is not included; `eventStatus.ts` is only typechecked because a `.vue` file imports it | low | Confirmed. The fix is a one-glob correction | patch: `src/js/**/*.ts` → `src/**/*.ts` |
