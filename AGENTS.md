<!-- bmad:context -->
<!-- Verified 2026-10-05 against 5e91a78. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## didi-classes

Gym class reservation system. Cloudflare Pages (static jQuery/Bootstrap frontend in `public/`), Pages Functions (`functions/api/`), D1 SQLite database. Business configuration and UI strings live in `public/js/config.js` and `public/js/i18n.js`.

## Policy

- Never send emails — there is no email feature and that is intentional.

## Where things are

- API routes: `functions/api/` (Pages Functions)
- Shared server code: `lib/` — http helpers, auth, validation, event queries
- Database schema: `db/schema.sql`
- Business name, address, contact details, default language: `public/js/config.js`
- All EN/BG UI strings: `public/js/i18n.js`

## Running and verifying

- Node.js 22+ required.
- Before the first run: `cp .dev.vars.example .dev.vars` then set `ADMIN_PASSWORD` and `SESSION_SECRET`.
- `npm run db:init:local` — seeds the local D1 database; run once.
- `npm run dev` — dev server at `http://localhost:8788`.
- No test runner — verify changes manually in the browser.

## Conventions that differ from defaults

- All DB timestamps are Unix epoch **milliseconds** (integers), not seconds or ISO strings.
- `ends_at` is always `starts_at + durationMinutes * 60000`; it is stored in the DB but computed by `lib/validate.js` and never received from the client.
- All times are displayed and entered in **Europe/Sofia** time, regardless of the visitor's timezone.
- API errors are machine-readable codes (`{ "error": "code" }`); add new error strings to `public/js/i18n.js`, never text to API responses.
- `functions/api/admin/_middleware.js` guards every `/api/admin/*` route — do not add auth checks to individual admin route files.

## Known pitfalls

- The reservation INSERT in `functions/api/events/[id]/reserve.js` is a single atomic statement combining the capacity check, the `starts_at > now` guard, and the write; never split it into separate queries.

<!-- /bmad:context -->
