---
title: 'Migrate browser JS to ES6 syntax'
type: 'refactor'
ticket: ''
created: '2026-10-05'
status: 'built'
baseline_revision: 'a42cebc360ccac1e41cdf37182c28f7957f01c30'
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

**Problem:** The three browser-side JS files (`public/js/common.js`, `public/js/app.js`, `public/js/admin.js`) use pre-ES6 patterns — `function` expression callbacks, string concatenation, and verbose object-property syntax — while the rest of the codebase (`lib/`, `functions/`) is already written in modern ES6+.

**Approach:** Replace anonymous `function()` callbacks with arrow functions where `this` is not captured, convert string concatenation to template literals, and use object-shorthand property syntax. Keep the IIFE module pattern in `common.js` — converting to ES modules requires a bundler and `type="module"` HTML changes, which is out of scope.

</frozen-after-approval>

## Implementation Notes

Oneshot: all changes are mechanical syntax substitutions across 3 files with no logic, API, or HTML changes. Arrow function substitution is safe wherever `this` is not used inside the callback; jQuery `.each(function(){})` callbacks that reference `$(this)` must keep `function` form.

Files changed: `public/js/common.js`, `public/js/app.js`, `public/js/admin.js`.

- Arrow functions applied to all callbacks where `this` is not captured. Kept `function` on: jQuery `.each()` with `$(this)` (common.js), `$(document).on('click', '.lang-switch [data-lang]', ...)` (common.js), `$('#events').on('click', '.is-bookable', ...)` and `$('#events').on('keydown', '.is-bookable', ...)` (app.js — both use `$(this)`), `$('#reserve-form').on('submit', ...)` in app.js (uses `const form = this`), `$('#event-form').on('submit', ...)`, `$('#signups-body').on('click', '.remove-signup', ...)`, `$('#filter').on('click', '[data-filter]', ...)`, and `$('#events-body').on('click', 'tr', ...)` in admin.js (all use `$(this)`).
- Template literals applied to all string concatenation: URL construction, display strings, i18n key lookups (`'err.' + code`), datetime formatting.
- Object shorthand applied to both IIFE return objects in `common.js` and the `startsAt` property in `admin.js`'s event body.
- `window.icon` converted to arrow with implicit return.
- Outer jQuery ready callbacks `$(function(){})` converted to `$(() => {})` in both `app.js` and `admin.js`.

## Plan Change Log

## Review Triage Log

- `low` → patched: Implementation Notes listed only 6 of 9 `function`-preserved handlers. Three omitted (`#events click/keydown .is-bookable` in app.js, `document click .lang-switch` in common.js) all correctly use `$(this)` — code was right, notes were incomplete. Added all three to the recorded rationale.

## Verification

**Manual checks:**
- `npm run dev` — dev server starts without errors.
- Open `http://localhost:8788`: page loads, language switcher toggles EN/BG correctly, events display with correct Sofia-time formatting.
- Open `http://localhost:8788/admin`: login page renders, admin events list shows with correct dates and time ranges.
