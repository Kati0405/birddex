# Data Fetching

## CRITICAL RULES — Do not violate these under any circumstances

### 1. Server Components Only

ALL data fetching MUST be done exclusively in **Server Components**.

- **NEVER** fetch data in Client Components (`"use client"`)
- **NEVER** fetch data in Route Handlers (`app/api/...`)
- **NEVER** use `useEffect`, `fetch`, SWR, React Query, or any client-side fetching pattern
- If a component needs data, it must be a Server Component, or the data must be passed down as props from a Server Component parent

There are no exceptions to this rule.

### 2. Use Helper Functions in `/data` — No Raw SQL

ALL database queries MUST go through helper functions defined in the `/data` directory.

- **NEVER** write raw SQL inline in components or anywhere outside `/data`
- If a query does not have a helper function yet, create one in the appropriate `/data` file first, then call it

### 3. Users Can Only Access Their Own Data

Every query helper in `/data` MUST be scoped to the currently authenticated user.

- **ALWAYS** filter queries by the logged-in user's ID
- **NEVER** return data that belongs to another user
- **NEVER** accept a `userId` as an untrusted parameter from the client — always derive the user ID from the server-side session
- Before returning any record, verify it belongs to the current user. If it does not, return `null` or throw an authorization error — never return it

This is a security requirement. A breach here exposes other users' private data.

## Pattern to Follow

```ts
// data/birds.ts — correct pattern
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getUserBirds() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db.bird.findMany({
    where: { userId: session.user.id },
  });
}
```

```tsx
// app/birds/page.tsx — correct pattern (Server Component)
import { getUserBirds } from "@/data/birds";

export default async function BirdsPage() {
  const birds = await getUserBirds();
  return <BirdList birds={birds} />;
}
```

## What Not to Do

```ts
// WRONG — raw SQL
const birds = await db.$queryRaw`SELECT * FROM birds`;

// WRONG — no user scoping
export async function getBirds() {
  return db.bird.findMany(); // returns ALL users' birds
}

// WRONG — trusting client-supplied userId
export async function getBirds(userId: string) {
  return db.bird.findMany({ where: { userId } }); // caller controls the filter
}

// WRONG — fetching in a Client Component
"use client";
useEffect(() => { fetch("/api/birds").then(...) }, []);

// WRONG — fetching in a Route Handler instead of a Server Component
// app/api/birds/route.ts
export async function GET() { ... }
```
