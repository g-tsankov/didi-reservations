---
title: 'Migrate frontend JS to TypeScript'
type: 'refactor'
ticket: ''
created: '2026-10-05'
status: 'built'
baseline_revision: '79405d6f1cdb93db1cdaf82812f81ceaf7bb4011'
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

**Problem:** The five browser-side JS files (`public/js/config.js`, `public/js/i18n.js`, `public/js/common.js`, `public/js/app.js`, `public/js/admin.js`) have no static type checking, making it easy to silently introduce type errors. The rest of the project stack (Functions, lib/) uses modern patterns.

**Approach:** Add a plain `tsc` compilation step — no bundler. Source files move to `src/js/*.ts` and compile to `public/js/*.js`. The IIFE/global window pattern is preserved; HTML script tags are unchanged.

## Boundaries & Constraints

**Always:**
- Compiled output in `public/js/*.js` must be functionally identical to current JS
- `public/js/*.js` are generated artifacts — add to `.gitignore`; source of truth is `src/js/*.ts`
- `strict: true` TypeScript — avoid `any` except where jQuery's typing genuinely cannot express the value
- Window globals (`I18n`, `Time`, `SITE_CONFIG`, `TRANSLATIONS`, `icon`) declared in `src/js/globals.d.ts` so all consuming `.ts` files resolve them correctly
- jQuery `$(this)` callbacks that captured `this` (preserved in the ES6 migration) must keep `function` form in TypeScript source

**Never:**
- Do not introduce a bundler (Vite, esbuild, Rollup, webpack)
- Do not convert IIFEs or globals to ES modules (`type="module"` script tags)
- Do not modify `functions/api/`, `lib/`, or any HTML file
- Do not add or change runtime behavior — TypeScript is compile-only

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Clean build | `npm run build` with all `.ts` files | `tsc` exits 0; `public/js/*.js` emitted | n/a |
| `$(this)` callback | `$('#events').on('click', '.is-bookable', function() {...})` in `app.ts` | Compiled JS preserves `function` keyword | tsc must not flag as error |
| Global resolution in app.ts | `I18n.t(...)`, `Time.format(...)`, `icon(...)` used without import | TypeScript resolves via `globals.d.ts` ambient declarations | Type error if interface is wrong |

</frozen-after-approval>

## Code Map

- `public/js/config.js` — assigns `window.SITE_CONFIG = { businessName, address, contact: {name,email,phone}, defaultLanguage }`; 12 lines
- `public/js/i18n.js` — assigns `window.TRANSLATIONS = { en: {...}, bg: {...} }`; 155 lines; all string keys — a `TranslationKey` union type is worthwhile
- `public/js/common.js` — `window.I18n` IIFE (t, has, error, apply, onChange, lang getter); `window.Time` IIFE (fromSofiaInput, toSofiaInput, format, time, timeRange, longDate); `window.icon`; 141 lines; six jQuery `.each(function(){})` callbacks that capture `$(this)` must stay `function`
- `public/js/app.js` — public site controller; uses `$`, `I18n`, `Time`, `icon`, `SITE_CONFIG`, `bootstrap.Modal`; 205 lines; two `$(this)` event handlers preserved from ES6 pass
- `public/js/admin.js` — admin panel controller; same globals + `SITE_CONFIG`; 264 lines; five `$(this)` handlers preserved
- `public/index.html` — loads `/js/config.js`, `/js/i18n.js`, `/js/common.js`, `/js/app.js` as plain `<script>` — HTML unchanged
- `public/admin/index.html` — loads `/js/config.js`, `/js/i18n.js`, `/js/common.js`, `/js/admin.js` — HTML unchanged
- `wrangler.toml` — `pages_build_output_dir = "./public"`; needs `[build]` section for Cloudflare Pages deployment

## Tasks & Acceptance

**Execution:**
- [ ] `package.json` -- add `"typescript"`, `"@types/jquery"`, `"@types/bootstrap"` to `devDependencies`; add `"build": "tsc"` script; update `"dev"` to `"npm run build && wrangler pages dev"` -- TypeScript must compile before dev server starts
- [ ] `tsconfig.json` -- create: `rootDir: "src/js"`, `outDir: "public/js"`, `target: "ES2020"`, `lib: ["DOM", "ES2020"]`, `strict: true`, `include: ["src/js/**/*.ts"]` -- drives all compilation
- [ ] `.gitignore` -- append `public/js/*.js` -- compiled outputs must not be committed
- [ ] `wrangler.toml` -- add `[build]` section with `command = "npm run build"` -- Cloudflare Pages must compile TS at deploy time
- [ ] `src/js/globals.d.ts` -- declare `SiteConfig`, `I18nModule`, `TimeModule` interfaces; `TranslationKey` string union of every key in TRANSLATIONS; extend `Window` with `SITE_CONFIG`, `TRANSLATIONS`, `I18n`, `Time`, `icon`; include `/// <reference types="jquery" />` -- shared ambient types for all consuming `.ts` files
- [ ] `src/js/config.ts` -- typed `window.SITE_CONFIG` assignment; shape must satisfy `SiteConfig` -- 12 lines, straightforward
- [ ] `src/js/i18n.ts` -- typed `window.TRANSLATIONS` object; key type is `TranslationKey`; inner record `Record<TranslationKey, string>` -- preserves exact shape; no logic changes
- [ ] `src/js/common.ts` -- I18n IIFE typed to return `I18nModule`; Time IIFE typed to return `TimeModule`; `icon` typed as `(name: string) => JQuery`; assign to `window.*` -- all runtime logic unchanged; `$(this)` handlers in `.each()` and `.on('click', '.lang-switch ...')` keep `function` form
- [ ] `src/js/app.ts` -- add inline `Event` interface (id, name, description, startsAt, endsAt, durationMinutes, spotsLeft, bookingOpen); type `events`, `current` variables; preserve all five function-form jQuery event handlers -- 205 lines of logic unchanged
- [ ] `src/js/admin.ts` -- add inline `AdminEvent` and `Reservation` interfaces; type `events`, `current`, `filter`; preserve all five function-form handlers -- 264 lines of logic unchanged

**Acceptance Criteria:**
- Given `src/js/*.ts` files exist, when `npm run build` runs, then `tsc` exits 0 with no errors and all `public/js/*.js` files are emitted
- Given the compiled output and `npm run dev`, when `http://localhost:8788` is opened, then the page loads, events render in Sofia time, and the language switcher toggles EN/BG correctly
- Given `http://localhost:8788/admin`, when logging in, then the events table renders, create/edit/delete class operations work, and removing a signup works — behavior identical to pre-migration
- Given `public/js/common.js` (compiled output), when inspected, then jQuery `.each()` and `.lang-switch` handler callbacks use `function` form, not arrow functions
- Given `globals.d.ts` is in scope, when `src/js/app.ts` or `src/js/admin.ts` uses `I18n.t(...)`, `Time.format(...)`, or `icon(...)`, then TypeScript resolves the call without error and without `any` suppression

## Implementation Notes

## Plan Change Log

## Review Triage Log

| # | Finding | Verdict | Evidence | Route |
|---|---------|---------|----------|-------|
| A | `globals.d.ts` lines 107–120: hand-rolled `declare namespace bootstrap { class Modal }` duplicates the same declaration provided by `@types/bootstrap@5.2.11`, causing `TS2300` suppressed only by `skipLibCheck: true` | medium | `@types/bootstrap` installed in `package-lock.json`; tsc passes only because `skipLibCheck:true` hides the conflict; confirmed in `globals.d.ts:107-120` and `tsconfig.json:8` | patch: remove the `bootstrap` namespace block from `globals.d.ts`; remove `skipLibCheck:true` from `tsconfig.json` |
| B | `tsconfig.json` line 9: `noEmitOnError:true` not in plan spec | false | Beneficial addition; plan lists `strict:true` etc. but does not say "only these options." `noEmitOnError` strengthens the build and hides nothing. No defect. | reject |
| C | `src/js/common.ts` line ~118: `$.extend({timeZone:TZ},options)` replaced with `{timeZone:TZ,...options}` | low | Original `common.js:114` uses `$.extend`; compiled output uses spread. Semantically equivalent for valid `Intl.DateTimeFormatOptions` values, but the plan constraint "functionally identical compiled output" is explicit. Fix is one line. | patch |
| D | `src/js/app.ts` line 134: `if (!events) return` null guard absent in original | false | Original `app.js:6` initialises `let events = null` — `openReservation` could throw in JS, but TypeScript `strict:true` mandates the null check. Cards only render once events loads, so this state is unreachable in the UI; no observable behavior change. | reject |
| E | `src/js/admin.ts` lines 39–42: `body !== undefined` vs `body ?` truthiness check | low | Behavioral difference only for falsy non-undefined values (`null`, `0`, `''`). All call sites pass either `undefined` (no body) or a real object — confirmed by reading `admin.ts:190-199`. Never triggered. | reject |
| F | `src/js/app.ts` line 1: `ClassEvent` instead of plan-specified `Event` | false | Using `Event` in a DOM lib context would collide with the built-in `Event` interface (`TS2300`). `ClassEvent` is the only valid choice. Correct deviation from the plan's oversight. | reject |

## Design Notes

**Why plain `tsc`, no bundler:** The Cloudflare Pages setup serves `public/` directly with no existing build pipeline. Introducing a bundler would require restructuring asset paths and possibly the Functions setup. `tsc` alone adds type safety with zero architectural change.

**IIFE globals via Window augmentation:** `globals.d.ts` uses `interface Window { I18n: I18nModule }` ambient declarations so TypeScript resolves window globals without imports in any `.ts` file. This matches the browser runtime behavior exactly.

**Compiled JS in `.gitignore`:** Treating `public/js/*.js` as build artifacts is the clean choice for a project with a build command. The `[build]` section in `wrangler.toml` ensures Cloudflare Pages regenerates them at deploy time.

## Verification

**Commands:**
- `npm install` -- expected: installs `typescript`, `@types/jquery`, `@types/bootstrap` without errors
- `npm run build` -- expected: exits 0, emits `public/js/config.js`, `common.js`, `i18n.js`, `app.js`, `admin.js`
- `npm run dev` -- expected: builds, then dev server starts at `http://localhost:8788`

**Manual checks:**
- `http://localhost:8788`: page loads, events list renders, language switcher toggles EN/BG, booking modal opens
- `http://localhost:8788/admin`: login succeeds, events table renders, create/edit/delete class works, remove signup works
