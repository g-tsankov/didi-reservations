# Deferred Work — Vue Migration Initiative

- source_plan: `_bmad-output/initiative-vue-migration/plan-migrate-frontend-to-vue.md`
  summary: Migrate the admin page to Vue 3 and remove jQuery, `@types/jquery`, `@rollup/plugin-inject`, `common.ts`, `globals.d.ts` and the window globals (draft: `plan-migrate-admin-to-vue.md`)
  evidence: The full-frontend plan was about 2,300 tokens, over the 1,600 context budget; the user chose to split the admin page into its own plan, which reuses the shared Vue foundations built by the public-page plan.

- source_plan: `_bmad-output/initiative-vue-migration/plan-migrate-frontend-to-vue.md`
  summary: Fix frontend quirks found during the migration investigation: onboarding counter on admin, btn-group vs dropdown language switch, theme flash, switcher aria, unused key, stale CSS stub (draft: `plan-fix-frontend-quirks.md`)
  evidence: The user chose strict parity for the migration (decision 3a) and asked for the findings to be documented in a separate plan to do later.

- source_plan: `_bmad-output/initiative-vue-migration/plan-migrate-admin-to-vue.md`
  summary: Post-migration tidy-up: update the `AGENTS.md` context block for the Vue 3/Vite/bootstrap-vue-next stack and `src/` paths, reword the `time.ts`/`types.ts` header comments that mention the admin globals, and check whether `@types/bootstrap` and `@popperjs/core` are still used
  evidence: The admin-migration plan was about 2,050 tokens, over the 1,600 budget; the user chose to split off the parts that don't block removing jQuery.

- source_plan: `_bmad-output/initiative-vue-migration/plan-migrate-admin-to-vue.md`
  summary: Prove the admin visual-parity AC with a side-by-side comparison against the baseline build (BG/EN, light/dark: topbar btn-group, table, modal, sign-ups), now that the admin loads `bootstrap-vue-next.css` and BModal adds stacking classes and an inline z-index
  evidence: Unverified (would be medium). Static checks found no BVN selector hitting `.modal`, the plain table or the topbar btn-group, and the z-index comes from `--bs-modal-zindex`; only a screenshot comparison settles it.

- source_plan: `_bmad-output/initiative-vue-migration/plan-fix-frontend-quirks.md`
  summary: Raise the contrast of the language/theme switcher toggles (`.lang-switch`/`.theme-switch .dropdown-toggle` use `--ink-disabled`) on both the public nav and the admin topbar
  evidence: Dark theme is `#5e4855` on `#180f1e`, about 2.3:1; light is `#9e6b7e` on `#fdf8f5`, about 4.1:1. Both are below 4.5:1 for 11px text. This was already there on the public page, so it is a design-token choice (`DESIGN.md`) for both navs, not part of this fix. It leaves the "clearly readable" topbar AC unmet for the switchers only.
