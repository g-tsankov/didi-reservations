---
title: 'Separate date and time pickers in class create/edit dialog'
type: 'feature'
ticket: ''
created: '2026-10-05'
status: 'built'
baseline_revision: '49a48adb9e1de3b64cad49d6f2ab4286c59101db'
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

**Problem:** The class create/edit dialog uses a single `datetime-local` input for start time, whose combined date+time picker UI varies across browsers and is awkward to use.

**Approach:** Replace the single `#e-start` `datetime-local` input with two separate native inputs — `#e-start-date` (type="date") and `#e-start-time` (type="time") — and update the JS to combine them before passing to the existing `Time.fromSofiaInput` / `Time.toSofiaInput` helpers.

</frozen-after-approval>

## Implementation Notes

Small, self-contained change: 3 files, ~22 lines. Native `date` + `time` inputs yield consistent, accessible pickers in all browsers and require no new utility logic — the existing `fromSofiaInput("YYYY-MM-DDTHH:MM")` and `toSofiaInput(ms)` helpers work unchanged by splitting on `T`.

Files touched:
- `public/admin/index.html` — replace `datetime-local` block with two inputs, adjust column widths
- `public/js/admin.js` — read from `#e-start-date` + `#e-start-time`; split on `T` in `fillForm()`
- `public/js/i18n.js` — add `admin.startDate` and `admin.startTime` keys; keep `admin.start` for now but it's no longer referenced

Key decisions:
- Column layout: change `col-md-6` for the old combined input into `col-6 col-md-3` + `col-6 col-md-3` for date and time, matching the existing duration/capacity columns → 4 equal columns on md, 2×2 on mobile.
- Labels: `admin.startDate` ("Date" / "Дата") and `admin.startTime` ("Time (Sofia)" / "Час (Сф)") — the timezone note stays on the time label since that's what varies.
- No `setCustomValidity` needed on the new inputs: the browser enforces format; `required` handles blank fields; `fromSofiaInput` covers the combined value.
- `admin.start` key becomes unused after this change; leave it in `i18n.js` to avoid noise, it does no harm.

## Plan Change Log

## Review Triage Log

quick lens — 0 findings. All acceptance criteria met; no rules broken.

## Verification

**Manual checks (if no CLI):**
- Open the class create dialog: confirm a date picker and a separate time picker appear side by side.
- Create a new class: pick a date and time, save — confirm the event appears in the list with the correct start time in Sofia timezone.
- Edit an existing class: confirm the date and time fields pre-fill correctly from the stored event.
- Leave one field blank and submit: confirm the form does not submit and shows the browser's required validation.
