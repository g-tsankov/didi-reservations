---
name: Didi Classes
description: Poledance studio class reservation system. Glamorous/Luxe dark theme (Velvet Night) with semantic CSS custom-property tokens for future theme switching.
status: final
updated: 2026-10-06
colors:
  surface-base: '#180f1e'
  surface-raised: '#241228'
  surface-overlay: '#2e1836'
  ink-primary: '#f0e8e0'
  ink-secondary: '#c49a8a'
  ink-disabled: '#5e4855'
  accent: '#c49a8a'
  accent-hover: '#d4b896'
  accent-on: '#180f1e'
  border-subtle: 'rgba(196, 154, 138, 0.15)'
  border-accent: 'rgba(196, 154, 138, 0.40)'
  success: '#6dbf9c'
  success-surface: 'rgba(109, 191, 156, 0.12)'
  error: '#e07070'
  error-surface: 'rgba(224, 112, 112, 0.12)'
typography:
  display:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: 56px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: '-0.02em'
  display-mobile:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: 36px
    fontWeight: '400'
    lineHeight: '1.15'
    letterSpacing: '-0.01em'
  headline-lg:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: 22px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: 'system-ui, -apple-system, sans-serif'
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.65'
  body-md:
    fontFamily: 'system-ui, -apple-system, sans-serif'
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
  label:
    fontFamily: 'system-ui, -apple-system, sans-serif'
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0.1em'
  caption:
    fontFamily: 'system-ui, -apple-system, sans-serif'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
  '8': 64px
  '9': 96px
components:
  nav:
    background: '{colors.surface-base}'
    border-bottom: '1px solid {colors.border-subtle}'
  hero:
    background: '{colors.surface-base}'
    glow-overlay: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(196,154,138,0.18) 0%, transparent 70%)'
    heading-color: '{colors.ink-primary}'
    tagline-color: '{colors.ink-secondary}'
  event-card:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-subtle}'
    border-radius: '{rounded.lg}'
    accent-stripe-color: '{colors.accent}'
    accent-stripe-height: 3px
    box-shadow: '0 2px 16px rgba(196, 154, 138, 0.08)'
    hover-box-shadow: '0 8px 32px rgba(196, 154, 138, 0.18)'
  button-primary:
    background: '{colors.accent}'
    color: '{colors.accent-on}'
    border-radius: '{rounded.full}'
    font: '{typography.label}'
    padding: '0.65rem 1.75rem'
    hover-background: '{colors.accent-hover}'
  button-ghost:
    background: transparent
    color: '{colors.ink-secondary}'
    border: '1px solid {colors.border-accent}'
    border-radius: '{rounded.full}'
  modal:
    background: '{colors.surface-overlay}'
    border: '1px solid {colors.border-subtle}'
    border-radius: '{rounded.lg}'
    backdrop: 'rgba(12, 6, 16, 0.75)'
  form-input:
    background: '{colors.surface-base}'
    border: '1px solid {colors.border-subtle}'
    border-radius: '{rounded.sm}'
    focus-border: '{colors.accent}'
    color: '{colors.ink-primary}'
  spots-badge:
    background: 'rgba(196, 154, 138, 0.12)'
    color: '{colors.accent}'
    border-radius: '{rounded.full}'
---

## Brand & Style

Didi Classes is a poledance studio that celebrates feminine power, grace, and self-expression. The visual language leans into that promise rather than sanitising it. The primary theme — **Velvet Night** — is dark, intimate, and glamorous: the register of a stage lit from below, a velvet curtain, a studio where something electric happens.

The aesthetic deliberately departs from the clinical brightness of generic booking platforms. Dark surfaces and a rose gold accent communicate luxury and intention. Cormorant Garamond headings supply the elegance; a clean system sans handles the functional work without competing. Nothing shouts; everything draws you closer.

**Theme architecture.** All visual tokens are defined as CSS custom properties on `:root`. A future `[data-theme="rosy-bold"]` attribute on `<html>` will override tokens to a Powerful/Athletic light theme (warm off-white, deep rose, hot pink). Token names are deliberately semantic — `surface-base`, not `dark-background` — so the switch costs nothing at the CSS layer. That theme is a deferred task.

## Colors

The Velvet Night palette is built around contrast and warmth, not brightness.

- **Surface Base (`#180f1e`)** — the primary canvas. Deep near-black with a plum undertone so it reads luxurious rather than cold. Used for page background, nav, and hero.
- **Surface Raised (`#241228`)** — elevated surfaces: cards and list containers. Just enough separation from base to feel physical without a heavy border.
- **Surface Overlay (`#2e1836`)** — modals and drawers. One step further up the light scale.
- **Ink Primary (`#f0e8e0`)** — primary text. Warm off-white, not pure white — reduces harshness against the dark canvas.
- **Ink Secondary / Accent (`#c49a8a`)** — rose gold. The only chromatic color in Velvet Night. Used for accent text, labels, CTA buttons, card stripes, and icons. Never used decoratively.
- **Accent Hover (`#d4b896`)** — a lighter gold step, used exclusively on hover/active states of accent-colored interactive elements.
- **Accent On (`#180f1e`)** — text placed directly on an accent fill (e.g. inside a primary button).
- **Success (`#6dbf9c`) / Error (`#e07070`)** — state colors. Muted enough to coexist with the dark palette; not alarming.

Avoid: pure white fills, saturated chromatic colors beyond the rose gold, blue-tinted grays (they read cold against the plum dark), and multi-layer drop shadows.

## Typography

Two typefaces, two roles, never interchanged.

**Cormorant Garamond** (Google Fonts) is the brand voice. Elegant, high-contrast, with the classical proportions of fine editorial print. Used exclusively for display and headline roles — studio name, section titles, event names, modal titles. Never used for body copy, labels, or form elements. Display sizes carry tight negative letter-spacing to hold together as a visual block.

**System UI stack** (`system-ui, -apple-system, sans-serif`) handles everything functional — body text, labels, captions, form elements, error messages. No custom body font is loaded; system fonts are faster, more legible at small sizes, and honor the user's accessibility settings.

The `label` role is uppercase-tracked (0.1em) in 600 weight. Used for metadata ("19:00–20:30", "3 места"), language switcher, and nav items — never for headings.

## Layout & Spacing

8px base unit. Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px.

Mobile-first. The public site is used primarily on phones — booked between classes, at the studio door, on the couch. Horizontal gutters: 16px on mobile, 24px on tablet, 64px on desktop. Content max-width: 1100px centered.

Home page is a linear vertical scroll: Nav → Hero → Studio Blurb → Class Grid → Contact Footer. No sidebars. Class grid: 1-column on mobile (`< 768px`), 2-column on tablet, 3-column on desktop (Bootstrap `row-cols-1 row-cols-md-2 row-cols-lg-3`).

The hero breathes: minimum 80px top/bottom padding. The studio blurb belt has `spacing.6` (32px) vertical padding to visually separate hero from grid without feeling like a separate page.

## Elevation & Depth

Depth is expressed through tonal stepping and controlled glow, not hard-edged shadows.

- **Background → Raised surface**: the step from `#180f1e` to `#241228` is the primary physical metaphor — a card lifting off the floor.
- **Card glow**: `box-shadow: 0 2px 16px rgba(196,154,138,0.08)` at rest; `0 8px 32px rgba(196,154,138,0.18)` on hover. The shadow is tinted with the accent color so it reads warm, not gray.
- **Modal backdrop**: `rgba(12, 6, 16, 0.75)` — deeply dark to maintain the intimate curtain feeling when a modal is open.
- **Hero glow**: a large radial gradient at the top-center of the hero (`rgba(196,154,138,0.18)`) creates a soft stage-light effect in pure CSS. No images required.

Avoid: horizontal directional shadows, multiple shadow layers on cards, elevation on nav or footer.

## Shapes

Rounded but not soft.

- **`rounded/sm` (0.5rem)** — form inputs, small badges, chips.
- **`rounded/md` (1rem)** — buttons, small containers.
- **`rounded/lg` (1.5rem)** — event cards, modal dialog.
- **`rounded/full` (9999px)** — pill buttons (primary CTA, language switcher toggle).

Pill shapes on primary CTAs are deliberate: they read as "press me" without relying on fill alone. Against a dark surface, a pill CTA in rose gold fill is unmistakably interactive.

Imagery (when added later) always follows its container's corner radius.

## Components

**Nav bar** — `{components.nav.background}` fill, `{components.nav.border-bottom}`. Studio name left in `headline-sm` (Cormorant Garamond), language switcher right ("BG / EN" in label style; active language in `{colors.accent}`, inactive in `{colors.ink-disabled}`). Sticky on scroll. No hamburger — single-scroll site with no destinations.

**Hero** — Full-width, min-height 85vh desktop / 60vh mobile. Base `{components.hero.background}` + the radial `{components.hero.glow-overlay}` stacked via a pseudo-element. Studio name centered in `display` / `display-mobile` typography. Tagline in `body-lg` at `{colors.ink-secondary}`. One pill CTA ("Разгледай часовете") scrolls to the class grid. Background is image-ready: a `background-image` on the hero element will sit beneath the glow layer via a stacked pseudo-element.

**Studio blurb belt** — Centered text column, max-width 600px, `body-lg` at `{colors.ink-secondary}`. One or two sentences. No heading. Divides hero from class grid.

**Event card** — `{components.event-card.background}`, `{components.event-card.border}`, `{components.event-card.border-radius}`. A `{components.event-card.accent-stripe-height}` top stripe in `{components.event-card.accent-stripe-color}`, flush to top edge, full card width. Inside: date badge (large day number, small month abbreviation, rose gold tint background), class name in `headline-sm`, instructor in `label`, time in `label`, spot count badge. Card footer: "Запази място" pill button at full width. Unavailable cards: opacity 0.5, "Местата са изчерпани" label replaces the CTA, not clickable.

**Booking modal** — Three zones: (1) class summary inset — tinted `{colors.surface-overlay}` with the accent stripe, echoing the event card; (2) form (name, email, phone); (3) submit pill button. Success state replaces the form with a warm confirmation message + dismiss CTA. Error appears as a `{colors.error-surface}` banner above the submit button; message text is API error-code-mapped via `i18n.js`.

**Spots badge** — `{components.spots-badge.background}`, `{components.spots-badge.color}`, `{components.spots-badge.border-radius}`. "N места" in label style. Hidden at zero (card goes unavailable instead).

## Do's and Don'ts

| Do | Don't |
|---|---|
| Rose gold accent for interactive affordances and metadata only | Use accent as decorative fill or background pattern |
| Cormorant Garamond for display and headline roles only | Set body copy or form labels in the serif |
| Pill CTAs on primary actions | Square buttons on the main booking CTA |
| Tinted warm glow for hero depth and card hover | Directional or multi-layer hard shadows |
| Opacity 0.5 + label for unavailable cards | Red fills or alarming visual treatment on full/past classes |
| Semantic token names (`surface-base`, not `dark-bg`) | Hard-coded hex values in component CSS |
| Image-ready hero (photo sits below the glow overlay) | Hero requiring a structural redesign to add a background photo |
