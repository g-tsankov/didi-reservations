---
title: 'Velvet Night Theme — Public Frontend'
type: 'feature'
ticket: ''
created: '2026-10-06'
status: 'built'
baseline_revision: '3561082'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 1
context:
  - '_bmad-output/initiative-es6-migration/ux-feminine-frontend/DESIGN.md'
  - '_bmad-output/initiative-es6-migration/ux-feminine-frontend/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The public site uses a light Bootstrap theme with an orange brand color. It is missing the Velvet Night visual identity, several structural HTML elements (sticky nav with studio name, hero CTA, studio blurb belt, dismiss button in success state), and the accessibility and loading-state behaviors specified in the UX design.

**Approach:** Replace `style.css` with a full Velvet Night token + component stylesheet; update `index.html` with the missing structural elements and ARIA attributes; add new i18n keys; update `app.js` with skeleton loading, unavailable card footer labels, aria attributes, and success-state dismiss wiring.

## Boundaries & Constraints

**Always:**
- All colors via semantic CSS custom properties on `:root` — token names exactly as in `DESIGN.md` frontmatter (`--surface-base`, `--ink-primary`, `--accent`, etc.). Never hard-code hex in component rules.
- CSS component rules must reference only custom properties so a future `[data-theme="rosy-bold"]` `:root` override costs nothing — no hex in component rules, no theme-specific class names on elements.
- Cormorant Garamond (Google Fonts) used only for `.display`, `.headline-lg`, `.headline-sm` roles; never for body, labels, or form elements.
- All copy in `i18n.js`; no text hard-coded in HTML or JS.
- Bootstrap grid structure (`#events`, `row-cols-*`) and all form field IDs (`#r-name`, `#r-email`, `#r-phone`) stay unchanged.
- Admin files (`public/admin/`) are out of scope.

**Never:**
- Add backend or API changes.
- Add accounts, sessions, email, or authentication.
- Hard-code hex values in component CSS rules.
- Remove or rename existing i18n keys (only add new ones).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Events loading | `events === null` | Skeleton grid: 3 pulsing card-shaped placeholders (mobile), 6 (desktop) | — |
| Events empty | `events.length === 0` | Centered body-lg message in `--ink-secondary`; no illustration | — |
| Card bookable | `spotsLeft > 0 && bookingOpen` | Full opacity, hover: `translateY(-3px)` + warm glow, `role="button"`, `tabindex="0"` | — |
| Card full | `spotsLeft === 0` | Opacity 0.5, `aria-disabled="true"`, footer shows "Местата са изчерпани" label, not clickable | — |
| Card past/in-progress | `!bookingOpen` | Opacity 0.5, `aria-disabled="true"`, footer shows "Приключил" label, not clickable | — |
| Booking success | Form `.done()` | Form replaced by confirmation + "Затвори" dismiss button; focus returns to triggering card on any modal close | — |
| Booking error | Form `.fail()` | Error banner above submit with `--error-surface` background; form stays editable | — |
| Reduced motion | `prefers-reduced-motion: reduce` | Skeleton pulse and card `translateY` both suppressed | — |

</frozen-after-approval>

## Code Map

- `public/css/style.css` — current light theme (135 lines); full replacement target
- `public/index.html` — 104-line single-page shell; `.topbar` → `<nav>`, hero additions, blurb belt, dismiss button
- `public/js/i18n.js` — `window.TRANSLATIONS` EN+BG; add 6 keys
- `public/js/app.js` — `AppPage` class (171 lines); `renderEvents()` loading branch, `buildCard()`, `openReservation()`, success `.done()` handler

Key symbols:
- `AppPage.renderEvents()` `:127` — loading branch shows spinner, replace with skeleton cards
- `AppPage.buildCard()` `:104` — card DOM builder; add unavailable footer label
- `AppPage.openReservation()` `:153` — stores `this.current`; also store `this._triggerEl` for focus return
- `AppPage` constructor success `.done()` block `:48` — wire dismiss button click → `modal.hide()` + focus return
- `#reserveModal` `shown.bs.modal` handler `:25` — autofocus name; focus trap is Bootstrap 5 native

Do not change: `AppPage.setBusy()`, `AppPage.renderModalEvent()`, `AppPage.loadEvents()`, Bootstrap grid classes on `#events`, all admin JS/HTML.

## Tasks & Acceptance

**Execution:**
- [x] `public/css/style.css` — Full replacement: Velvet Night `:root` token set (18 tokens from `DESIGN.md` frontmatter); sticky nav; hero with radial glow pseudo-element; event card with accent top stripe + warm glow shadow; booking modal three-zone layout; spots badge; skeleton card pulse animation; responsive breakpoints (mobile/tablet/desktop); focus ring using `--accent` at 35% opacity; reduced-motion overrides; add commented `[data-theme="rosy-bold"] { /* Rosy Bold token overrides go here */ }` stub at file end as the future-theme extension point
- [x] `public/index.html` — Convert `.topbar` to `<nav class="site-nav">` (sticky, studio name `<span class="nav-brand">` left, lang switcher right, remove address row); add Google Fonts `<link>` for Cormorant Garamond; add hero CTA `<a href="#events" class="btn btn-primary" data-i18n="heroCta">` inside `.hero .container`; change hero `<p>` key from `heroSubtitle` to `heroTagline`; add `<section id="studio-blurb">` between `</header>` and `<main>`; add dismiss `<button class="btn btn-primary w-100 mt-3" id="reserve-dismiss" data-i18n="close">` inside `#reserve-success`; **OUTSTANDING:** add `aria-label` attr to lang-switch container (set by i18n key `langSwitcherLabel`)
- [x] `public/js/i18n.js` — Add keys EN+BG: `heroTagline` ("Discover the power within you." / "Открий силата в себе си."), `heroCta` ("Browse classes" / "Разгледай часовете"), `studioBlurb` ("Pole dance studio for every level — beginner to advanced. Find your strength, express yourself." / "Студио за поул танц за всяко ниво. Намери своята сила, изрази себе си."), `langSwitcherLabel` ("Language" / "Избор на език"), `fullLabel` ("Full" / "Местата са изчерпани"), `pastClass` ("Past" / "Приключил"); do not modify the existing `full` key (it drives the status badge, which keeps its shorter text)
- [x] `public/js/app.js` — `renderEvents()`: replace spinner branch with skeleton cards (`.skeleton-card` divs, count: 3 always — desktop count via CSS grid, not JS); `buildCard()`: add `.card-footer` for unavailable cards using `fullLabel` key when `statusOf(ev) === 'full'`, else `pastClass` when `statusOf(ev) === 'inProgress'` — always branch on `statusOf(ev)`, never on `ev.spotsLeft` directly to avoid misclassifying past events with 0 spots; `buildCard()`: on the spots badge element set `aria-label` to `spotsText(n)` (matches the visible text exactly, including the n=1 singular form from `spotsLeftOne`); `openReservation()`: capture `this._triggerEl = document.activeElement` before `this.modal.show()`, then register a one-time `hidden.bs.modal` handler via `.one()` that calls `$(this._triggerEl).trigger('focus')` — this covers ALL modal closes (ESC, ×, backdrop, dismiss button); constructor success `.done()` handler: after showing `#reserve-success` wire one-time click on `#reserve-dismiss` → `this.modal.hide()` (focus return is already handled by the `hidden.bs.modal` handler above); `renderStatic()` or `I18n.onChange`: set `aria-current="true"` on active lang button, remove from inactive; set `aria-label` on `.lang-switch` container using `langSwitcherLabel` key; remove dead `$('#address')` reference in `renderStatic()`

**Acceptance Criteria:**
- Given a fresh page load, when events are loading, then 3 pulsing skeleton card placeholders appear in the grid (not a spinner)
- Given a bookable event card, when hovered with pointer or focused with keyboard, then the card lifts (`translateY(-3px)`) and shows a warm rose-gold glow shadow
- Given an unavailable card (full or past), when rendered, then its opacity is 0.5, it has `aria-disabled="true"`, its footer shows the correct unavailability label, and it does not respond to click or keyboard
- Given a successful booking, when the success alert appears, then a "Затвори" button is visible inside it; clicking it closes the modal and returns focus to the card that opened it
- Given any page state, when viewed at 375px width, then the layout is a single column with 16px horizontal gutters and no horizontal scroll
- Given a user with `prefers-reduced-motion: reduce`, when the page loads or hovers a card, then no skeleton pulse animation and no card translateY transform occur
- Given the language switcher, when BG is active, then the BG button has `aria-current="true"` and the container has `aria-label` matching the `langSwitcherLabel` key
- Given the hero section, when viewed, then the studio name is in Cormorant Garamond and the CTA button "Разгледай часовете" / "Browse classes" smooth-scrolls to `#events`

## Implementation Notes

`heroSubtitle` key is intentionally orphaned after the hero `<p>` switches to `heroTagline` — do not add a new reference to it.

## Review Triage Log

| # | Location | Verdict | Evidence | Route |
|---|---|---|---|---|
| 1 | `public/js/app.js` `buildCard()`:126 | false | Superseded: review loop 1 confirmed card-footer is entirely absent, not just a wrong condition. | rejected |
| 2 | `public/js/app.js` `buildCard()`:115 | false | Superseded: review loop 1 confirmed aria-label is entirely absent, not just an n=1 mismatch. | rejected |
| 3 | `public/js/app.js` `renderStatic()`:80 | low | carried — `$('#address').text(cfg.address)` targets a removed element; app.js unchanged, dead reference still present. | patch |
| 4 | `public/css/style.css` `.hero` | false | Fixed: current code uses `padding: 5rem 0` = 80px top and bottom, meeting DESIGN.md 80px minimum. | rejected |
| 5 | `public/css/style.css` `.modal-title` | false | Fixed: `font-family: 'Cormorant Garamond', Georgia, serif` present in current diff. | rejected |
| 6 | `public/js/i18n.js` | high | All 6 required keys absent (heroTagline, heroCta, studioBlurb, langSwitcherLabel, fullLabel, pastClass); index.html already references heroTagline, heroCta, studioBlurb via data-i18n — those elements render empty at runtime. Plan task 3 entirely not executed. | bad_plan |
| 7 | `public/js/app.js` `renderEvents()`:126 | high | Spinner not replaced with skeleton cards; app.js unchanged from baseline; skeleton CSS exists but JS never creates `.skeleton-card` divs; AC "3 pulsing skeleton card placeholders" unmet. | bad_plan |
| 8 | `public/js/app.js` `buildCard()`:114 | high | No `.card-footer` for unavailable cards; app.js unchanged; AC "footer shows correct unavailability label" unmet. | bad_plan |
| 9 | `public/js/app.js` `statusBadge()`:93 | medium | aria-label absent on spots badge; app.js unchanged; EXPERIENCE.md accessibility floor unmet. Plan also had internal inconsistency (`I18n.t('spotsLeft',{n})` mismatches visible `spotsLeftOne` for n=1); fix is `spotsText(n)` — now corrected in task text. | bad_plan |
| 10 | `public/js/app.js` `openReservation()`:153 | high | No `_triggerEl` capture or `hidden.bs.modal` handler; app.js unchanged; AC "focus returns to the card" unmet. | bad_plan |
| 11 | `public/js/app.js` `.done()`:48 | high | Dismiss button click not wired; app.js unchanged; clicking "Затвори" has no effect; AC "clicking it closes the modal" unmet. | bad_plan |
| 12 | `public/js/app.js` `renderStatic()` | high | aria-current not set on active lang button; `aria-label` not set on `.lang-switch`; app.js unchanged; AC "BG button has aria-current='true'" unmet. | bad_plan |
| 13 | `public/index.html`:19 | medium | `.lang-switch` div missing `aria-label` attribute; plan task 2 specified it; partially missed. | bad_plan |
| 14 | `public/css/style.css` `.event-summary` | medium | CONFIRMED: `background: var(--surface-base)` (#180f1e) sits inside `.modal-content` which uses `--surface-overlay` (#2e1836); elevation inverted. DESIGN.md line 204 specifies `{colors.surface-overlay}` for the class summary inset. Fix: change to `var(--surface-overlay)`. | patch |
| 15 | `public/css/style.css`:86 | medium | CONFIRMED: `outline: 2px solid var(--accent)` on `.event-card.is-bookable:focus-visible` is dead code — overridden by `outline: none` in the equal-specificity combined hover/focus rule at line 251-255 (same 0,3,0 specificity, later position). EXPERIENCE.md requires outline + box-shadow for all interactive elements; cards receive box-shadow only. Fix: remove `outline: none` from the combined rule. | patch |

## Plan Change Log

**Review loop 1 (2026-10-06):** Loopback triggered by bad_plan. Findings: plan tasks 3 (i18n.js) and 4 (app.js) were entirely skipped in the implementation; task 2 (index.html) missed one item (aria-label on `.lang-switch`). Root cause: implementation was partial — only CSS and HTML structural changes were applied. Amended: task 2 now explicitly marks the aria-label item as outstanding; task 4 corrected the spots badge aria-label instruction from `I18n.t('spotsLeft', { n })` to `spotsText(n)` (matches visible text including n=1 singular form); task 4 corrected the unavailability footer to branch on `statusOf(ev)` not `ev.spotsLeft`; task 4 adds removal of dead `$('#address')` reference. KEEP: all style.css and index.html changes from the first implementation pass are correct — Velvet Night token set, sticky nav, hero CTA, studio blurb section, dismiss button, Cormorant Garamond, all padding values. Known-bad state avoided: using `I18n.t('spotsLeft',{n})` as aria-label (mismatches visible singular form for n=1).

## Design Notes

**Token application:** `DESIGN.md` frontmatter is the authoritative token map. CSS custom properties go on `:root` with the exact names: `--surface-base`, `--surface-raised`, `--surface-overlay`, `--ink-primary`, `--ink-secondary`, `--ink-disabled`, `--accent`, `--accent-hover`, `--accent-on`, `--border-subtle`, `--border-accent`, `--success`, `--success-surface`, `--error`, `--error-surface`. Bootstrap overrides (`--bs-body-bg`, `--bs-body-color`, `--bs-primary`) must be set in `:root` to flow into Bootstrap components.

**Skeleton cards:** 3 `.skeleton-card` divs (always — the grid's `row-cols-*` classes handle column count). Each skeleton mirrors the card shape: `border-radius: var(--rounded-lg)`, `background: var(--surface-raised)`, a `--accent`-colored stripe at top, and a pulsing opacity animation. Suppress with `prefers-reduced-motion`.

**Accent top stripe:** The event card's accent stripe is `::before` pseudo-element: `position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent); border-radius: var(--rounded-lg) var(--rounded-lg) 0 0`. Card needs `position: relative; overflow: hidden`.

**Focus return:** `#reserveModal` fires `hidden.bs.modal` after hide animation completes. Register the focus-return handler *once per open* (inside `openReservation`) with `.one()`, not in the constructor, so stale refs don't accumulate.

## Verification

**Commands:**
- `npm run dev` -- expected: dev server starts at http://localhost:8788 with no console errors

**Manual checks:**
- Home page: dark surface (#180f1e background), Cormorant Garamond studio name, rose-gold accent buttons visible
- Class grid at 375px: single column, 16px gutters, no horizontal scroll
- Hover a bookable card: lift + warm glow animation visible
- Keyboard Tab to a bookable card, press Enter: modal opens, name field autofocused
- Submit booking: success state shows "Затвори" button; click it — modal closes, focus returns to the card
- Disable JS skeleton: events = null → skeleton cards, not spinner
- Language switch: BG/EN toggle instant; active button has visible active style
