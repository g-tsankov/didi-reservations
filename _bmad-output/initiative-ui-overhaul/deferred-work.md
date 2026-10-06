# Deferred Work — ES6 Migration Initiative

- source_plan: `_bmad-output/initiative-es6-migration/plan-migrate-frontend-to-typescript.md`
  summary: Refactor `app.ts` and `admin.ts` from `$(() => {})` closures into TypeScript classes with typed private properties and methods
  evidence: The TypeScript migration preserved the existing IIFE/closure structure as required by its "compile-only" constraint. Now that types are in place, the state variables (`events`, `filter`, `current`, `modal`) and the functions that operate on them map directly to a single class per file. Event handlers using `$(this)` are replaced with arrow functions + `e.currentTarget`, which is runtime-equivalent. Requested explicitly by the user after reviewing the migrated code.

- source_plan: `_bmad-output/initiative-ui-overhaul/plan-language-theme-dropdown-localstorage.md`
  summary: Restore ARIA selection state on lang-switch and theme-switch dropdown items
  evidence: The dropdown migration removed aria-pressed/aria-current from both lang and theme switch items. Assistive technology users can no longer programmatically determine the active language or theme. The plan deliberately omitted these (spec specified CSS-only active toggle), so a follow-up plan should add aria-current="true" on the active dropdown item for both controls.

- source_plan: `_bmad-output/initiative-ui-overhaul/plan-language-theme-dropdown-localstorage.md`
  summary: Add role="group" (or equivalent) to lang-switch and theme-switch dropdown wrappers so aria-label is meaningful
  evidence: The plan sets aria-label on plain <div class="dropdown"> wrappers. Without an ARIA role the label is ignored by assistive technology. The old btn-group had role="group" which made it meaningful. A follow-up should either add role="group" or move the label to the toggle button as aria-label.

- source_plan: `_bmad-output/initiative-es6-migration/plan-migrate-frontend-to-typescript.md`
  summary: Verify and commit removal of `public/js/*.js` compiled artifacts from git tracking
  evidence: The TypeScript migration staged `git rm --cached public/js/*.js` and added `public/js/*.js` to `.gitignore`, but the deletion has not been committed. Before closing the migration, confirm that the `[build]` section in `wrangler.toml` is sufficient for Cloudflare Pages to regenerate the files at deploy time, that `npm run dev` works from a clean tree with no pre-built `.js` files present, and then commit the removal so the compiled artifacts are fully out of the repository history going forward.
