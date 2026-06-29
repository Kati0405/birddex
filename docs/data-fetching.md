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

### 3. Users Can Only Access Their Own Data

Every query helper in `/data` MUST be scoped to the currently authenticated user.

- **ALWAYS** filter queries by the logged-in user's ID
- **NEVER** return data that belongs to another user
- **NEVER** accept a `userId` as an untrusted parameter from the client — always derive the user ID from the server-side session
- Before returning any record, verify it belongs to the current user. If it does not, return `null` or throw an authorization error — never return it

This is a security requirement. A breach here exposes other users' private data.

## Pattern to Follow

```ts
// features/birds/bird-queries.ts — correct pattern
import { requireAuth } from "@/features/auth/auth-helpers";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export async function getUserBirds() {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("birds")
    .select("*")
    .eq("user_id", user.id);

  return data ?? [];
}
```

```tsx
// app/birds/page.tsx — correct pattern (Server Component)
import { getUserBirds } from "@/features/birds/bird-queries";

export default async function BirdsPage() {
  const birds = await getUserBirds();
  return <BirdList birds={birds} />;
}
```

## What Not to Do

```ts
// WRONG — raw SQL
const { data } = await supabase.rpc("raw_query", { sql: "SELECT * FROM birds" });

// WRONG — no user scoping
export async function getBirds() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("birds").select("*"); // returns ALL users' birds
  return data;
}

// WRONG — fetching in a Client Component
"use client";
useEffect(() => { fetch("/api/birds").then(...) }, []);

// WRONG — fetching in a Route Handler instead of a Server Component
// app/api/birds/route.ts
export async function GET() { ... }
```
