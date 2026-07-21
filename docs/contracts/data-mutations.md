# Data Mutations

## CRITICAL RULES — Do not violate these under any circumstances

### 1. Server Actions Only

ALL data mutations MUST be done via **Server Actions**.

- **NEVER** mutate data in Client Components directly
- **NEVER** mutate data via Route Handlers (`app/api/...`)
- Server Actions must be defined in colocated action files within the feature directory (e.g. `features/birds/actions/bird-mutations.ts`)
- Mark the file with `"use server"` at the top — do not use per-function `"use server"` directives

### 2. Use Helper Functions in `features/*/queries` — No Inline Mutations

ALL database writes (insert, update, delete) MUST go through helper functions defined in feature query files (e.g. `features/birds/bird-queries.ts`, `features/locations/location-queries.ts`).

- **NEVER** write database calls inline inside a Server Action
- If a mutation helper does not exist yet, create one in the appropriate `*-queries.ts` file first, then call it from the action

### 3. Typed Parameters — No `FormData` (except file uploads)

Server Actions should use fully typed parameters whenever no file upload is involved.

- **NEVER** use `FormData` as a parameter type for non-file actions
- Define an explicit TypeScript type or interface for every action's arguments
- Derive the type from the Zod schema (see rule 4) using `z.infer<>` — do not duplicate types manually
- **Exception**: Actions that accept a file may use `FormData` for the whole form payload. Non-file fields from `FormData` must still be converted explicitly and validated with Zod before use. These actions must still validate the file (type, size) and call `requireAuth()` / `requireAdmin()` at the top

### 4. Validate All Arguments with Zod

Every Server Action MUST validate all untrusted input with Zod before using that input in business logic or database operations.

- **NEVER** trust or use action arguments before they have been parsed by Zod
- If validation fails, return a structured error — do not throw
- Keep Zod schemas co-located in the same `actions.ts` file unless they are reused elsewhere

## Pattern to Follow

```ts
// features/locations/actions/location-mutations.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/auth-helpers';
import { saveLocation } from '@/features/locations/location-queries';
import { getErrorMessage } from '@/shared/lib/errors';

const RenameLocationSchema = z.object({
  name: z.string().min(1).max(100),
  lat: z.number(),
  lng: z.number(),
});

type RenameLocationInput = z.infer<typeof RenameLocationSchema>;

export async function renameLocationAction(input: SaveLocationInput) {
  await requireAuth();

  const parsed = SaveLocationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().toString() };

  try {
    await saveLocation(parsed.data.name, parsed.data.lat, parsed.data.lng);
  } catch (e) {
    return { error: getErrorMessage(e) };
  }

  revalidatePath('/locations');
  return { success: true };
}
```

```ts
// features/locations/location-queries.ts — mutation helper
import { requireAuth } from '@/features/auth/auth-helpers';
import { createSupabaseServerClient } from '@/shared/lib/supabase-server';

export async function saveLocation(
  name: string,
  lat: number,
  lng: number,
  photoUrl?: string | null,
  photoPublicId?: string | null,
  habitats?: string[],
): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from('saved_locations').insert({
    user_id: user.id,
    name,
    lat,
    lng,
    photo_url: photoUrl ?? null,
    photo_public_id: photoPublicId ?? null,
    habitats: habitats ?? [],
  });

  if (error) {
    throw new Error(`saveLocation: ${error.message}`);
  }
}
```

## What Not to Do

```ts
// WRONG — using FormData for an action that has no file input
export async function renameLocationAction(formData: FormData) { ... }

// WRONG — no Zod validation
export async function saveLocationAction(input: SaveLocationInput) {
  await saveLocation(input.name, input.lat, input.lng); // input is untrusted
}

// WRONG — database call inline in the action
export async function saveLocationAction(input: SaveLocationInput) {
  const parsed = SaveLocationSchema.safeParse(input);
  const supabase = await createSupabaseServerClient();
  await supabase.from("saved_locations").insert(parsed.data); // must go through query helper
}

// WRONG — mutation in a Route Handler
// app/api/locations/route.ts
export async function POST(req: Request) { ... }

// WRONG — action defined inline in a component file
// app/locations/page.tsx
async function saveLocation() {
  "use server";
  ...
}
```
