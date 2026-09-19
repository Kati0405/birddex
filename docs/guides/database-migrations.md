# Database migrations

Schema changes are tracked as timestamped SQL files in `supabase/migrations/`, applied via the Supabase CLI. This replaced the earlier approach of running loose `.sql` files from `scripts/` by hand in the Supabase SQL Editor — that approach left the schema untracked, so a project pause/restore or `db reset` could silently drop columns/constraints that were never recorded anywhere durable.

## Two Supabase projects: dev and prod

This app has **two separate Supabase projects**, not one project with environments inside it:

| Project name       | Ref                     | Used by |
|---------------------|-------------------------|---------|
| `BirdDex-dev`        | `rxpafqcecuborfhtskay`  | Local development — this is what `.env.local`'s `NEXT_PUBLIC_SUPABASE_URL` points to, and what `npm run dev` / local scripts talk to. |
| `birds.in.ua-prod`   | `wumnvytsluzgwofghngv`  | Production (Vercel deployment). |

The Supabase CLI is only ever linked to **one** of these at a time (`supabase/.temp/project-ref` records which). Running `supabase db push` (or `migration repair`, `migration list`, etc.) only affects whichever project is currently linked — **it does not touch the other one**.

This means every schema change needs to be pushed **twice** — once per project:

```bash
supabase link --project-ref rxpafqcecuborfhtskay   # dev
supabase db push

supabase link --project-ref wumnvytsluzgwofghngv   # prod
supabase db push
```

Leave the CLI linked to **dev** (`rxpafqcecuborfhtskay`) when you're done, since that's what local development and `.env.local` actually use — re-link to prod only for the push, then switch back.

Forgetting the second push is the most likely way to get dev and prod out of sync — e.g. a data script or backfill that queries `.env.local`'s project (dev) will silently fail or no-op if you only pushed to whichever project happened to be linked at the time. Run `supabase migration list` after linking to a project to confirm its `remote` column matches `local` for every migration before assuming a schema change is live everywhere.

## One-time setup

```bash
npm install -g supabase          # or: npx supabase <command> for one-offs
supabase login                   # opens browser auth
supabase link --project-ref <your-project-ref>   # rxpafqcecuborfhtskay (dev) or wumnvytsluzgwofghngv (prod) — see above
```

## Creating a migration

```bash
supabase migration new <short_description>
```

This creates `supabase/migrations/<timestamp>_<short_description>.sql`. Write plain SQL (`ALTER TABLE`, `CREATE TABLE`, etc.) using `IF NOT EXISTS` / `IF EXISTS` guards where practical so migrations are safe to re-run.

## Applying a migration

```bash
supabase db push
```

This applies any migrations not yet recorded in the linked project's `supabase_migrations.schema_migrations` table, in timestamp order.

## Checking current state

```bash
supabase migration list
```

Shows which migrations exist locally vs. which have been applied remotely.

## Rules

- Every schema change (new column, constraint, index, table) must be a new migration file — never hand-edit schema directly in the Supabase dashboard SQL Editor for anything meant to persist.
- Every migration must be pushed to **both** the dev and prod Supabase projects (see above) — pushing to only the currently-linked project silently leaves the other one behind.
- Never edit an already-applied migration file. If a change needs fixing, write a new migration.
- Data-only scripts (seeding, one-off backfills, Cloudinary asset migration) stay in `scripts/` — they are not schema changes and don't belong in `supabase/migrations/`.
- After `supabase db push`, if the app still reports "Could not find column X in schema cache," reload PostgREST's schema cache: Supabase dashboard → Database → API → "Reload schema cache" (or wait a few seconds for auto-reload).
