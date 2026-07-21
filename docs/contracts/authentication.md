# Authentication

BirdDex uses **Supabase Auth** with Google OAuth. There are no passwords — all sign-in goes through Google.

---

## Roles

| Role    | Can do                                      |
|---------|---------------------------------------------|
| `user`  | Browse catalog, mark birds as collected     |
| `admin` | Everything above + edit/add birds to catalog |

Roles are stored in `public.profiles`, not in Supabase `user_metadata` (which users can self-modify).

---

## Database Schema

Run these migrations in the Supabase SQL Editor before the app works end-to-end.

### 1. profiles table

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

The trigger auto-creates a `profiles` row with `role = 'user'` whenever a new user signs in for the first time.

### 2. collected_birds table

```sql
create table public.collected_birds (
  user_id uuid not null references auth.users(id) on delete cascade,
  bird_id int not null references public.birds(id) on delete cascade,
  collected_at timestamptz not null default now(),
  primary key (user_id, bird_id)
);
```

### 3. RLS policies

```sql
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Own profile read" on public.profiles
  for select using (auth.uid() = id);

-- Users can update their own profile but cannot change their role
create policy "Own profile update" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id AND role = (select role from public.profiles where id = auth.uid()));

alter table public.collected_birds enable row level security;
create policy "Own collection" on public.collected_birds for all using (auth.uid() = user_id);

alter table public.birds enable row level security;
create policy "Public read" on public.birds for select using (true);
```

Catalog writes go through the service-role client (`shared/lib/supabase-admin.ts`) which bypasses RLS — no write policy on `birds` is needed.

### 4. Backfill existing users (run once if users already exist)

```sql
insert into public.profiles (id, role)
select id, 'user' from auth.users
on conflict (id) do nothing;
```

---

## Promoting a User to Admin

1. Go to **Supabase dashboard → Authentication → Users**, find the user, copy their UUID.
2. Run in **SQL Editor**:

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

There is no self-service admin signup. Role promotion is manual by design.

The RLS policy on `profiles` explicitly blocks clients from updating `role` — only the service-role key (server-side only) can change it. A user cannot elevate their own privileges even if they craft a direct Supabase API call.

---

## Supabase Dashboard Configuration

### Enable Google OAuth

1. Go to **Authentication → Providers → Google**
2. Enable it and paste your **Google OAuth Client ID** and **Client Secret**
3. Copy the **Callback URL** shown — you'll need it in the Google Cloud Console

### Set redirect URLs

Go to **Authentication → URL Configuration** and add:

- `http://localhost:3000/auth/callback` (development)
- `https://your-production-domain.com/auth/callback` (production)

### Get Google OAuth credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or use an existing one)
3. Enable the **Google+ API** (or People API)
4. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Add the Supabase callback URL to **Authorized redirect URIs**
7. Copy the Client ID and Secret into the Supabase Google provider settings

---

## Auth Flow

```
User clicks "Continue with Google"
  → signInWithGoogleAction() (Server Action)
  → supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })
  → redirect to Google consent screen
  → Google redirects to /auth/callback?code=...
  → app/auth/callback/route.ts exchanges code for session
  → redirect to /
```

---

## Key Files

| File | Purpose |
|------|---------|
| `shared/lib/supabase-server.ts` | SSR-compatible Supabase client using server-side cookies |
| `shared/lib/supabase-middleware.ts` | Middleware-compatible Supabase client using request/response cookies |
| `shared/lib/supabase-admin.ts` | Service-role client for catalog writes; bypasses RLS |
| `features/auth/auth-helpers.ts` | Auth helpers: `getUser()`, `getUserRole()`, `requireAuth()`, `requireAdmin()` |
| `features/collection/collection-queries.ts` | Collection helpers such as `checkIfCollected()`, `toggleCollected()`, `getCollectedCount()`, and `getCollectedBirdIds()` |
| `proxy.ts` | Route protection (runs before every matched request) |
| `app/(auth)/actions.ts` | `signInWithGoogleAction()`, `logoutAction()` |
| `app/auth/callback/route.ts` | OAuth code exchange handler |
| `app/(auth)/login/page.tsx` | Login page — single "Continue with Google" button |
| `features/auth/components/AuthBar/AuthBar.tsx` | Header login/logout UI (Server Component) |

---

## Route Protection

`proxy.ts` enforces access before the page renders:

| Route | Rule |
|-------|------|
| `/birds/*/edit` | Admin only — non-admin redirects to `/`, unauthenticated to `/login` |
| `/admin/*` | Admin only — same as above |
| `/login`, `/signup` | Authenticated users are redirected to `/` |

Server actions (`updateBirdImageAction`, `updateBirdMetadataAction`) also call `requireAdmin()` independently — the proxy is not the only line of defense.

---
## Auth Helpers (`features/auth/auth-helpers.ts`)

```ts
getUser()       → User | null          // current Supabase user, or null
getUserRole()   → 'admin' | 'user' | null  // queries profiles table
requireAuth()   → User                 // redirects to /login if not authenticated
requireAdmin()  → User                 // redirects to / (or /login) if not admin
```

Use `getUser()` / `getUserRole()` in Server Components to conditionally render UI.
Use `requireAuth()` / `requireAdmin()` at the top of Server Actions and protected pages.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

All three must be present in `.env.local`. The first two are safe to expose to the browser. The service-role key must never be exposed client-side.
