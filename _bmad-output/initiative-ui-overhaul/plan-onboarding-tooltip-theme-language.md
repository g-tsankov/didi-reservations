---
title: 'Onboarding Tooltip for Theme and Language Controls'
type: 'feature'
ticket: ''
created: '2026-10-06'
status: 'built'
baseline_revision: 'f87215b4c8c1b8ce4cec61b94c9f3cb69f3dc940'
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

**Problem:** First-time visitors don't know the language and theme controls exist in the top-right nav area; there's no label or hint pointing to them.

**Approach:** Show a small fixed tooltip near the nav controls on the first 3 page loads. A "I got it" button dismisses it permanently (stored in localStorage as `onboarding_dismissed`). Increments a `onboarding_count` counter each load; stops showing after 3 loads or on early dismissal.

</frozen-after-approval>

## Implementation Notes

Also updated `src/js/i18n.ts` (the TypeScript source mirror of `public/js/i18n.js`) — it also requires the new keys or `tsc` fails. The plan listed 5 files; this is a 6th.

Oneshot: five files, all frontend. No backend, no API, no build changes beyond the normal TypeScript compile.

### 1. `public/js/i18n.js` — add two translation keys in both `en` and `bg` blocks

In the `en` block (after `themeDark`):
```js
onboardingTip: 'You can switch the language and theme in the top-right corner.',
onboardingDismiss: 'Got it',
```
In the `bg` block (after `themeDark`):
```js
onboardingTip: 'Можете да смените езика и темата горе вдясно.',
onboardingDismiss: 'Разбрах',
```

### 2. `src/js/globals.d.ts` — add the two keys to `TranslationKey`

After `'themeDark'`:
```typescript
| 'onboardingTip'
| 'onboardingDismiss'
```

### 3. `public/index.html` — add tooltip element before `</body>`

Place before the reservation modal comment or before `</body>`:
```html
<!-- Onboarding tooltip -->
<div id="onboarding-tip" class="onboarding-tip d-none" role="status" aria-live="polite">
  <p class="onboarding-tip-text mb-2" data-i18n="onboardingTip"></p>
  <button type="button" id="onboarding-dismiss" class="btn btn-sm btn-outline-secondary" data-i18n="onboardingDismiss"></button>
</div>
```

### 4. `src/js/common.ts` — add Onboarding IIFE at the end of the file

```typescript
(function () {
  const DISMISSED_KEY = 'onboarding_dismissed';
  const COUNT_KEY = 'onboarding_count';
  const MAX_SHOWS = 3;

  try {
    if (localStorage.getItem(DISMISSED_KEY) === '1') return;
    const count = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10);
    if (count >= MAX_SHOWS) return;
    localStorage.setItem(COUNT_KEY, String(count + 1));
  } catch (e) {
    return;
  }

  $('#onboarding-tip').removeClass('d-none');

  $(document).on('click', '#onboarding-dismiss', function () {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch (e) { /* storage unavailable */ }
    $('#onboarding-tip').addClass('d-none');
  });
})();
```

### 5. `public/css/style.css` — add tooltip styles

```css
.onboarding-tip {
  position: fixed;
  top: 3.5rem;
  right: 1rem;
  max-width: 220px;
  padding: 0.85rem 1rem;
  background: var(--surface-raised);
  border: 1px solid var(--border-accent);
  border-radius: var(--rounded-sm);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  z-index: 1080;
  font-size: 0.82rem;
  color: var(--ink-secondary);
}

.onboarding-tip::before {
  content: '';
  position: absolute;
  top: -7px;
  right: 1.1rem;
  width: 12px;
  height: 12px;
  background: var(--surface-raised);
  border-top: 1px solid var(--border-accent);
  border-left: 1px solid var(--border-accent);
  transform: rotate(45deg);
}
```

### 6. Build

Run `npm run build` after editing `src/js/common.ts` and `src/js/globals.d.ts`.

## Plan Change Log

## Review Triage Log

- **quick lens** (0 findings): No unmet ACs, no broken rules, no logic bugs. All six file changes confirmed correct.

## Verification

**Commands:**
- `npm run build` — expected: zero TypeScript errors, `public/js/common.js` updated

**Manual checks:**
- Clear localStorage, open `http://localhost:8788` — tooltip appears below top-right nav area with an upward-pointing arrow
- "Got it" button dismisses the tooltip; refreshing does not show it again (`onboarding_dismissed = '1'` in localStorage)
- Without clicking "Got it", reload 3 times — tooltip shows each time; on the 4th load it does not appear
- Tooltip text is translated when switching language
- Tooltip is styled consistently in both dark and light themes
