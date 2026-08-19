# Architecture

## System overview

BirdDex is a collectible-card-style bird catalog app built on **Next.js 16 (App Router)** with **React 19** and **TypeScript**. **Supabase** provides Postgres storage, Auth (Google OAuth), and row-level security; **Cloudinary** stores all media (bird images/sounds, location photos, observation photos). Styling is Tailwind CSS v4 utility classes directly in JSX.

## Directory responsibilities

- **`app/`** — routing only. Route segments (`app/birds/`, `app/collection/`, `app/locations/`, `app/observations/`, `app/photos/`, `app/admin/`, `app/(auth)/`, `app/auth/callback/`, `app/ask-robin/`) contain Server Component pages that run auth checks, call feature query helpers, and compose feature components. Pages should not contain business logic or large inline JSX/SVG.
- **`features/`** — one directory per domain (`birds`, `observations`, `collection`, `locations`, `auth`, `bird-guide`). Each feature owns its `*-queries.ts` (all DB reads/writes for that domain), `actions/*-mutations.ts` (Server Actions), and `components/` (feature-specific UI).
- **`shared/`** — cross-feature code with no single domain owner: `shared/lib/` (Supabase clients, Cloudinary SDK wrapper, error helpers, small utilities) and `shared/ui/` (generic presentational components like `AdminBadge`, `RarityBadge`, `SoundButton`, `ObservationMonthsChart`).
- **`docs/`** — engineering contracts (`docs/contracts/`: `data-fetching.md`, `data-mutations.md`, `authentication.md`, `cloudinary-lifecycle.md`), user-facing guides (`docs/guides/`: `app-guide.md`, `testing.md`), feature specs (`docs/specs/`), and `docs/ui.md`.

**Exceptions found in the current code:**

- A top-level **`components/`** directory exists outside `features/`/`shared/ui/` and holds only static icon assets (`components/icons/**`) and a small set of primitive UI wrappers (`components/ui/badge.tsx`, `button.tsx`, `calendar.tsx`, `card.tsx`, `input.tsx`, `popover.tsx`), likely shadcn/ui-style primitives. Domain code (`entities/bird-domain.ts`) imports icon assets from here.
- A top-level **`entities/`** directory holds a single file, `entities/bird-domain.ts`, defining shared bird domain types/constants (`Rarity`, `Food`, `Biome`, `Behaviour`, icon maps). This sits outside both `features/` and `shared/`, and multiple features import from it.
- Auth helpers live in `features/auth/auth-helpers.ts`, and Supabase clients in `shared/lib/supabase-server.ts`, `shared/lib/supabase-middleware.ts`, `shared/lib/supabase-admin.ts` — there is no top-level `lib/` directory in this repo. Collection helpers live in `features/collection/collection-queries.ts`.

## Dependency direction

- `app/` → `features/*` → `shared/*`. Pages import feature query helpers and feature components; features import shared clients/utilities.
- `features/*` do not import from other `features/*` in the inspected files (each feature composes its own queries/actions); cross-feature composition happens at the `app/` page level (e.g. `app/birds/page.tsx` calls query helpers from `features/birds`, `features/observations`, and `features/locations` directly).
- `shared/lib` and `entities/bird-domain.ts` have no dependency on `features/` or `app/` — they sit below both.
- `entities/bird-domain.ts` imports static assets from `components/icons/**`, so `components/` (assets) is a dependency of `entities/`, which is in turn a dependency of `features/*` (e.g. `features/birds/actions/bird-mutations.ts` imports `RARITIES`, `FOODS`, etc. from `@/entities/bird-domain`).
- Client Components never import `shared/lib/supabase-server.ts`, `shared/lib/supabase-admin.ts`, or `shared/lib/cloudinary.ts` directly (server-only boundary — see Media lifecycle below).

## Data fetching flow

Server Components in `app/**/page.tsx` call query helpers exported from `features/*/[feature]-queries.ts`, which call Supabase directly. No raw SQL or fetching outside this path (see `docs/contracts/data-fetching.md`).

- **Global catalog data** (`birds`): fetched via the plain `supabase` client (`shared/lib/supabase.ts`), no user filtering — e.g. `getBirds()`, `getBirdById()` in `features/birds/bird-queries.ts`.
- **User-owned data** (observations, collected birds, saved locations): fetched via `createSupabaseServerClient()` (`shared/lib/supabase-server.ts`), always scoped by a `userId` obtained server-side (from `requireAuth()`/`getUser()` in `features/auth/auth-helpers.ts`), e.g. `getObservedBirdIds(user.id)`, `getSavedLocations(user.id)` as called from `app/birds/page.tsx`.

## Mutation flow

Client UI → Server Action (`features/*/actions/*-mutations.ts`, `'use server'` at file top) → Zod validation → feature query helper (`features/*/[feature]-queries.ts`) → Supabase → `revalidatePath()` → structured `{ error }` or `{ success }` return.

Example: `addObservationAction`/`updateBirdImageAction` validate typed input with Zod, call `requireAuth()`/`requireAdmin()` first, delegate the actual insert/update to a query-file helper, and return `{ error }` on failure instead of throwing (see `docs/contracts/data-mutations.md`). File-upload actions (bird images/sounds, observation/location photos) accept `FormData`/`File` for the file field only; other fields are still validated with Zod.

## Authentication and authorization

Google OAuth via Supabase Auth; roles (`admin`/`user`) live in `public.profiles`, not `user_metadata`. `features/auth/auth-helpers.ts` provides `getUser()`, `getUserRole()`, `requireAuth()` (redirects to `/login`), and `requireAdmin()` (redirects to `/`). `proxy.ts` (Next.js 16's middleware equivalent — see `AGENTS.md`) enforces route-level redirects for `/admin/*` and `/birds/*/edit` using a middleware-compatible Supabase client (`shared/lib/supabase-middleware.ts`), but every admin Server Action (e.g. `updateBirdImageAction` in `features/birds/actions/bird-mutations.ts`) independently calls `requireAdmin()` — the proxy is not the sole guard. Catalog writes use the service-role client (`shared/lib/supabase-admin.ts`, exposed as `supabaseAdmin`), which bypasses RLS; this key is never imported outside `shared/lib/supabase-admin.ts`. Ownership checks on user-owned rows (observations, saved locations, collected birds) are done by scoping queries to the authenticated `user.id`. Full reference: `docs/contracts/authentication.md`.

## Media lifecycle

Cloudinary stores bird images/sounds, location photos, and observation photos. The server always owns upload/replace/delete ordering (upload → DB write → delete-old; DB failure rolls back the new upload); the client never supplies `public_id`/`resource_type` as authority. The SDK wrapper (`shared/lib/cloudinary.ts`) is server-only (`import "server-only"`); `shared/lib/cloudinary-utils.ts` exposes pure string helpers safe for Client Components. Full contract, required DB columns, and do-not-reintroduce list: `docs/contracts/cloudinary-lifecycle.md`.

## Core data ownership

| Table             | Ownership      |
| ----------------- | -------------- |
| `birds`           | Global catalog |
| `observations`    | User-owned     |
| `collected_birds` | User-owned     |
| `saved_locations` | User-owned     |

## Component organization

Feature components typically follow a folder-per-component convention:

```
ComponentName/
  ComponentName.tsx
  index.ts
```

`index.ts` re-exports the main component to keep imports short.

Not every component follows this pattern, but it is the preferred convention for new feature components.

## Database schema

Database schema changes live under `supabase/migrations/` as timestamped SQL files, applied via the Supabase CLI. See `docs/guides/database-migrations.md` for the workflow.

Migration files are the source of truth for database structure. One-off data scripts (seeding, backfills) stay in `scripts/`.

## Architectural rules

- All data fetching happens in Server Components; all mutations happen in Server Actions. No fetching/mutating in Client Components or `app/api/*` route handlers (none exist in this project).
- All DB access goes through `features/*/[feature]-queries.ts` helpers — no inline Supabase calls in components or actions.
- Server Actions validate all input with Zod and return structured errors instead of throwing; `FormData` is only used for file-upload fields.
- User-owned queries must derive `userId` server-side (`requireAuth()`), never trust a client-supplied user id.
- `requireAdmin()` must be called independently inside every catalog-mutating Server Action, not just relied on via `proxy.ts`.
- The Cloudinary SDK (`shared/lib/cloudinary.ts`) is server-only and must never be imported by Client Components; use `shared/lib/cloudinary-utils.ts` for display-only needs.
- `SUPABASE_SERVICE_ROLE_KEY` and Cloudinary API secret must never reach the client; only `NEXT_PUBLIC_*`-prefixed vars are exposed.
