# Cloudinary Asset Lifecycle

BirdDex stores media in Cloudinary for four asset types: bird images, bird sounds, location photos, and observation photos. This doc is the contract for how those assets are created, replaced, and deleted. Read this before touching any upload/replace/delete flow.

## 1. Core rule

**The server owns the Cloudinary lifecycle.** The client may choose a file to upload, but is never trusted as the source of truth for `secure_url`, `public_id`, `resource_type`, or "which asset is the old one." All of those values are either read from the database server-side or taken directly from a Cloudinary upload result — never from client input (FormData fields, hidden inputs, request body).

## 2. Safe replacement order

For any flow that replaces an existing asset:

1. Auth check (`requireAuth()` or `requireAdmin()`)
2. Ownership check if the record is user-owned (scope the DB read/write by `user_id`)
3. Fetch the existing row from the DB (this is where the *old* `public_id`/`resource_type` comes from)
4. Upload the new asset to Cloudinary
5. Write the DB row with the new `secure_url` / `public_id` / `resource_type`
6. If the DB write fails: delete the newly uploaded asset, then surface the error
7. Only after the DB write succeeds: delete the old asset (using the `public_id`/`resource_type` fetched in step 3)
8. Log cleanup failures; do not let a cleanup failure fail the user-facing action

## 3. Safe create flow

For any flow that creates a new asset:

1. Auth check
2. Validate input and file (type, size) before touching Cloudinary
3. Upload to Cloudinary
4. Insert the DB row
5. If the DB insert fails: delete the newly uploaded asset

Upload and DB write must happen in the same server action. Do not split "upload" and "save" into separate steps/requests — that creates a window where an abandoned form leaves an orphaned Cloudinary asset with no DB row pointing to it.

## 4. Safe delete flow

For any flow that deletes a record with an attached asset:

1. Auth check
2. Ownership/admin check
3. Fetch the DB row, including its stored `public_id`/`resource_type`
4. Delete the DB row first
5. Only after the DB delete succeeds: delete the Cloudinary asset using the `public_id`/`resource_type` fetched in step 3
6. If the DB delete fails, do not touch Cloudinary
7. If the Cloudinary cleanup fails after a successful DB delete, log it — the user-facing action still reports success, since the DB state (the source of truth) is already correct

If a record has more than one asset (e.g. a bird has both an image and a sound), clean up **all** of them on delete.

## 5. Required database fields

Every persisted Cloudinary asset must store three things:

- display URL (`secure_url`)
- Cloudinary `public_id`
- Cloudinary `resource_type`

Expected coverage:

| Asset            | Table          | URL column    | public_id column     | resource_type column     |
| ---------------- | -------------- | ------------- | -------------------- | ------------------------ |
| Bird image        | `birds`        | `image_url`   | `image_public_id`     | `image_resource_type`     |
| Bird sound         | `birds`        | `sound_url`   | `sound_public_id`     | `sound_resource_type`     |
| Location photo     | `saved_locations` | `photo_url` | `photo_public_id`     | *(not yet present — resource type is hardcoded to `'image'` at every call site; add a `photo_resource_type` column before location photos can be anything other than images)* |
| Observation photo  | `observations` | `photo_url`   | `cloudinary_public_id` | `cloudinary_resource_type` |

Bird sounds are uploaded and deleted with Cloudinary `resource_type: 'video'`, not `'audio'` — Cloudinary has no `'audio'` resource type, and audio files must be treated as `'video'` for upload/delete calls. `sound_resource_type` stores this value; do not assume `'audio'` when writing or reading it.

Use `toCloudinaryResourceType()` (`shared/lib/cloudinary-utils.ts`) to safely coerce a nullable DB-stored `resource_type` string into a valid Cloudinary resource type before any delete/replace call — every call site in `features/birds/actions/*` and `features/observations/actions/observation-mutations.ts` goes through it.

## 6. Server-only boundary

- The Cloudinary SDK (`shared/lib/cloudinary.ts`) must only be imported from server-only modules (Server Actions, server query files).
- Any module that imports the Cloudinary SDK must start with `import "server-only"`.
- Client components must never import `shared/lib/cloudinary.ts` directly. They may import `shared/lib/cloudinary-utils.ts` (pure string helpers, no SDK, no secrets) for display purposes (e.g. deriving a `CldImage` `src` from a URL).
- Secrets (`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) must never be exposed via `NEXT_PUBLIC_*` env vars. Only `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is intentionally public.

## 7. Do-not-reintroduce list

- Trusting a client-supplied `public_id` as authoritative
- Trusting a client-supplied `oldPhotoPublicId` (or similar) as authoritative
- Production deletion that parses `public_id` out of a URL string (e.g. via `cloudinaryPublicId()`) instead of reading the stored `public_id`/`resource_type` columns — URL parsing is fine for **display** helpers, never for deletion
- Deleting the old asset before the DB successfully points to the new one
- Calling `cloudinary.uploader.destroy()` directly inside a feature action — always go through `deleteCloudinaryAsset()` in `shared/lib/cloudinary.ts` so failures are logged consistently
- Swallowing cleanup errors with `.catch(() => {})` — use `deleteCloudinaryAsset()`, which logs failures instead of silently discarding them
- A separate "upload, then save" two-step flow with no way to reconcile an abandoned upload (no pending-upload tracking table exists in this project — don't introduce this pattern without one)

## 8. Test checklist

Any change to a Cloudinary upload/replace/delete flow should be covered by tests for:

- Upload succeeds, DB write fails → the newly uploaded asset is deleted
- Upload fails → DB is untouched, old asset is untouched
- DB write succeeds → old asset is deleted only after the DB write, in that order
- Ownership/auth check fails → no Cloudinary upload or delete call happens
- Delete uses the DB-stored `public_id`/`resource_type`, not URL parsing or client input
- Cleanup delete fails → failure is logged, but the action still reports success if the DB step succeeded

## 9. Sensitive files

These files implement or depend on the lifecycle rules above — read this doc before editing any of them:

- `shared/lib/cloudinary.ts`
- `shared/lib/cloudinary-utils.ts` (includes `toCloudinaryResourceType()`, the shared normalization point used before every delete/replace call)
- `features/birds/actions/cloudinary-upload.ts`
- `features/birds/actions/bird-mutations.ts`
- `features/birds/actions/delete-bird-mutation.ts`
- `features/birds/bird-queries.ts`
- `features/observations/actions/observation-mutations.ts`
- `features/observations/observation-queries.ts`
- `features/locations/actions/location-mutations.ts`
- `features/locations/location-queries.ts`
