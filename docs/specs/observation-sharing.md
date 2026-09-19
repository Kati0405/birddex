# Observation Sharing — Implementation Plan

Status: **slices 1–8 implemented** (data model, first-observation tracking,
slug/share activation, public share query, public share page, OG image,
1080×1350 share image, Share UI). Remaining: slice 9 (fallback UX is already
covered by the slice 8 implementation — Copy link/Download image, AbortError
handling), slice 10 (additional test coverage beyond what shipped inline with
each slice), and confirming docs stay in sync as the feature evolves further.

This spec follows `docs/specs/spec-template.md` conventions but is longer than
usual because it was requested as a full architecture plan.

Notable deviations from the original plan, decided during implementation:

- The Journal's pre-existing `isFirstEncounter` badge (previously computed as
  `MIN(observed_at)` per species, recalculated on every read) was unified
  with the new stable `collected_birds.first_observation_id` tracking, rather
  than left as a second, separate "first" concept (see §19, open question 1
  — resolved in favor of unifying).
- Existing `collected_birds` rows were backfilled deterministically using the
  old earliest-by-date logic, via `scripts/backfill-first-observation-id.mjs`
  (§19, open question 2 — resolved in favor of backfilling).
- Slug primitive: `crypto.randomUUID()`, no new dependency (§19, open
  question 3 — resolved).
- Share appears in **both** the Journal timeline and the flipped bird-card
  observation view (§19, open question 4 — resolved in favor of both).

---

## 1. Current state

### DB schema (`supabase/migrations/`)

- `birds` — global catalog. Has `selected_image jsonb` (a `WikimediaImage`:
  `imageUrl`, `thumbnailUrl`, `author`, `license`, `sourceUrl`) and/or
  `image_url` + `image_public_id`/`image_resource_type` (Cloudinary-hosted
  default image). `rarity` is a checked enum matching `RARITY_COLOR`.
- `observations` — user-owned. Columns relevant to sharing: `id uuid`,
  `user_id`, `bird_id`, `observed_at`, `created_at`, `lat`, `lng`, `seen`,
  `heard`, `photographed`, `notes`, `photo_url`, `location_name`, `quality`,
  `cloudinary_public_id`, `cloudinary_resource_type`. RLS: `Own observations`
  (`auth.uid() = user_id`), no public-read policy.
- `collected_birds` — `(user_id, bird_id)` primary key, `collected_at`. No
  reference to a specific observation. **No `first_observation_id` column
  exists today.**
- `profiles` — `id`, `role`, `nickname` (added in
  `20260919120000_add_profiles_nickname.sql`, format-checked, case-insensitive
  unique). Nicknames **are already implemented** (contrary to the prompt's
  assumption) — see `docs/contracts/authentication.md` "Nicknames" section and
  `features/profile/profile-queries.ts::getDisplayName()`.
- `saved_locations` — `id`, `user_id`, `name` (private user label, e.g. "My
  secret owl spot"), `lat`, `lng`, `photo_url`, `photo_public_id`, `habitats`.
- `journal_photo_of_month` — small per-user side table
  (`user_id, month_key` PK, FK to `observations.id` with `on delete cascade`,
  own RLS policy). **This is the closest existing precedent for a small
  reference table that should shape the `first_observation_id` and
  `share_slug` designs below.**

### Important existing behavior that changes the plan

**`observations.location_name` is not reliably a "safe" city/region string.**
Inspecting `AddObservationModal.tsx` and `LocationPicker.tsx`:

- When a user picks a location on the **map** or searches/geolocates,
  `LocationPicker` reverse-geocodes via Nominatim client-side and produces a
  `"City, Region"`-shaped string, which is what gets saved as
  `location_name` (`AddObservationModal.tsx:83-88`, `LocationPicker.tsx:27-46`).
- When a user picks a **saved location**, `resolvedLatLng.locationName` is set
  to `saved.name` — the private user-defined label — verbatim
  (`AddObservationModal.tsx:83-88`). This value is what's stored in
  `observations.location_name`.

So `location_name` is a **mixed-trust field**: sometimes a safe geocoded
string, sometimes a private label like "My secret owl spot" or "Uncle Bo's
farm". **The share DTO must never read `location_name` directly.** It must
independently derive a city/region string from `lat`/`lng` server-side (see
§10).

**A "first encounter" concept already exists, but it is the wrong model for
sharing.** `features/observations/journal-queries.ts::getFirstEncounterObservationIds()`
computes, per bird, the observation with the earliest `(observed_at, id)` —
recomputed on every read. This is exactly the fragile pattern the prompt
warns against: backdating an older observation after the fact moves the
badge, and it's not tied to `created_at` or to a stable reference row. It's
used today only for the Journal's "first encounter" badge/`isFirstEncounter`
flag and the "New species this month" sidebar. **Do not reuse this function
for the share "First time" badge** — it answers a different question
("earliest by date") than what the spec requires ("first one I ever
logged"). A new, stable mechanism is needed (§9).

### Files (query/action layer)

| File | Responsibility |
|---|---|
| `features/observations/observation-queries.ts` | `addObservation`, `updateObservation`, `deleteObservation`, `getObservationForUser` (ownership-scoped), `getAllUserObservations`, `getCollectionCardDataByBirdIds`, `getObservationCount`, `getUserObservationPhotos` |
| `features/observations/actions/observation-mutations.ts` | `addObservationAction`, `updateObservationAction`, `deleteObservationAction` — all Zod-validated, `requireAuth()`, FormData (file upload exception) |
| `features/observations/journal-queries.ts` | `getJournalMonthData`, `getFirstEncounterObservationIds`, `getJournalPhotoOfMonth`/`setJournalPhotoOfMonth` |
| `features/collection/collection-queries.ts` | `checkIfCollected`, `toggleCollected`, `getCollectedCount`, `getCollectedBirdIds` — no per-species first-observation tracking |
| `features/collection/actions/collection-mutations.ts` | `toggleCollectedAction` |
| `features/locations/location-queries.ts` | `getSavedLocations`, `getSavedLocationById`, `saveLocation`, `updateLocation`, `getLocationStats`, `getLocationDetailStats`, `getLocationObservations` |
| `features/profile/profile-queries.ts` | `getNickname`, `setNickname`, `getDisplayName(user, nickname)` |
| `features/birds/bird-queries.ts` | `getBirdById`, `getBirdsByIds`, etc. — global catalog reads via `shared/lib/supabase.ts` (anon-safe client) |
| `shared/lib/cloudinary.ts` / `cloudinary-utils.ts` | Server-only Cloudinary SDK wrapper + pure display helpers (`isCloudinaryUrl`, `cloudinaryThumbnail`, `cloudinaryPublicId`, `toCloudinaryResourceType`) |
| `features/auth/auth-helpers.ts` | `getUser()`, `getUserRole()`, `requireAuth()`, `requireAdmin()` |
| `shared/lib/supabase-server.ts` / `supabase-admin.ts` | SSR cookie-bound client (RLS-enforced) vs. service-role client (RLS-bypassing, server-only) |

### UI components relevant to Share placement

- `features/observations/components/JournalTimeline/DateGroup.tsx` — renders
  each day's observations via `ObservationRow`, passing an `actions` node
  containing `Pencil` (edit) / `Trash2` (delete) icon buttons that appear on
  hover (`opacity-0 group-hover:opacity-100`). **This is the natural home for
  a Share icon button**, added to the same `actions` row.
- `features/observations/components/ObservationRow/ObservationRow.tsx` — pure
  presentational row; already shows `isFirstEncounter` via the existing
  `1st-time-badge.png` icon.
- `features/birds/components/BirdCard/BirdCardBackObservation.tsx` (not read
  in full but referenced elsewhere) — likely the other place individual
  observations are displayed on a flipped bird card; needs a look during
  implementation to decide whether Share also belongs there (see §12).
- No existing `ImageResponse`/`opengraph-image.tsx` usage anywhere in the
  app. No `nanoid` dependency in `package.json`. No sitemap/robots file.

### Rarity / bird domain

`entities/bird-domain.ts` — `Rarity`, `RARITY_COLOR` (exact hex map from
CLAUDE.md), `Bird` type (`name_eng`, `name_latin`, `wingspan`, `selected_image?: WikimediaImage`, `image_url?`). This is the single source of truth for
rarity color and should be imported as-is into the share DTO/image, not
duplicated.

---

## 2. Recommended architecture

- **Private observation data**: unchanged. `observation-queries.ts` keeps
  doing RLS-backed, `user_id`-scoped reads via `createSupabaseServerClient()`.
- **Share activation**: a new Server Action
  `createObservationShareLinkAction({ observationId })` in a new
  `features/observations/actions/share-mutations.ts` file. Idempotent: if
  `observations.share_slug` is already set, return it; otherwise generate one
  and persist it in the same row.
- **Share slug**: stored directly on `observations.share_slug` (nullable,
  unique). This avoids a join table — an observation has at most one slug,
  and the "reuse the same slug" requirement maps directly onto "read the
  column, write it once."
- **Public data query**: a new file
  `features/observations/public-share-queries.ts` (or a clearly-separated
  section of a new file — see §7) exporting
  `getPublicObservationShareData(shareSlug)`. This is the **only** function
  in the codebase allowed to read an observation without `requireAuth()`
  ownership scoping. It talks to Postgres via the **service-role client**
  (`shared/lib/supabase-admin.ts`), not the anon/RLS client, because there is
  intentionally no RLS policy that allows anonymous `share_slug` lookups (see
  §5). It returns only the narrow `ObservationShareData` DTO — never the raw
  row.
- **Public HTML page**: `app/share/observation/[shareSlug]/page.tsx`, a
  Server Component, calling `getPublicObservationShareData`. `notFound()` on
  a missing/invalid slug or deleted observation. `robots: { index: false,
  follow: false }` in `generateMetadata`.
- **OG image**: colocated
  `app/share/observation/[shareSlug]/opengraph-image.tsx` using
  `ImageResponse` from `next/og`, 1200×630, built from the same
  `ObservationShareData`.
- **1080×1350 share image**: a Route Handler,
  `app/share/observation/[shareSlug]/image/route.tsx`, also using
  `ImageResponse`, reusing the same data fetch and a shared rendering
  sub-component so the two image sizes don't duplicate layout logic (see
  §13).
- **Native sharing**: a new client component,
  `features/observations/components/ShareObservationButton/ShareObservationButton.tsx`,
  invoked from `DateGroup.tsx`'s `actions` row. Calls the create-share Server
  Action, fetches the generated image as a `Blob` from the image route,
  attempts `navigator.share({ files, url })` gated by
  `navigator.canShare({ files })`, and falls back to Copy link / Download
  image.
- **Fallback sharing**: same component, rendered inline (no modal) when
  `navigator.share`/`canShare` is unavailable or rejects with
  `AbortError`/user cancellation.

---

## 3. Data flow

```
User clicks Share icon in DateGroup actions row
  → ShareObservationButton (client)
  → createObservationShareLinkAction({ observationId })   [Server Action]
      → requireAuth()
      → getObservationForUser(observationId)  (ownership check, ownership-scoped read)
      → if observations.share_slug is null: generate slug, UPDATE observations SET share_slug = ... WHERE id = ... AND user_id = ...
      → return { shareSlug }
  → client builds shareUrl = `${origin}/share/observation/${shareSlug}`
  → client requests the 1080x1350 image:
      GET /share/observation/[shareSlug]/image
      → route handler calls getPublicObservationShareData(shareSlug) [service-role, public DTO only]
      → renders ImageResponse → PNG bytes
  → client wraps PNG bytes in a File, calls navigator.canShare({ files: [file] })
      → if true: navigator.share({ files: [file], url: shareUrl, title, text })
          → user picks a target app, or cancels (AbortError — treated as normal, no error UI)
      → if false: show inline fallback — "Copy link" (clipboard write of shareUrl) and
        "Download image" (anchor download of the fetched PNG blob)
  → Recipient opens shareUrl
      → app/share/observation/[shareSlug]/page.tsx (Server Component, public, noindex)
      → getPublicObservationShareData(shareSlug) again (always current state)
      → notFound() if slug invalid or observation was deleted
      → renders public share page; opengraph-image.tsx separately supplies the
        1200x630 unfurl image using the same DTO
```

---

## 4. Database changes

Two migrations (per `docs/guides/database-migrations.md` conventions — new
timestamped files, `IF NOT EXISTS` guards, never edit applied migrations).

### 4a. `supabase/migrations/<ts>_add_observations_share_slug.sql`

```sql
alter table public.observations
  add column if not exists share_slug text;

create unique index if not exists observations_share_slug_key
  on public.observations (share_slug)
  where share_slug is not null;
```

No RLS policy change needed for this column — the existing `Own observations`
policy already covers reads/writes by the owner via the normal server client.
Anonymous public reads go through the service-role path instead (§5), which
bypasses RLS entirely by design, so no `USING (share_slug is not null)` policy
is added (that would allow enumeration via PostgREST — explicitly disallowed
by the prompt).

### 4b. `supabase/migrations/<ts>_add_collected_birds_first_observation.sql`

```sql
alter table public.collected_birds
  add column if not exists first_observation_id uuid
    references public.observations(id) on delete set null;
```

`on delete set null` (not `cascade`) is deliberate: deleting the first
observation must clear the "first" pointer (so the badge disappears, per
spec) without deleting the `collected_birds` row itself — the user still has
the species collected.

No new RLS policy needed; `collected_birds` already has `Own collection`
covering all operations, and this is just a new nullable column on an
existing owned row.

Nickname support: **already implemented**, no migration needed (see §1).

---

## 5. Access-control model

- **Private observation reads** (`observation-queries.ts`, `journal-queries.ts`,
  location/collection queries): unchanged. All go through
  `createSupabaseServerClient()` (cookie-bound, RLS-enforced) and filter by
  `user_id` derived from `requireAuth()`. A user can never read another
  user's observation through these paths, RLS or not — both layers apply
  (defense in depth, per existing project convention).
- **Share creation**: `createObservationShareLinkAction` calls
  `requireAuth()`, then reads the observation via the existing
  ownership-scoped `getObservationForUser(id)` pattern (extended to also
  select `share_slug`). If the returned row is `null` (not found, or belongs
  to another user), the action returns an error and never touches
  Cloudinary/slug generation. This reuses the exact ownership-check pattern
  already used by `updateObservationAction`/`deleteObservationAction`.
- **Anonymous share-page access**: `getPublicObservationShareData(shareSlug)`
  is the **only** function that queries `observations` without a `user_id`
  filter. It:
  1. Uses `supabaseAdmin` (service-role client, server-only,
     `shared/lib/supabase-admin.ts`) specifically **because** RLS on
     `observations` has no anonymous-read policy and none should be added —
     using the admin client here is a deliberate, narrow bypass, not a
     workaround for a missing policy.
  2. Is called only from: the share page Server Component, the OG image
     route, and the 1080×1350 image route — never from a Client Component,
     never exposed as a Server Action (no client-triggerable public data
     fetch).
  3. Selects an explicit narrow column list (bird_id, observed_at, seen,
     heard, photographed, quality, lat, lng, photo_url,
     cloudinary_public_id/resource_type, user_id [internal join only],
     share_slug) — never `select('*')`.
  4. Immediately maps the row into `ObservationShareData` and discards the
     raw row; `lat`/`lng` and `user_id` never leave this function.
  5. Returns `null` if `share_slug` doesn't match any row — callers `notFound()`.
- **Enumeration resistance**: `share_slug` is a high-entropy random token
  (§ below), not sequential and not derived from the observation UUID, so
  guessing a valid slug is infeasible. There is intentionally no "list all
  shared observations" endpoint anywhere.
- **Service-role isolation**: `supabaseAdmin` import stays confined to
  `features/observations/public-share-queries.ts` (plus the two existing
  admin call sites in `features/birds/bird-queries.ts`, untouched). It is
  never imported into a Client Component or a Route Handler that accepts
  client-supplied filters.

---

## 6. Share data DTO

Lives in `features/observations/public-share-queries.ts` (colocated with the
one function that produces it, per the project's convention of keeping
query-layer types next to their queries, e.g. `ObservationEntry` in
`observation-queries.ts`).

```ts
import type { Rarity } from '@/entities/bird-domain';

export interface ObservationShareData {
  shareSlug: string;

  birdName: string;
  scientificName: string;
  rarity: Rarity;

  photo: {
    url: string;
    source: 'observation' | 'bird-default';
    credit: string | null; // e.g. "© Jane Doe · CC BY-SA" for bird-default, or the observer's display name for an observation photo
  };

  observedAt: string; // ISO string — always the CURRENT value, not a snapshot

  location: {
    displayName: string | null; // "Berdychiv, Zhytomyr region" or null — never coordinates
  };

  methods: {
    seen: boolean;
    heard: boolean;
    photographed: boolean;
  };

  quality: number | null;

  isFirstObservationOfSpecies: boolean;

  author: {
    displayName: string | null; // nickname, or null (never Google full name/email) until the user sets one
  };
}
```

This single type powers the share page, the OG image, and the 1080×1350
image — all three call `getPublicObservationShareData` and pass the result
into a shared presentational renderer (§13). No duplicate data-shaping logic.

---

## 7. Files to create

| File | Responsibility |
|---|---|
| `supabase/migrations/<ts>_add_observations_share_slug.sql` | `share_slug` column + partial unique index |
| `supabase/migrations/<ts>_add_collected_birds_first_observation.sql` | `first_observation_id` column on `collected_birds` |
| `shared/lib/slug.ts` | `generateShareSlug()` — thin wrapper around `crypto.randomUUID()` or `nanoid` (decision below) producing a URL-safe, unguessable token |
| `features/observations/actions/share-mutations.ts` | `createObservationShareLinkAction({ observationId })` — `'use server'`, Zod, `requireAuth()`, ownership check, idempotent slug reuse |
| `features/observations/public-share-queries.ts` | `getPublicObservationShareData(shareSlug)`, `ObservationShareData` type, `resolveShareLocation(lat, lng)` helper (§10) |
| `features/observations/components/ShareObservationButton/ShareObservationButton.tsx` | Client component: Share icon button, calls the action, builds `shareUrl`, fetches the share image, drives `navigator.share`/fallback UI |
| `features/observations/components/ShareObservationButton/index.ts` | Barrel export, matching sibling components' pattern (`AddObservationModal/index.ts`, `ObservationButton/index.ts`) |
| `features/observations/components/ShareCard/ShareCard.tsx` | Pure presentational layout (JSX + inline styles only — Satori-compatible) shared by both `ImageResponse` renders; takes `ObservationShareData` + a `size` variant |
| `app/share/observation/[shareSlug]/page.tsx` | Public Server Component page; `generateMetadata` with `robots: noindex, nofollow`; renders the public HTML share view using `ObservationShareData` |
| `app/share/observation/[shareSlug]/opengraph-image.tsx` | 1200×630 `ImageResponse`, built from `ShareCard` |
| `app/share/observation/[shareSlug]/image/route.tsx` | Route Handler returning the 1080×1350 `ImageResponse` PNG, built from `ShareCard` |
| `features/observations/collection-first-observation.ts` *(or inline in collection-queries.ts — decide during implementation, see §9)* | `recordFirstObservationIfNeeded()` helper called from `addObservation` |

## 8. Files to modify

| File | Modification |
|---|---|
| `features/observations/observation-queries.ts` | Extend `getObservationForUser` to also select `share_slug`; add `getObservationShareSlug(id, userId)` or fold into existing helper; extend `addObservation` to call the new first-observation-tracking helper in the same transaction/flow as the insert (§9); extend `deleteObservation` to null out `first_observation_id` via the FK's `on delete set null` (automatic — no code change needed, but add a test) |
| `features/collection/collection-queries.ts` | Add `getFirstObservationIds(userId, birdIds)` (batched lookup of `collected_birds.first_observation_id` for the "First time" badge — **replacing** the per-render `getFirstEncounterObservationIds` for any UI that should show the stable badge; the Journal's existing "earliest-by-date" badge can stay as-is if the team wants to keep that separate concept, see Open Questions) |
| `features/observations/components/JournalTimeline/DateGroup.tsx` | Add `ShareObservationButton` to the `actions` row alongside `Pencil`/`Trash2` |
| `features/observations/journal-queries.ts` | No change required for MVP; optionally swap `isFirstEncounter` to read the new stable source (Open Question) |
| `docs/contracts/data-fetching.md` | Add a short callout documenting `getPublicObservationShareData` as the sole anonymous-read exception, referencing this spec |
| `docs/contracts/authentication.md` | Add a note under "Nicknames" that nickname is now also used for share-card attribution |
| `docs/guides/app-guide.md` | Add a "Sharing an observation" section |
| `features/bird-guide/bird-guide-prompt.ts` | Update `APP_GUIDE` constant to mention the Share action |
| `package.json` | Add `nanoid` **only if** chosen over `crypto.randomUUID()` (§ below — recommend NOT adding it) |

---

## 9. "First time" implementation

**Do not use `getFirstEncounterObservationIds`** (earliest by `observed_at`)
for this badge — confirmed wrong model per §1.

Add `collected_birds.first_observation_id uuid references observations(id)
on delete set null` (§4b). Semantics: "the observation record that caused
this species to first appear in the user's collection," fixed at
creation time, never recalculated by date.

**Population, on `addObservation`:**

```ts
// inside addObservation, after the insert succeeds and we have the new row's id
const { data: existing } = await supabase
  .from('collected_birds')
  .select('bird_id')
  .eq('user_id', user.id)
  .eq('bird_id', data.birdId)
  .maybeSingle();

if (!existing) {
  // first-ever observation of this species for this user
  await supabase.from('collected_birds').upsert({
    user_id: user.id,
    bird_id: data.birdId,
    first_observation_id: newObservationId,
  });
} 
// if a collected_birds row already exists, do nothing — first_observation_id
// was already set (or intentionally left null by backfill, see §18) and must
// not move.
```

This must NOT run as a side effect of `toggleCollected` (that's a separate,
manual "mark collected" action unrelated to logging an observation) — only
`addObservation` sets `first_observation_id`, since the spec explicitly ties
it to "first observation record ... ever created," not to collection-toggle
timing.

**Backdated observations:** because `first_observation_id` is set once, at
`INSERT` time, based on whether a `collected_birds` row already exists — not
based on the new row's `observed_at` — adding an older historical observation
after the fact never changes an already-set `first_observation_id`. This
satisfies the exact example in the prompt (create today's Great Tit first,
backfill last month's Great Tit later — today's stays "first").

**Deletion:** `on delete set null` on the FK means deleting the observation
that `first_observation_id` points to automatically clears the pointer at
the DB level — no application code needed, and no automatic promotion of a
different observation to "first." Add a test asserting this (§17).

**Collection built outside of observations** (if `toggleCollected` is used
without ever logging an observation): `first_observation_id` stays `null`.
The share card and any "First time" UI simply treat `null` as "not
first" — never show the badge. This is correct: there's no observation row
to badge in that case anyway (the badge only ever appears on an
observation-shaped surface).

---

## 10. Location implementation

Goal: turn `(lat, lng)` into a safe `"City, Region"` string, entirely
server-side, without ever trusting `observations.location_name` (§1) and
without exposing coordinates to the client.

**Approach — reverse-geocode server-side at share-read time, with caching:**

The project already has a reverse-geocoding pattern (Nominatim) in
`LocationPicker.tsx`, but that call happens **client-side** at
observation-creation time and its result is entangled with the private
saved-location-name bug described in §1. For sharing, add a **new,
server-side-only** reverse-geocode call:

```ts
// features/observations/public-share-queries.ts
async function resolveShareLocation(lat: number | null, lng: number | null): Promise<string | null> {
  if (lat == null || lng == null) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'birds.in.ua share card' }, next: { revalidate: 60 * 60 * 24 * 30 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? addr.suburb ?? '';
    const region = addr.state ?? addr.county ?? addr.region ?? '';
    if (city && region) return `${city}, ${region}`;
    return city || region || null;
  } catch {
    return null;
  }
}
```

- Cached via Next's `fetch` cache (`next: { revalidate: <30 days> }`) keyed
  by the request URL (i.e. by rounded lat/lng) — reverse geocoding a fixed
  coordinate pair repeatedly is wasteful and Nominatim's usage policy
  requires caching/rate-limiting well-behaved clients.
- Only the resulting string is put into `ObservationShareData.location.displayName`.
  `lat`/`lng` themselves are read inside `getPublicObservationShareData` and
  discarded — never assigned to any field of the DTO, never serialized to
  the client, never passed as page/image props.
- If `lat`/`lng` are both `null` (user didn't set a location), `displayName`
  is `null` and the share card simply omits the location line.
- **Do not read `observations.location_name` in the public path at all** —
  not even as a fallback — because of the private-label contamination in
  §1. This is a hard rule, called out explicitly in code comments at the one
  call site.
- **Missing dependency to flag**: there is no existing city/region column
  anywhere in the schema; this plan introduces the derivation as a pure
  function using the existing Nominatim reverse-geocode endpoint the app
  already depends on (no new external service, no new env var, no API key
  needed — same endpoint as `LocationPicker.tsx`).

---

## 11. Photo selection + attribution

**Observation-photo path:**
- If `observations.photo_url` is set, use it (via `cloudinary_public_id`/
  `cloudinary_resource_type`, same as every other read path in the codebase —
  never reconstruct a Cloudinary URL from a raw column without the stored
  `public_id`, per `docs/contracts/cloudinary-lifecycle.md`).
- Observations currently support exactly one photo per row (`photo_url`
  singular, not an array) — confirmed in `observation-queries.ts` and the
  schema. There is no existing "multiple photos per observation" or
  "cover photo" concept to preserve, so "use the existing cover photo" from
  the prompt is moot for this schema; "otherwise first photo by ordering"
  also doesn't apply. If observations ever gain multiple photos, this is the
  single call site to update.
- `photo.source = 'observation'`, `photo.credit` = the observer's
  `nickname` via `getNickname(observation.user_id)` /
  `features/profile/profile-queries.ts`. **Nicknames already exist** (§1) —
  so, contrary to the prompt's assumption, this is not a blocked
  prerequisite. If the nickname is `null` (user hasn't set one), `credit` is
  `null` and the share card falls back to showing only birds.in.ua branding
  for that line — never the Google account's real name/email
  (`getDisplayName` must NOT be reused here, since it falls back to
  `user_metadata.full_name`/email; a new, stricter resolver is needed:
  `getNickname(userId) ?? null`, with no email/name fallback).

**Default bird-photo path (no observation photo):**
- Use `bird.selected_image` (`WikimediaImage`: `imageUrl`, `author`,
  `license`, `sourceUrl`) if present — same source `BirdImage.tsx` already
  uses for attribution (`© {author} · {license}`). Reuse that exact format
  string for consistency.
- If `selected_image` is null but `bird.image_url` is set (an
  admin-uploaded/Cloudinary default with no Wikimedia attribution), use
  `image_url` with `credit: null` (no attribution data exists for that case
  today).
- `photo.source = 'bird-default'`.

**Missing/deleted photo behavior:**
- If `observations.photo_url` is set but the underlying Cloudinary asset was
  deleted out-of-band (shouldn't happen given the lifecycle contract, but
  external deletion via the Cloudinary dashboard is possible), `ImageResponse`
  fetching the URL will fail. Wrap the `<img>` fetch in the `ShareCard`
  render with a fallback: if the observation photo fails to resolve, fall
  through to the bird-default image rather than rendering a broken image.
  Simplest robust approach: since `ImageResponse`/Satori needs the image
  fetched by the server anyway, `getPublicObservationShareData` can
  `HEAD`/`fetch` the observation photo URL once and fall back to the bird
  default if that fails, so the DTO itself always contains a working URL by
  the time it reaches rendering.
- If **neither** an observation photo nor any bird default image exists
  (a bird with no `selected_image` and no `image_url` — should be rare but
  possible for freshly-added catalog entries), fall back to the same
  `defaultBirdImg` silhouette PNG `BirdImage.tsx` already uses, imported as a
  static asset into `ShareCard`.

---

## 12. Share UX

- **Where Share appears**: `DateGroup.tsx`'s per-row `actions` slot,
  alongside the existing `Pencil` (edit) / `Trash2` (delete) icon buttons —
  same hover-to-reveal treatment (`opacity-0 group-hover:opacity-100`), same
  `w-7 h-7` icon-button sizing, using a `lucide-react` `Share2` icon for
  visual/naming consistency with the rest of the row.
- Needs a look during implementation at
  `features/birds/components/BirdCard/BirdCardBackObservation.tsx` (the
  per-observation view reached via `/birds/[id]?obs=...&flipped=1`, linked
  directly from `ObservationRow`'s chevron) to decide whether Share also
  belongs there for v1 — likely yes, since that's the "detail view" of a
  single observation and a natural second entry point, but `DateGroup` is
  the primary target given the prompt's "existing observation row/card/
  timeline" framing.
- **Loading behavior**: button shows a spinner state while
  `createObservationShareLinkAction` + image fetch are in flight (both are
  awaited before `navigator.share` is invoked, since `navigator.share`
  requires a `File` object up front, not a promise).
- **Native sharing**: `navigator.canShare({ files: [imageFile] })` checked
  before assuming file support; call `navigator.share({ files: [imageFile],
  url: shareUrl, title: ..., text: ... })`.
- **Cancellation**: `navigator.share()` rejects with `DOMException` name
  `AbortError` when the user dismisses the native sheet — caught and
  treated as a normal no-op (no error toast/state), matching how the rest of
  the app treats user-initiated cancellations (e.g. modal `onClose`).
- **Desktop fallback / no file-share support**: render two inline buttons —
  "Copy link" (`navigator.clipboard.writeText(shareUrl)`, with a brief
  "Copied!" confirmation state, consistent with how other copy actions in
  the app would be expected to behave) and "Download image" (create an
  object URL from the already-fetched image blob, trigger a synthetic
  `<a download>` click, matching the exact pattern already used in
  `PhotoGallery.tsx`'s `downloadPhoto()`).
- **No preview modal for v1** — confirmed unnecessary; the existing UI has
  no equivalent "confirm before sharing" step anywhere (e.g. `CollectButton`
  and `ObservationButton` both act immediately), so a share preview modal
  would be a new interaction pattern not otherwise justified.

---

## 13. Image generation

- **Reusable share-card rendering**: `features/observations/components/ShareCard/ShareCard.tsx`
  exports a pure function/component `ShareCard({ data: ObservationShareData, size: '4:5' | 'og' })`
  built only from `<div>`/`<img>`/`<span>` and inline `style` objects (Satori
  constraints — no Tailwind classes, no external stylesheet, since
  `ImageResponse` doesn't process CSS files). Both `opengraph-image.tsx` and
  `image/route.tsx` import this one component and just vary the
  `ImageResponse` `width`/`height` options and pass `size` through.
- **1080×1350 image** (`app/share/observation/[shareSlug]/image/route.tsx`):
  `GET` handler, calls `getPublicObservationShareData`, `notFound`-equivalent
  (404 `Response`) on missing slug, renders `ShareCard` at `size="4:5"`,
  returns `new ImageResponse(<ShareCard .../>, { width: 1080, height: 1350 })`.
- **1200×630 OG image** (`opengraph-image.tsx`): exports `alt`, `size = {
  width: 1200, height: 630 }`, `contentType = 'image/png'`, default export
  renders `ShareCard` at `size="og"` (a horizontally-oriented variant of the
  same layout — same data, different arrangement, per prompt's explicit
  allowance that OG doesn't need to be visually identical).
- **Fonts**: `next/font/google` (`Playfair_Display`, `Lato`, etc., used by
  the rest of the app) do **not** work inside `ImageResponse` — Satori needs
  raw font file buffers passed via the `fonts` option, not CSS variables.
  Plan: bundle one `.ttf` (or two — a display weight and a mono/body weight,
  matching the app's existing `font-heading`/`font-mono` distinction used
  elsewhere, e.g. `ObservationRow`) under `shared/assets/fonts/`, loaded via
  `readFile(join(process.cwd(), 'shared/assets/fonts/<file>.ttf'))` inside
  both image routes (or a small shared `loadShareCardFonts()` helper to
  avoid duplicating the `readFile` calls). Keep the font file small — the
  500KB total `ImageResponse` bundle budget (JSX + CSS + fonts + images)
  includes it.
- **Cloudinary handling**: request an already-downsized, `f_auto/q_auto`
  Cloudinary transformation URL for the photo (reusing
  `cloudinaryThumbnail`-style URL construction, but at a size appropriate for
  a 1080-wide card, e.g. `w_1080,c_fill,q_auto,f_auto`) rather than fetching
  the original full-resolution upload — reduces `ImageResponse` render time
  and avoids Satori needing to downscale a huge image itself. Bird-default
  Wikimedia images are fetched at their existing stored URL as-is (no
  Cloudinary transform available for those).
- **Runtime**: **Node.js runtime**, not Edge — per current Vercel platform
  guidance, Edge is no longer the recommended default and offers no benefit
  here (Fluid Compute already gives good performance on Node), and Node
  gives simpler `node:fs`/`node:path` access for font loading, which the
  official Next.js docs example for custom fonts also assumes. No
  `export const runtime = 'edge'` anywhere in the new files.

---

## 14. Caching/revalidation

Proportional, no new infra:

- **Public share page** (`page.tsx`): a normal dynamic Server Component (it
  calls `getPublicObservationShareData` which does a live DB read plus a
  live-ish geocode fetch) — no explicit `revalidate` export needed; Next's
  default dynamic rendering already reflects "current state" per request,
  matching the "no snapshot" requirement directly. If traffic ever justifies
  it, add `export const revalidate = 60` (short TTL) later — not needed for
  a small app's launch.
- **OG image / 1080×1350 image**: these are the pieces at risk of
  Next's "generated images are statically optimized by default unless they
  use Request-time APIs" behavior (per the official docs excerpt in this
  plan). Since `getPublicObservationShareData` does a live Supabase read
  (a Request-time-ish operation once wrapped in the server client) the
  images will not be fully static-cached across all requests forever, but to
  be explicit and avoid surprises, set `export const revalidate = 3600` (1
  hour) on both image files — short enough that a changed photo/date/rarity
  shows up within an hour, long enough to avoid hammering Nominatim/Cloudinary
  on every share-link open.
- **Reverse-geocode fetch** inside `resolveShareLocation`: cached 30 days via
  `next: { revalidate: ... }` on the `fetch` call itself (coordinates for a
  given observation essentially never need fresher-than-30-days geocoding).
- **No stored/rendered image files** — nothing is written back to Cloudinary
  or disk; every image request regenerates from current DB state, matching
  the "reflect current observation state" requirement and avoiding the
  "elaborate infrastructure" the prompt says to avoid.
- **No `updated_at` column needed** — there's no cache keyed on a
  content-hash/version, so nothing to invalidate by comparing timestamps;
  the 1-hour TTL alone satisfies "not stale forever."

---

## 15. Security/privacy review

Confirmed non-leaks:

- **Coordinates**: `lat`/`lng` are read only inside
  `getPublicObservationShareData`/`resolveShareLocation` and never assigned
  to any DTO field, never passed to a Client Component, never serialized
  into page props or image props.
- **Saved-location private names**: the public path never reads
  `observations.location_name` (§10) — the one field known to sometimes
  contain a private saved-location label — at all. `saved_locations.name` is
  never queried by the public path in the first place (no join to
  `saved_locations` exists in `getPublicObservationShareData`).
- **Notes**: `ObservationShareData` has no `notes` field; the public query's
  `select()` column list omits `notes` entirely (not fetched, not just
  hidden in the type).
- **Internal IDs**: the DTO exposes `shareSlug` (already public-by-design)
  but never the observation's real `uuid`, never `user_id`, never `bird_id`
  as a bare number in a way that would let someone probe `/birds/[id]`
  private-observation state (the catalog `/birds/[id]` page is already
  public for browsing the catalog itself, so exposing which bird a public
  share is about is fine — it's the *observation* and its owner that must
  stay private).
- **Auth/profile fields**: the only profile data exposed is an optional
  `nickname` (already a public-facing display concept used in
  `AppHeader`/wherever nicknames render today) — never `email`, never
  `user_metadata.full_name`, never `role`.
- **Deleted observations**: `getPublicObservationShareData` returns `null`
  if no row matches `share_slug` — this covers both "slug never existed" and
  "observation was deleted" identically (a hard delete removes the row
  entirely, so the query naturally returns nothing; no soft-delete/tombstone
  needed).
- **Deleted/missing Cloudinary photos**: handled by the fallback chain in
  §11 — never renders a broken `<img>`, always falls through to the bird
  default or silhouette.
- **Malformed/invalid slugs**: `shareSlug` route param is used only as an
  exact-match filter value in a parameterized Supabase query (`.eq('share_slug', shareSlug)`)
  — no string interpolation into SQL, no risk of injection; a malformed slug
  simply matches no row → `notFound()`.
- **Rate abuse of dynamic image endpoints**: acceptable risk for a small
  personal app per the prompt's "don't overengineer" guidance; the 1-hour
  cache (§14) already absorbs repeated requests for the same slug. If this
  becomes a real problem later, add a lightweight per-IP rate limit at the
  route-handler level — not needed for v1.
- **Caching private data**: nothing private is ever computed into the
  cached image/page in the first place (see all points above), so there is
  no "cache holds a secret" failure mode to guard against.
- **Enumeration**: slugs are generated with `crypto.randomUUID()` (122 bits
  of entropy) — brute-forcing a valid slug is infeasible, and there is no
  endpoint that lists or paginates share slugs.
- **Ownership of share creation**: `createObservationShareLinkAction` can
  only ever create/return a slug for an observation the caller owns, enforced
  via the same `getObservationForUser(id)` ownership-scoped read every other
  observation mutation already uses.

---

## 16. Implementation order

Each slice leaves the app in a working, deployable state.

1. **Data model** — both migrations (§4), run via `supabase db push`. No
   application code changes yet; purely additive columns.
2. **First-observation tracking** — `first_observation_id` population wired
   into `addObservation` (§9); unit tests for creation/backdating/deletion
   behavior. No UI change yet (badge wiring comes later, optional).
3. **Slug/share activation** — `shared/lib/slug.ts`,
   `share-mutations.ts::createObservationShareLinkAction`, tests for
   idempotency + ownership denial. No UI yet — action exists and is tested
   but unreachable from the app.
4. **Public share query** — `public-share-queries.ts::getPublicObservationShareData`
   + `resolveShareLocation`, with the "never read location_name" rule
   enforced and tested. Still no route/page yet.
5. **Public share page** — `app/share/observation/[shareSlug]/page.tsx`,
   `notFound()` handling, `noindex` metadata. Reachable only by directly
   typing a slug (none exist yet since nothing creates them from the UI) —
   safe to ship.
6. **OG image** — `opengraph-image.tsx`. Verify unfurl in a link-preview
   tool (e.g. paste the URL into a scratch Slack/Discord message, or use a
   local OG-preview tool) against a manually-inserted test `share_slug`.
7. **1080×1350 share image** — `image/route.tsx` + shared `ShareCard`
   component (refactor OG image to use `ShareCard` too, if step 6 didn't
   already factor it out).
8. **Share UI** — `ShareObservationButton`, wired into `DateGroup.tsx`. This
   is the first slice where a real user can reach the whole flow
   end-to-end.
9. **Fallback UX polish** — Copy link / Download image states, cancellation
   handling, loading states.
10. **Tests** — fill in any gaps left by the above (each slice above should
    already carry its own tests; this step is for integration-style
    coverage of the full click-to-share flow and any UI states not covered
    inline).
11. **Docs** — `docs/guides/app-guide.md`, `bird-guide-prompt.ts` `APP_GUIDE`,
    `docs/contracts/data-fetching.md` callout (per CLAUDE.md's mandatory
    "keep docs in sync" rule) — do this alongside step 8, not deferred to
    the very end, so the docs commit lands with the feature commit.

---

## 17. Testing plan

Per `docs/guides/testing.md` conventions (Vitest, mock Supabase/Cloudinary/
auth at the boundary, no real network calls).

- **Unit — slug generation**: produces a non-empty, URL-safe string; two
  calls produce different values.
- **Unit — `resolveShareLocation`**: given a mocked `fetch` returning a
  Nominatim-shaped payload, returns `"City, Region"`; given only `city`
  or only `region`, returns just that; given a failed/erroring fetch,
  returns `null` without throwing; given `lat`/`lng` both `null`, returns
  `null` without calling `fetch` at all.
- **Query — `getPublicObservationShareData`**:
  - Valid slug → returns a fully-populated DTO with no `notes`, no `lat`/
    `lng`, no raw `user_id`/observation `uuid` field.
  - Invalid/unknown slug → returns `null`.
  - Deleted observation's old slug → returns `null` (row genuinely gone).
  - Observation photo present → `photo.source === 'observation'`,
    `photo.credit` reflects the owner's nickname (or `null` if unset) — and
    explicitly **not** their email or Google full name even when a mocked
    user has those set.
  - No observation photo, bird has `selected_image` → falls back to bird
    photo with Wikimedia credit.
  - No observation photo, no `selected_image`, but `image_url` set → bird
    photo with `credit: null`.
  - No photo anywhere → silhouette fallback, no crash.
  - `first_observation_id === this observation's id` → `isFirstObservationOfSpecies: true`; otherwise `false`; `null` on the `collected_birds` row → `false`.
  - Confirms `location_name` column is never referenced by asserting the
    mock never receives a `select` including it (or via a targeted
    code-level check) — guards against regression of the §1 bug.
- **Ownership tests — `createObservationShareLinkAction`**:
  - Unauthenticated caller → rejected (via `requireAuth()` mock).
  - Authenticated caller, observation belongs to another user → error, no
    slug created/returned.
  - Authenticated owner, no existing slug → creates and persists one.
  - Authenticated owner, existing slug → returns the same slug, does not
    create a second one or overwrite the column (assert the update/insert
    call is never made on the second invocation).
- **Unauthorized-access / RLS-boundary tests**: assert
  `getPublicObservationShareData` uses the service-role client (mock
  `supabaseAdmin`, not `createSupabaseServerClient`), and that no other new
  function in this feature imports `supabaseAdmin`.
- **Location privacy tests**: construct an observation whose `location_name`
  is deliberately set to a fake private label (e.g. "My secret owl spot")
  and confirm the DTO's `location.displayName` comes only from the mocked
  geocode result, never from `location_name`.
- **First-observation tests** (§9, in `observation-queries.test.ts` or a new
  `collection-first-observation.test.ts`):
  - First-ever observation of a species → `first_observation_id` is set to
    the new row's id.
  - Second observation of an already-collected species → `first_observation_id`
    unchanged.
  - Backdated older observation added after an existing first → original
    `first_observation_id` unchanged (exact scenario from the prompt).
  - Deleting the observation referenced by `first_observation_id` → column
    becomes `null` (exercise this against a real/local Postgres in an
    integration test if the project has one, otherwise assert the FK
    `on delete set null` behavior is present in the migration and covered by
    a Supabase-level test if such tests exist elsewhere in the repo —
    otherwise document it as DB-enforced, not app-enforced, behavior).
- **Image fallback tests**: `ShareCard`/image-route level — observation
  photo URL that fails to resolve falls through to bird default; bird
  default missing too falls through to silhouette; each renders without
  throwing (snapshot-free — assert on which image source was actually
  selected/passed to the renderer, not on pixel output, per the "avoid
  broad snapshots" testing rule).
- **No-photo observation**: full DTO builds correctly with `photo.source === 'bird-default'`.
- **Deleted observation**: page-level test — `getPublicObservationShareData`
  mocked to return `null` → page calls `notFound()`.
- **Invalid share slug**: same as above via a malformed/random string.
- **Mobile share API feature detection**: component test for
  `ShareObservationButton` — mock `navigator.share`/`canShare` present vs.
  absent, assert the correct branch (native share vs. Copy link/Download
  image) renders; mock `navigator.share` rejecting with `AbortError` and
  assert no error state is shown.

---

## 18. Backfill / existing data

- **`share_slug`**: nullable, no backfill needed — existing observations
  simply have no share link until a user presses Share for the first time,
  which lazily creates one. No migration data step required.
- **`collected_birds.first_observation_id`**: nullable. Existing
  `collected_birds` rows predate this feature and have no natural
  "first observation" recorded (the concept didn't exist when they were
  created). Two backfill options:
  1. **Leave `null` for all existing rows (recommended)**. Correct and
     honest: for a user's pre-existing collection, there genuinely isn't a
     tracked "first" observation, so the share card's "First time" badge
     simply never appears on any observation logged before this feature
     ships, even if it actually was chronologically first. This matches the
     prompt's "if the existing architecture already stores equivalent
     information, reuse it — otherwise don't invent it" spirit; there is no
     safe way to *guess* which historical observation the user would have
     called "first."
  2. **Deterministic backfill (optional, discuss with user before running)**:
     for every `(user_id, bird_id)` in `collected_birds` with a null
     `first_observation_id`, set it to the observation with the minimum
     `(observed_at, id)` for that pair — i.e., reuse the exact logic
     `getFirstEncounterObservationIds` already computes today. **Limitation**:
     this makes a retroactive, unverifiable assumption (earliest-by-date ==
     "first ever logged"), which is precisely the assumption the prompt
     asks us to avoid going forward. If the user wants existing collections
     to show a "First time" badge on old data, this is the only feasible
     backfill, but it should be a one-time `scripts/` data script (per
     `docs/guides/database-migrations.md`: "data-only scripts... stay in
     `scripts/`, not `supabase/migrations/`"), run explicitly and
     reviewed — not silently included in the feature's migration.
  This plan defaults to option 1 and treats option 2 as an explicit,
  separate follow-up if requested (see Open Questions).

---

## 19. Open questions

Only genuine product decisions — everything resolvable from the existing
codebase/spec has already been decided above.

1. **Two "first" concepts, or unify them?** The Journal timeline's existing
   `isFirstEncounter` (earliest-by-date, recalculated) will now coexist with
   the new stable `first_observation_id` (creation-order, fixed). Do you
   want the Journal's badge to keep its current "earliest sighting date"
   meaning, or should it be migrated to reuse the new stable concept too
   (which would change its behavior slightly — see §9's backdating example)?
   This plan leaves the Journal badge untouched and adds the new stable one
   only for the share card, but they're visually similar
   (`1st-time-badge.png`) and could confuse a user who sees the badge move
   in the Journal but not on a share card for the same observation.
2. **Backfill for existing collections** (§18, option 2): do you want a
   one-time deterministic backfill script so long-time users' oldest
   logged observations can show the "First time" badge on a share card, or
   is leaving all pre-existing `collected_birds` rows with
   `first_observation_id = null` (never showing the badge on old data)
   acceptable?
3. **Slug generation primitive**: `crypto.randomUUID()` (already used by
   Postgres via `gen_random_uuid()` and needs no new dependency) vs. adding
   `nanoid` for a shorter, more shareable-looking URL (e.g. `nanoid(12)` ≈
   21 chars shorter than a UUID's 36). This plan defaults to
   `crypto.randomUUID()` for zero new dependencies, but the resulting share
   URL is noticeably longer
   (`/share/observation/8f14e45f-ceea-467e-b331-5a...`) than the prompt's
   own example (`/share/observation/a8Kq...`). Confirm whether URL length/
   aesthetics matter enough to add the `nanoid` dependency.
4. **Second Share entry point**: should Share also appear on the
   per-observation flipped-card view
   (`BirdCardBackObservation.tsx`/`/birds/[id]?obs=...`), or is the Journal
   timeline row (`DateGroup.tsx`) sufficient for v1?
