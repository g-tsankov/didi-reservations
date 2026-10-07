---
title: 'Migrate admin page to Vue 3 and remove jQuery'
type: 'refactor'
ticket: ''
created: '2026-10-07'
status: 'built'
baseline_revision: 'da03b1a94bdb0405991497668317dfb829ca099a'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After the public page moves to Vue, the admin page (`src/js/admin.ts` + `common.ts`) is the only jQuery code left, which keeps jQuery, `@types/jquery`, `@rollup/plugin-inject` and the `window.*` globals in the build.

**Approach:** Rewrite the admin page as a Vue 3 app that reuses the shared foundations from the public migration (i18n composable, theme, `time.ts`, `apiFetch`/`ApiError`), then remove jQuery, its types, the inject plugin, `common.ts`, `globals.d.ts` and the `window` globals. The `AGENTS.md` update and the dependency/comment tidy-up are deferred (split 2026-10-07, see `deferred-work.md`).

**Decisions:** `bootstrap-vue-next` for the modal and the language switch (1b). In-house translations, no `vue-i18n` (2a). Strict parity, including the quirks listed in `plan-fix-frontend-quirks.md`, for example the btn-group language switch and the onboarding counter ticking on admin loads (3a).

## Boundaries & Constraints

**Always:** Same classes/ids as targeted by `style.css`; same storage keys; Sofia time for display and input; error codes mapped through `src/js/i18n.ts`; TypeScript strict; build and typecheck pass.

**Never:** No changes to `functions/`, `lib/`, `db/` or API contracts; no Router, Pinia or `vue-i18n`; no visual or behaviour changes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Start, logged in | GET session 200 | Events table shown | — |
| Start, logged out | GET session 401 | Login form, no message | — |
| Wrong password | POST login → `invalid_password` | Mapped message in `#login-error` | — |
| Session expires | Any call except login/session → 401 | Modal hidden, login with `err.unauthorized` | Global |
| Capacity too low | PUT → 409 `{error:"capacity_below_booked", n:5}` | Message interpolates 5 | Modal stays open |
| Save | Valid create/edit | Stays open, "Saved.", refilled, list reloads | — |
| Delete class / remove sign-up | Confirmed `window.confirm` | DELETE, then the list or event is re-fetched | Mapped error |

</frozen-after-approval>

## Code Map

- `src/js/admin.ts` (baseline behaviour; delete after porting) -- login 40-47 (submit disabled while pending), logout 49-51 (ends on `showLogin()` with no message, even after a global 401), filters 53-59, row click 61-64 (GET details → modal; non-401 errors ignored), save 72-108, delete 110-120, remove sign-up 122-139, lang change 143-147, start-up 149-157 (non-401 → login with mapped message), global 401 160-177, `showLogin` 181-187 (clears + focuses `#password`), status/table 197-230, modal 241-270 (defaults 60/12; date/time split from `toSofiaInput`), sign-ups 272-297 (tel stripped to `[+\d]`, `createdAt` `dd.mm.yyyy hh:mm` h23).
- `public/admin/index.html` -- markup source; becomes `<head>` + `<div id="app">` (keep `lang="bg"`, robots meta).
- `public/js/entry-admin.ts` -- mirror `entry-main.ts` (bootstrap, bootstrap-vue-next, icons CSS; no fonts) and mount `AdminApp` with `createBootstrap()`.
- Reuse unchanged: `src/js/api.ts` (`apiFetch`, `ApiError.status`, `errorText`), `src/js/useI18n.ts` (`t`, `lang`, `setLang`, `time`), `src/js/useTheme.ts` (import applies `data-theme`, as `Theme` did), `src/js/config.ts`.
- `src/vue/shared/OnboardingTip.vue` `shouldShow()` -- counter logic to share with admin.
- Delete `src/js/common.ts`, `src/js/globals.d.ts`; drop `window` assignments and their comments in `src/js/config.ts:16-17`, `src/js/i18n.ts:183-184`.
- `vite.config.ts` -- remove the `inject` import and block; keep everything else.
- `package.json` -- remove `jquery`, `@types/jquery`, `@rollup/plugin-inject`; `npm install` refreshes the lock file.
- `public/css/style.css:163-180` -- btn-group `.lang-switch .btn` rules the admin switch must match.

## Tasks & Acceptance

**Execution:**
- [x] `src/js/onboarding.ts`, `src/vue/shared/OnboardingTip.vue` -- export the visit counter and use it from both -- keeps the admin quirk without duplicate storage code.
- [x] `src/vue/admin/AdminApp.vue` -- topbar (business name, view-site link, `BButtonGroup`/`BButton` lang switch with `data-lang`, `active`, `aria-label`=`langSwitcherLabel`; logout), login view, list view (filters, table, badges, `#events-empty`), global 401, `document.title` = `admin.title · businessName`.
- [x] `src/vue/admin/EventModal.vue` -- `BModal` `#eventModal` (`modal-lg`, scrollable): form, messages, delete, sign-ups.
- [x] `public/admin/index.html`, `public/js/entry-admin.ts` -- shell + mount.
- [x] Delete `src/js/admin.ts`, `common.ts`, `globals.d.ts`; remove the `window` globals; clean up `vite.config.ts`, `package.json`, `package-lock.json`.

**Acceptance Criteria:**
- Given a clean install, when `npm run build` and `npm run typecheck` run, then both exit 0 and no file under `dist/` contains `jQuery`.
- Given `src/`, `public/`, `vite.config.ts`, `package.json`, when searched for `jquery`, `window.I18n`, `window.Time`, `window.SITE_CONFIG` or `plugin-inject`, then nothing matches.
- Given the admin page in BG/EN and light/dark, when compared with the baseline build, then layout, text and colours match, including the btn-group switch, table, modal and sign-ups.
- Given the modal open in edit mode, when the language changes, then title, badges, sign-up heading and labels switch, while typed values and a shown error text stay unchanged.
- Given a fresh browser, when `/admin/` loads, then `onboarding_count` increments as at baseline.
- Given "New class", when the modal opens, then the name field is focused, delete and sign-ups are hidden, duration is 60 and capacity 12; after saving it switches to edit mode with sign-ups shown.

## Design Notes

- The status uses a `now` ref that is refreshed only where baseline re-rendered (list load, filter click, language change), so unrelated re-renders, such as typing in the modal, do not reclassify rows.
- Form fields are refs filled only on open and after save; removing a sign-up updates `current` without refilling the form.
- Each remove button tracks its own pending state. Error messages are stored strings; static copy goes through `t()`.
- In edit mode, keep Bootstrap's default focus and do not restore focus on close. Check what `BModal` does by default.

## Verification

**Commands:**
- `npm run build` -- expected: exit 0; `grep -ri jquery dist` empty.
- `npm run typecheck` -- expected: exit 0.

**Manual checks (if no CLI):**
- `npm run dev`: walk every I/O row and AC on `/admin/`; smoke-test `/` (tip, switches).

## Implementation Notes

- Admin API types (`AdminEvent`, `Reservation`, `EventDetails`) were added to `src/js/types.ts`.
- `EventModal` takes the admin `api` wrapper (with the global 401) as a prop and emits `changed` so the list reloads.
- BModal's focus trap returns focus to the element focused before opening, unlike Bootstrap. `open()` blurs the active element first, so closing leaves focus on `<body>` as at baseline. Edit mode keeps the default initial focus on the dialog element; new mode focuses `#e-name`.
- The header slot keeps `#eventModalLabel` (and `aria-labelledby` points to it); BModal would otherwise use `eventModal-label`.
- `src/js/time.ts` line 1 was reworded because it contained `window.Time`, which the grep criterion forbids. The rest of the comment tidy-up stays deferred.
- Re-checked by the orchestrator (2026-10-07): `npm run typecheck` and `npm run build` exit 0; `dist/` and the AC search paths contain no jQuery/`window.*`/`plugin-inject` matches.
- Verification gaps for review: no side-by-side visual comparison with the baseline build (BG/EN, light/dark) yet; the mapped-error path for a failed class delete or sign-up removal was not exercised; the I/O matrix was walked once in headless Chrome and is not saved as a repeatable test. The admin page now also loads `bootstrap-vue-next.css`, and BModal adds stacking classes and an inline z-index to `#eventModal`.
- Quick review (2026-10-07): findings triaged in the Review Triage Log; patches 2a/2b, 3, 4a, 5 applied by the orchestrator; `npm run typecheck` and `npm run build` exit 0 and the jQuery/`window.*` greps are empty afterwards; the patched ARIA attributes are not yet checked in a browser. Paused by the user before step 5 (present); resume there.
- Review handoff: the implementation-only diff (excluding `package-lock.json` and the earlier uncommitted public-page migration) is saved as [plan-migrate-admin-to-vue.diff](plan-migrate-admin-to-vue.diff). A full diff since `baseline_revision` also includes that earlier work.

## Plan Change Log

## Review Triage Log

| # | Finding | Verdict | Evidence | Route |
|---|---------|---------|----------|-------|
| 1 | Visual-parity AC (BG/EN, light/dark vs baseline) not demonstrated; admin now loads `bootstrap-vue-next.css` and BModal adds stacking classes/inline z-index | maybe-false | The BVN stylesheet's modal/table/btn-group selectors only hit `.b-*`, `.b-table` and `.input-group .btn-group`, none of which the admin uses. The inline z-index comes from Bootstrap's `--bs-modal-zindex`. Settling it needs a side-by-side screenshot comparison with the baseline build. | defer (unverified medium) |
| 2a | `EventModal.vue` BModal: no `aria-modal="true"` while open (Bootstrap set it) | medium | `BModal-NPsCBNo7.js` render sets `role="dialog"` but never `aria-modal`; `$attrs` are merged onto the `.modal` div after the defaults (line ~418), so the attribute can be passed. | patch |
| 2b | Same root cause: BModal adds `aria-describedby="eventModal-body"`, absent at baseline | low | Line 416 of the BModal render always sets it. Screen readers would read the whole form as the dialog description each time it opens. Overridden through `$attrs`. | patch (grouped with 2a) |
| 2c | Hidden BModal has no `aria-hidden="true"` | false | When hidden the dialog is `display:none` (`vShow`), which already removes it from the accessibility tree; no user-visible difference. | reject |
| 3 | `duration`/`capacity` refs typed `string` but `v-model` on `type="number"` stores numbers | low | Vue's `vModelText` casts when `type === 'number'`, so the declared type is wrong at runtime. Any future string-only use (e.g. `.trim()`) would break. Direct type correction. | patch |
| 4a | `src/js/useI18n.ts:17` comment contrasts with the deleted admin `I18n` | low | That module is deleted by this change. The deferred tidy-up names only the `time.ts`/`types.ts` headers, so this comment isn't covered. | patch |
| 4b | Admin now falls back to `'bg'` for an unsupported `defaultLanguage` (baseline used it unchecked) | low | Only reachable with an invalid `config.ts` value (current value is `'bg'`). Restoring it needs an admin-only branch. | reject |
| 5 | `public/css/style.css` comments at 67 (`#app` "public page" only) and 163 ("admin/index.html still uses the old structure") are stale | low | Admin now mounts into `#app` too, and its btn-group comes from `AdminApp.vue`. The line-163 comment invites deleting rules the admin switch depends on. | patch |
