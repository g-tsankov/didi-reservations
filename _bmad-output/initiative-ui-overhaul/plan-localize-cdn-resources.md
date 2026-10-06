---
title: 'Add Vite Bundler — Replace CDN Dependencies with npm Packages'
type: 'chore'
ticket: ''
created: '2026-10-06'
status: 'built'
baseline_revision: 'f87215b4c8c1b8ce4cec61b94c9f3cb69f3dc940'
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

**Problem:** Bootstrap, Bootstrap Icons, jQuery, and Cormorant Garamond are loaded from remote CDNs at runtime. The project has no bundler — `tsc` only transpiles TypeScript; the `public/` folder is served as-is with no npm packages reaching the browser.

**Approach:** Add Vite as the bundler. Install the runtime libraries (`bootstrap`, `bootstrap-icons`, `jquery`, `@fontsource/cormorant-garamond`) as npm packages. Create per-page entry files that import CSS dependencies and the existing page scripts in order. Update both HTML pages to reference the entry files instead of CDN links and individual scripts. Output goes to `dist/`; update `wrangler.toml` accordingly.

## Boundaries & Constraints

**Always:**
- The existing `src/js/*.ts` files (config, i18n, common, app, admin) must not be modified — they use jQuery and Bootstrap as implicit globals, and the bundler must supply those globals rather than requiring import-statement changes.
- The script load order within each page must be preserved: config → i18n → common → app/admin.
- Cloudflare-specific static files (`public/_headers`) must reach `dist/` unchanged.

**Never:**
- Do not convert the existing TS files to ES module style (no `import $ from 'jquery'` etc. in source files).
- Do not add a separate dev server in front of wrangler; keep the existing `npm run dev` pattern (build then `wrangler pages dev`).

**Decision — Entry file path in HTML:** Entry files live in `public/js/` (`public/js/entry-main.ts`, `public/js/entry-admin.ts`). The Vite config adds a `resolve.alias` mapping `@src` → `src/js/` so entry files import logic as `@src/config`, `@src/i18n`, etc. HTML uses `<script type="module" src="/js/entry-main.ts">`.

</frozen-after-approval>

## Code Map

- `public/index.html` lines 7–11, 128–133 — five CDN links + four script tags to replace
- `public/admin/index.html` lines 8–9, 165–170 — four CDN links + four script tags to replace
- `src/js/config.ts`, `i18n.ts`, `common.ts`, `app.ts`, `admin.ts` — IIFE/global style; `common.ts` uses `$` (jQuery); `app.ts` and `admin.ts` use both `$` and `bootstrap`; **do not modify**
- `src/js/globals.d.ts` — type-only; no change needed
- `tsconfig.json` — currently drives `tsc` build; must switch to type-check-only (`noEmit: true`) after Vite takes over compilation
- `wrangler.toml` line 3 — `pages_build_output_dir = "./public"` → change to `"./dist"`
- `package.json` — `"build": "tsc"` and `"dev": "npm run build && wrangler pages dev"` must be updated; new deps added
- `.gitignore` — `public/js/*.js` entry should be replaced with `dist/`

## Tasks & Acceptance

**Execution:**
- [ ] `package.json` — add runtime deps (`bootstrap`, `bootstrap-icons`, `jquery`, `@fontsource/cormorant-garamond`) and devDeps (`vite`, `@rollup/plugin-inject`); update `"build"` to `"vite build"`, `"dev"` to `"vite build && wrangler pages dev dist"`, add `"typecheck": "tsc --noEmit"`
- [ ] `vite.config.ts` (new) — MPA config: root `public/`, `publicDir` set to copy `_headers`; `build.outDir: '../dist'`; `resolve.alias` mapping `@src` → `<project-root>/src/js`; `@rollup/plugin-inject` plugin providing `$` and `jQuery` from `jquery`; Bootstrap exposed as `bootstrap` global using the same mechanism; `rollupOptions.input` listing both HTML entry points
- [ ] `tsconfig.json` — set `"noEmit": true`, `"moduleResolution": "bundler"`, remove `"outDir"` (Vite owns output)
- [ ] `wrangler.toml` — change `pages_build_output_dir` to `"./dist"`
- [ ] `.gitignore` — replace `public/js/*.js` with `dist/`
- [ ] `public/js/entry-main.ts` (new) — imports Bootstrap CSS, Bootstrap Icons CSS, Cormorant Garamond (400 + 500 weights) from their npm packages; then side-effect imports of `@src/config`, `@src/i18n`, `@src/common`, `@src/app` in that order
- [ ] `public/js/entry-admin.ts` (new) — same CSS imports (no Cormorant Garamond); then side-effect imports of `@src/config`, `@src/i18n`, `@src/common`, `@src/admin`
- [ ] `public/index.html` — remove all CDN `<link>` and `<link rel="preconnect">` tags (lines 7–11); remove the four `<script src="/js/...">` tags (lines 128–133); add `<script type="module" src="/js/entry-main.ts"></script>`
- [ ] `public/admin/index.html` — remove CDN links (lines 8–9) and four script tags (lines 165–170); add `<script type="module" src="/js/entry-admin.ts"></script>`

**Acceptance Criteria:**
- Given the project is built with `npm run build`, when `wrangler pages dev dist` serves the site, then `http://localhost:8788` loads with Bootstrap styles, icons, and Cormorant Garamond rendered correctly and the browser Network tab shows zero requests to cdn.jsdelivr.net, code.jquery.com, or fonts.googleapis.com.
- Given `http://localhost:8788/admin/` is opened, when the page loads, then Bootstrap styles and icons render correctly with no CDN requests.
- Given `npm run typecheck` is run, then it exits 0 with no type errors.
- Given `npm run build` is run, then it exits 0 and produces a `dist/` directory containing `index.html`, `admin/index.html`, and the bundled assets.

## Implementation Notes

## Plan Change Log

## Review Triage Log

| # | Location | Claim | Verdict | Evidence | Route |
|---|----------|-------|---------|----------|-------|
| 1 | `public/js/{admin,app,common,config,i18n}.js` | Stale tsc build outputs now untracked (reviewer said "committed", actually untracked) — will confuse developers and could be accidentally staged | `medium` | Confirmed: `git ls-files --others` lists all five. `.gitignore` was changed from `public/js/*.js` to `dist/` but the old files were not deleted. Vite reads from `src/js/*.ts` via entry files; these `.js` files serve no purpose. | patch |
| 2 | `AGENTS.md` | Paths `public/js/config.js` and `public/js/i18n.js` listed as canonical editable files are now stale — Vite builds from `src/js/*.ts` | `medium` | True, but fix requires editing AGENTS.md (agent-context file). Also partially pre-existing: AGENTS.md always pointed to compiled output, not source TypeScript. | defer |
| 3 | `vite.config.ts` `publicDir: false` | Diverges from plan's "publicDir set to copy _headers"; could silently drop standalone static assets | `false` | `public/` has no standalone assets not reachable from HTML: `style.css` is linked from both HTML pages, `_headers` is copied by the custom plugin (confirmed in `dist/`), stale `.js` files are addressed by finding 1. Current project structure has no files that would be dropped. | reject |
| 4 | `vite.config.ts` `@rollup/plugin-inject` | Plugin may fail silently under rolldown (Vite 8), breaking `$`/`jQuery`/`bootstrap` globals on every page | `maybe-false` | Build exited 0 with 75 modules transformed and proper JS output; PREFER_BUILTIN_FEATURE warning is advisory. Cannot confirm globals work without browser test. If broken, all interactive features fail (high). | defer |
| 5 | `vite.config.ts` `include: ['**/*.ts','**/*.js']` | Missing explicit exclude may cause inject plugin to process node_modules, producing spurious imports | `false` | `@rollup/pluginutils` createFilter defaults to excluding node_modules when no exclude is given. Build succeeded with no circular import errors or malformed output. | reject |

## Design Notes

**Why `@rollup/plugin-inject` instead of adding imports to existing TS files:**
The codebase is uniformly IIFE/global style — converting six files to ES module imports is a separate refactor that changes runtime semantics and increases diff size significantly. The inject plugin is the standard Vite solution for migrating legacy jQuery code; it auto-inserts `import $ from 'jquery'` at the top of any module that references `$`, so the TS sources remain untouched while the bundler provides the correct module.

**Bootstrap as a global (`bootstrap.Modal` etc.):**
Bootstrap's npm package exports named components (`Modal`, `Toast`, …), not a default `bootstrap` namespace. The inject plugin can map `bootstrap` → `import * as bootstrap from 'bootstrap'`, which reconstructs the namespace that `app.ts` and `admin.ts` expect.

## Verification

**Commands:**
- `npm run build` — expected: exits 0, `dist/` produced
- `npm run typecheck` — expected: exits 0, no errors

**Manual checks:**
- Open `http://localhost:8788` in a browser with DevTools Network tab open — no requests to cdn.jsdelivr.net, code.jquery.com, or fonts.googleapis.com; styles, icons, and Cormorant Garamond font load correctly.
- Open `http://localhost:8788/admin/` — same check; Bootstrap and icons load from local bundle.
