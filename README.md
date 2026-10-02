# Didi Classes: gym class reservations

A reservation site for gym classes. It runs on **Cloudflare Pages** (static jQuery + Bootstrap frontend), **Pages Functions** (API) and **D1** (SQLite database).

- `/`: public page with the address, upcoming classes and contact details. Click a class to book a spot.
- `/admin/`: password-protected admin area. You can create, edit and delete classes and see or remove sign-ups.

## Project layout

```
public/              static site (deployed as-is)
  index.html         public page
  admin/index.html   admin area
  js/config.js       ← business name, address, contact details, default language
  js/i18n.js         ← all EN/BG texts
  js/common.js       translations + Europe/Sofia time helpers
  js/app.js          public page logic
  js/admin.js        admin logic
  css/style.css      theme (change --brand to recolour)
functions/api/       API routes (Pages Functions)
lib/                 shared server code (auth, validation, queries)
schema.sql           database schema
```

## Rules

- All times are entered and shown in **Europe/Sofia** time, whatever the visitor's timezone is.
- Booking closes when a class **starts**. The class stays on the public page (marked "In progress") until it **ends**.
- Each class has a maximum number of participants. Booking is blocked when the class is full (the server checks this atomically).
- The same email can book a class only once.
- The admin can't lower the max participants below the number of people already booked.
- No emails are sent.

## Local development

Requires **Node.js 22+**.

```bash
npm install
cp .dev.vars.example .dev.vars      # then set ADMIN_PASSWORD and SESSION_SECRET
npm run db:init:local
npm run dev                         # http://localhost:8788
```

## Deploy to Cloudflare

```bash
npx wrangler login
npx wrangler d1 create didi-classes          # copy the database_id into wrangler.toml
npm run db:init:remote
npx wrangler pages project create didi-classes
npx wrangler pages secret put ADMIN_PASSWORD
npx wrangler pages secret put SESSION_SECRET  # a long random string, e.g. `openssl rand -hex 32`
npm run deploy
```

If you deploy by connecting a Git repo in the Cloudflare dashboard instead, `wrangler.toml` already sets the output directory (`public`) and the D1 binding (`DB`). Add the two secrets under *Settings → Variables and Secrets*.

## Security notes

- The admin session is an HMAC-signed, HttpOnly, `SameSite=Strict` cookie that is valid for 12 hours. **Logging out** removes it from the browser. To end **every** session immediately, change `SESSION_SECRET`.
- For extra protection, add a Cloudflare rate-limiting rule on `/api/admin/login` and `/api/events/*/reserve`.
