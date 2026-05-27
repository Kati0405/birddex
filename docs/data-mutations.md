# Data Mutations

## CRITICAL RULES — Do not violate these under any circumstances

### 1. Server Actions Only

ALL data mutations MUST be done via **Server Actions**.

- **NEVER** mutate data in Client Components directly
- **NEVER** mutate data via Route Handlers (`app/api/...`)
- Server Actions must be defined in colocated `actions.ts` files, placed next to the route or component they serve (e.g. `app/birds/actions.ts`)
- Mark the file with `"use server"` at the top — do not use per-function `"use server"` directives

### 2. Use Helper Functions in `/data` — No Inline Mutations

ALL database writes (insert, update, delete) MUST go through helper functions defined in the `/data` directory.

- **NEVER** write database calls inline inside a Server Action
- If a mutation helper does not exist yet, create one in the appropriate `/data` file first, then call it from the action

### 3. Typed Parameters — No `FormData`

Every Server Action MUST have fully typed parameters.

- **NEVER** use `FormData` as a parameter type
- Define an explicit TypeScript type or interface for every action's arguments
- Derive the type from the Zod schema (see rule 4) using `z.infer<>` — do not duplicate types manually

### 4. Validate All Arguments with Zod

Every Server Action MUST validate its arguments with a Zod schema before doing anything else.

- **NEVER** trust or use action arguments before they have been parsed by Zod
- If validation fails, return a structured error — do not throw
- Keep Zod schemas co-located in the same `actions.ts` file unless they are reused elsewhere

## Pattern to Follow

```ts
// app/birds/actions.ts
"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { createBird } from "@/data/birds";

const CreateBirdSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().min(1),
  notes: z.string().optional(),
});

type CreateBirdInput = z.infer<typeof CreateBirdSchema>;

export async function createBirdAction(input: CreateBirdInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = CreateBirdSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  await createBird({ ...parsed.data, userId: session.user.id });
  return { success: true };
}
```

```ts
// data/birds.ts — mutation helper
import { db } from "@/lib/db";

export async function createBird(data: {
  name: string;
  species: string;
  notes?: string;
  userId: string;
}) {
  return db.bird.create({ data });
}
```

```tsx
// app/birds/new/page.tsx — calling the action from a Client Component
"use client";

import { createBirdAction } from "../actions";

export default function NewBirdForm() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    await createBirdAction({
      name: form.birdName.value,
      species: form.species.value,
    });
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## What Not to Do

```ts
// WRONG — using FormData
export async function createBirdAction(formData: FormData) { ... }

// WRONG — no Zod validation
export async function createBirdAction(input: CreateBirdInput) {
  await db.bird.create({ data: input }); // input is untrusted
}

// WRONG — database call inline in the action
export async function createBirdAction(input: CreateBirdInput) {
  const parsed = CreateBirdSchema.safeParse(input);
  await db.bird.create({ data: parsed.data }); // must go through /data helper
}

// WRONG — mutation in a Route Handler
// app/api/birds/route.ts
export async function POST(req: Request) {
  await db.bird.create(...);
}

// WRONG — action defined inline in a component file
// app/birds/page.tsx
async function createBird() {
  "use server";
  ...
}
```
