# Data Fetching

## CRITICAL RULES — Do not violate these under any circumstances

### 1. Server Components Only

ALL data fetching MUST be done exclusively in **Server Components**.

- **NEVER** fetch data in Client Components (`"use client"`)
- **NEVER** fetch data in Route Handlers (`app/api/...`)
- **NEVER** use `useEffect`, `fetch`, SWR, React Query, or any client-side fetching pattern
- If a component needs data, it must be a Server Component, or the data must be passed down as props from a Server Component parent

There are no exceptions to this rule.

### 2. Use Helper Functions in `features/*/queries` — No Raw SQL

ALL database queries MUST go through helper functions defined in feature query files (e.g. `features/birds/bird-queries.ts`, `features/observations/observation-queries.ts`).

- **NEVER** write raw SQL inline in components or anywhere outside query files
- If a query does not have a helper function yet, create one in the appropriate `*-queries.ts` file first, then call it

### 3. Scope Queries According to Data Ownership

Not all birds.in.ua data is user-owned.

- Global catalog data, such as `birds`, may be read without filtering by `user_id`
- User-owned data, such as observations, collected birds, and user locations, MUST be scoped to the currently authenticated user
- NEVER accept a `userId` from the client as the source of truth
- For user-owned data, derive the user ID from the server-side session with `requireAuth()`
- Before returning a user-owned record, verify that it belongs to the current user

Use the database model and the relevant feature documentation to determine whether data is global or user-owned.

### Exception: public observation shares

`features/observations/public-share-queries.ts::getPublicObservationShareData(shareSlug)` is the **one deliberate exception** to "user-owned data must be scoped by the currently authenticated user." It reads an observation on behalf of an anonymous visitor who holds an unlisted share link (`/share/observation/[shareSlug]`), so there is no `requireAuth()` user to scope by.

Rules specific to this function, on top of everything above:

- It uses `supabaseAdmin` (service-role, bypasses RLS) rather than the cookie-bound server client — this is intentional, not a missing-RLS-policy workaround. `observations` deliberately has **no** anonymous-read RLS policy (adding one would let any anonymous client enumerate every shared observation via the Supabase REST API, not just the one a visitor has a link to).
- It selects an explicit, narrow column list and returns only the `ObservationShareData` DTO — never the raw row, never `notes`, never `lat`/`lng`, never a raw `user_id`.
- It is called only from the public share page and its two `ImageResponse` routes (`app/share/observation/[shareSlug]/`) — never from a Client Component, never exposed as a Server Action.
- See `docs/specs/observation-sharing.md` for the full design rationale, including why `observations.location_name` is never read here.

## Pattern to Follow

```ts
// features/birds/bird-queries.ts — global catalog data
import { supabase } from '@/shared/lib/supabase';

export async function getBirds() {
  const { data, error } = await supabase.from('birds').select('*').order('id');

  if (error) {
    throw new Error(`getBirds: ${error.message}`);
  }

  return data ?? [];
}
```

```tsx
// app/birds/page.tsx — correct pattern (Server Component)
import { getBirds } from '@/features/birds/bird-queries';

export default async function BirdsPage() {
  const birds = await getBirds();
  return <BirdList birds={birds} />;
}
```

## What Not to Do

```ts
// WRONG — raw SQL
const { data } = await supabase.rpc("raw_query", { sql: "SELECT * FROM birds" });

// WRONG — user-owned data is fetched without requireAuth() or user_id filtering
export async function getObservations() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('observations')
    .select('*');

  return data;
}

// WRONG — fetching in a Client Component
"use client";
useEffect(() => { fetch("/api/birds").then(...) }, []);

// WRONG — fetching in a Route Handler instead of a Server Component
// app/api/birds/route.ts
export async function GET() { ... }
```
