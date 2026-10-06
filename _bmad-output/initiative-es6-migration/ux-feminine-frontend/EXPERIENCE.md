---
name: Didi Classes
status: final
updated: 2026-10-06
---

# Didi Classes — Experience Spine

## Foundation

Single-surface responsive web. Bootstrap 5 + jQuery. No named component library — Bootstrap 5 with custom CSS overrides mapped to Velvet Night design tokens. `DESIGN.md` is the visual identity reference; this spine is the experience.

The primary surface is a mobile phone — booked in the studio lobby, on the commute, between classes. Everything must work and feel deliberate at 375px. The public site is read-only for visitors; booking requires no account. The admin panel (`/admin`) is out of scope for this design run.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Home | Direct URL | Hero, studio blurb, class grid, contact footer |
| Booking modal | Card "Запази място" CTA | Reserve a spot (name, email, phone) |
| Contact footer | Always at bottom of Home | Studio contact details |
| Admin | `/admin` URL | Out of scope |

The home page is a single vertical scroll. No multi-page navigation. The booking modal is the only focus interruption on the public site.

→ Composition reference: `mockups/home.html`. Spine wins on conflict.

## Voice and Tone

Microcopy. Brand voice and aesthetic posture live in `DESIGN.md`.

Primary language: Bulgarian (BG). English toggle available via nav. All keys defined in `public/js/i18n.js`.

| Do | Don't |
|---|---|
| "Намери своя час." | "Book now! Don't miss out!" |
| "3 места" | "Only 3 spots left! Hurry!" |
| "Местата са изчерпани." | Red alarming treatment or "FULL 😞" |
| "Резервацията ви е потвърдена." | "Successfully booked! ✓ You're all set!" |
| "Невалидно телефонно число." | "Error: phone field validation failed" |
| Short, complete, warm. | Exclamation marks, emoji in state messages, urgency language. |

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| Nav bar | Top of every view | Studio name (non-interactive). Language switcher: instant client-side switch via `i18n.js`, no page reload. Sticky on scroll. |
| Hero | Home | "Разгледай часовете" CTA scrolls smoothly to `#events` anchor. No other interactivity. |
| Studio blurb | Between hero and class grid | Static, non-interactive. |
| Event card | Class grid | Bookable: entire card is the tap/click target — opens booking modal. Unavailable: `aria-disabled="true"`, no pointer, no tap response. Keyboard: `role="button"` + `tabindex="0"` on bookable only; visible focus ring. |
| Booking modal | Over class grid | Opens centered with backdrop. Closes on: ESC key, × button, backdrop click. Autofocus: name field on open. Focus trapped inside while open. |
| Spots badge | Inside event card | Shows "N места" when N ≥ 1. Hidden at zero — card enters unavailable state. |
| Contact footer | Bottom of Home | Email: `<a href="mailto:…">`. Phone: `<a href="tel:…">`. Static, no interactivity beyond native links. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Events loading | Class grid | Skeleton cards (3 on mobile, 6 on desktop): card shape + accent stripe, pulsing opacity animation. |
| Events empty | Class grid | Centered `body-lg` message in `{colors.ink-secondary}`: "Няма предстоящи часове. Провери скоро." No illustration, no action button. |
| Card bookable | Event card | Full opacity. Cursor pointer. Hover glow per `{components.event-card.hover-box-shadow}`. `translateY(-3px)` on hover. |
| Card full (0 spots) | Event card | Opacity 0.5. "Местата са изчерпани" label in `{typography.label}` replaces the CTA. Not clickable, not focusable. |
| Card past | Event card | Opacity 0.5. "Приключил" label. Not clickable, not focusable. |
| Booking form | Modal | Default. Name field autofocused. Submit enabled when all three fields are non-empty (client pre-check; server re-validates). |
| Booking submitting | Modal | Submit button shows spinner, disabled. Fields read-only. |
| Booking success | Modal | Form replaced by: class summary (still visible) + confirmation message "Резервацията ви е потвърдена." + "Затвори" dismiss CTA. No page reload. |
| Booking error | Modal | `{colors.error-surface}` banner above submit button. Message text resolved from API error code via `i18n.js`. Form remains editable; user can correct and resubmit. |

## Interaction Primitives

- **Tap/click to book.** The whole event card is the tap target on mobile — no small link to miss.
- **Smooth scroll.** Hero CTA and any "Разгледай часовете" anchor use `scroll-behavior: smooth` to reach `#events`.
- **Modal close.** ESC key, × button, and backdrop click all close the modal (Bootstrap 5 default behavior).
- **Language switch.** Instant, client-side, no reload. `i18n.js` updates all `data-i18n` elements in place.
- **Banned:** carousels, sticky CTAs that overlap content, confirmation dialogs on modal close, form auto-submit on blur, scroll-jacking.

## Accessibility Floor

Behavioral. Visual contrast lives in `DESIGN.md`.

- WCAG 2.2 AA. Ink Primary (`#f0e8e0`) on Surface Base (`#180f1e`): 12.6:1. Accent (`#c49a8a`) on Surface Base: 4.8:1 — passes AA for large text and UI components.
- All interactive elements have a visible focus ring: Bootstrap 5 default `outline` + `box-shadow` using `{colors.accent}` at 35% opacity.
- Bookable event cards: `role="button"` + `tabindex="0"`. Unavailable cards: `aria-disabled="true"`, omit `tabindex`.
- Booking modal: `aria-modal="true"`, `aria-labelledby` pointing to the modal title `h2`. Focus trapped while open; returns to the triggering card on close.
- All form fields: explicit `<label for>` wiring (existing markup already has this).
- Spots badge: `aria-label="N свободни места"` (not just "N места", which lacks context for screen readers).
- Language switcher: `aria-label="Избор на език"` on the container; `aria-current="true"` on the active language button.
- Reduce Motion: skeleton pulse animation and card `translateY` hover transform both suppressed under `prefers-reduced-motion: reduce`.

## Responsive & Platform

| Breakpoint | Class grid | Hero min-height |
|---|---|---|
| `< 768px` (mobile) | 1 column | 60vh |
| `768–1023px` (tablet) | 2 columns | 70vh |
| `≥ 1024px` (desktop) | 3 columns | 85vh |

Nav stays below 48px tall at all breakpoints. Studio name truncates (CSS `text-overflow: ellipsis`) if needed on very small screens; language switcher never wraps to a second line.

Booking modal: `max-width: 480px` centered on tablet+; full-width with 16px gutters on mobile. Modal max-height `90vh` with internal scroll on the form area if the keyboard pushes content.

## Key Flows

### Flow 1 — First visit (Надя, 26, curious about poledance, tapping a studio Instagram link)

1. Надя taps a link from an Instagram story.
2. Home loads on her phone. The dark hero fills the screen — the studio name in rose gold serif, the tagline "Открий силата в себе си." confirm she's in the right place.
3. She taps "Разгледай часовете"; the page scrolls smoothly to the class grid.
4. She sees three upcoming Pole Dance — Ниво 1 cards. The first shows "3 места". She taps it.
5. The booking modal opens. The class summary at the top confirms she tapped the right one.
6. She fills in name, email, phone in under 30 seconds and taps "Потвърди резервацията".
7. **Climax:** The form fades. "Резервацията ви е потвърдена." in warm serif. The studio name holds in the modal header — the brand is present through the entire transaction. Надя screenshots it and sends it to her friend.

Failure: her phone autocomplete fills a malformed phone number → server returns `invalid_phone` → error banner reads "Невалидно телефонно число." → she corrects only the phone field and resubmits; name and email are preserved.

### Flow 2 — Returning student (Ивет, 31, books every Tuesday)

1. Ивет opens the site from browser history.
2. She scrolls past the hero — she already knows the studio.
3. She scans the class grid for Tuesday's 20:00 slot and taps it.
4. The modal opens. She enters her details (no stored session state — no account to maintain).
5. Submit → success.
6. **Climax:** The whole flow takes under 45 seconds. The modal closes; she's back at the class grid. No account to manage, no email to verify, no friction. The dark, quiet surface stays out of her way.
