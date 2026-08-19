# Database migrations

Schema changes are tracked as timestamped SQL files in `supabase/migrations/`, applied via the Supabase CLI. This replaced the earlier approach of running loose `.sql` files from `scripts/` by hand in the Supabase SQL Editor — that approach left the schema untracked, so a project pause/restore or `db reset` could silently drop columns/constraints that were never recorded anywhere durable.

## One-time setup

```bash
npm install -g supabase          # or: npx supabase <command> for one-offs
supabase login                   # opens browser auth
supabase link --project-ref <your-project-ref>   # find the ref in Supabase dashboard > Project Settings > General
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
- Never edit an already-applied migration file. If a change needs fixing, write a new migration.
- Data-only scripts (seeding, one-off backfills, Cloudinary asset migration) stay in `scripts/` — they are not schema changes and don't belong in `supabase/migrations/`.
- After `supabase db push`, if the app still reports "Could not find column X in schema cache," reload PostgREST's schema cache: Supabase dashboard → Database → API → "Reload schema cache" (or wait a few seconds for auto-reload).
