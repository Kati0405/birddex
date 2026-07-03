# Feature Spec: Ukrainian i18n Scaffolding

## Goal

BirdDex is currently English-only, with all UI copy hardcoded inline in JSX and no i18n infrastructure. This spec covers standing up the routing and translation infrastructure needed to eventually support Ukrainian, using `next-intl` with URL-based locales (`/en/...`, `/uk/...`). This first pass is scaffolding only: prove the infrastructure works end-to-end on one route and one string, and document the pattern so the rest of the app can be migrated incrementally in follow-up work.

## Scope

- Add `next-intl` as a dependency and minimal config (`i18n/request.ts` or equivalent).
- Add `messages/en.json` and `messages/uk.json` with seed keys.
- Migrate **one route** (`app/page.tsx`, the home page) under `app/[locale]/page.tsx` as a pilot.
- Extend `proxy.ts` to detect locale (`Accept-Language`/cookie) and redirect `/` to `/en` or `/uk`, without breaking existing auth/session/admin-redirect logic.
- Translate **one real UI string** on the home page end-to-end (English + Ukrainian) via `useTranslations`/`getTranslations`.
- Add a minimal `LanguageSwitcher` component (in `shared/ui/`) that links between `/en` and `/uk` equivalents of the current page.
- Write `docs/i18n.md` documenting how to add a translated string and how to migrate a new route into `[locale]`.

## Out of Scope

- Migrating all other routes (`/birds`, `/collection`, `/observations`, `/locations`, `/photos`, `/ask-robin`, `/admin/add-bird`, `(auth)` routes, etc.) into `[locale]`.
- Translating all existing hardcoded UI strings across features.
- Bird catalog DB content translation (`name_eng`, `name_latin`, `field_note`, habitat/food/behaviour labels) — these live in Supabase and require schema changes (translated columns or a separate translations table); tracked as future work.
- Translating `docs/app-guide.md` or the Ask Robin `APP_GUIDE` prompt constant in `features/bird-guide/bird-guide-prompt.ts`.
- Persisting a user's locale preference to their Supabase profile (cookie/URL only for now).
- Any change to how bird data is fetched (`docs/data-fetching.md` rules still apply unchanged — no data-fetching changes in this pass).

## Data Model

No database changes in this pass. No new tables, columns, or migrations. Translation strings live in static JSON files (`messages/en.json`, `messages/uk.json`), not the database.

## UI Behavior

- Visiting `/` with no locale in the URL redirects based on browser `Accept-Language` (or a previously set locale cookie) to either `/en` or `/uk`.
- `/en` and `/uk` both render the existing home page with identical layout; only the one migrated string changes language.
- All other existing routes (`/birds`, `/collection`, etc.) continue to work unchanged at their current non-locale-prefixed paths — they are not yet locale-aware.
- The `LanguageSwitcher` appears on the home page only, lets the user toggle between `/en` and `/uk`, and preserves the rest of the current path.
- No loading or error states are introduced beyond what next-intl handles by default (e.g. `notFound()` for unsupported locales).

## Auth and Security

- No auth/authorization behavior changes. Existing `requireAuth()`/`requireAdmin()` checks are untouched.
- `proxy.ts` changes are additive (locale detection/redirect) and must not alter or bypass existing session-refresh or admin-route-redirect logic. The existing matcher (excluding static assets/images) must continue to exclude those paths after the change.

## Code Organization

- `i18n/request.ts` (or next-intl's conventional config location) — locale config, seed messages loading.
- `messages/en.json`, `messages/uk.json` — flat or lightly-nested key/value translation dictionaries.
- `app/[locale]/page.tsx` — pilot migration of the home page; all other routes stay where they are.
- `shared/ui/LanguageSwitcher/LanguageSwitcher.tsx` — small named component, follows existing `shared/ui/` conventions (see `AdminBadge` for pattern).
- `proxy.ts` — extended, not rewritten; keep the diff minimal and additive.
- `docs/i18n.md` — new doc explaining the pattern for future route/string migrations.

## Docs

- `docs/i18n.md` (new) — how to add a translated string, how to migrate a route into `[locale]`.
- `CLAUDE.md` — add `docs/i18n.md` to the "Key docs" list once it exists.
- `docs/app-guide.md` / `features/bird-guide/bird-guide-prompt.ts` — **not** touched in this pass (no user-facing feature change beyond the home page pilot, which is infrastructure, not a new feature to document).

## Acceptance Criteria

- [x] `next-intl` installed and configured; `npm run build` succeeds.
- [x] `messages/en.json` and `messages/uk.json` exist with matching key sets.
- [x] `/en` and `/uk` both render the home page correctly.
- [x] All pre-existing routes (`/birds`, `/collection`, `/observations`, `/locations`, `/photos`, `/ask-robin`, `/admin/add-bird`, `(auth)` routes) still work unchanged.
- [x] Visiting `/` redirects to `/en` or `/uk` based on browser locale; existing auth/session/admin logic in `proxy.ts` still functions (verified by logging in and hitting an admin-gated route).
- [x] One real UI string on the home page renders in English at `/en` and Ukrainian at `/uk`.
- [x] `LanguageSwitcher` toggles locale on the home page and preserves the rest of the path.
- [x] `docs/i18n.md` written and linked from `CLAUDE.md`.
