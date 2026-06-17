# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Code Style

- Write concise, clean code — no unnecessary boilerplate, comments, or abstractions
- Always use the latest stable APIs as of today's date (2026-06-17); verify against current docs before using any API

## IMPORTANT: Documentation First

**Before writing any code**, always check the `/docs` directory for a relevant guide. Read the applicable doc(s) before generating any implementation. This is mandatory — do not skip this step even for small changes.

Key docs:
- `docs/data-fetching.md` — **MUST read before any data fetching or database work**
- `docs/data-mutations.md` — **MUST read before any data mutations, Server Actions, or form handling**
- `docs/authentication.md` — **MUST read before any auth, role, or session-related work**
- `docs/app-guide.md` — user-facing app guide (also used as Bird Guide chat context)

## IMPORTANT: Keep App Guide Up to Date

After adding, changing, or removing any **user-facing feature** (new page, new UI element, changed workflow, removed functionality), update `docs/app-guide.md` to reflect the change. Also update the condensed version in `features/bird-guide/bird-guide-prompt.ts` (`APP_GUIDE` constant) so the Bird Guide chat can answer "how do I..." questions accurately. This is mandatory — do not skip even for small UX changes.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # run ESLint
```

## Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- No test framework configured yet



## Architecture

This is a Next.js App Router project. All routes live under `app/`. The root layout (`app/layout.tsx`) sets up Geist fonts via `next/font/google` and applies base Tailwind classes. Pages are React Server Components by default; add `"use client"` only when needed.

Styling uses Tailwind utility classes directly in JSX — no separate CSS modules. Global styles are in `app/globals.css`.

## Authentication

Auth uses Supabase Auth with Google OAuth. Two roles: `admin` (catalog editing) and `user` (collection tracking). See `docs/authentication.md` for the full reference.

**Critical rules:**
- Always use `requireAdmin()` at the top of any Server Action or page that mutates catalog data
- Always use `getUser()` / `getUserRole()` (from `lib/auth.ts`) — never read auth state client-side
- Never expose the `SUPABASE_SERVICE_ROLE_KEY` to the client — it's only used in `lib/supabase-admin.ts`
- Route protection lives in `proxy.ts` but Server Actions must also guard themselves independently
- To promote a user to admin: `UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid>';` in Supabase SQL Editor

---

# BirdDex Claude Code Rules

## Project goal

BirdDex is a bird catalog / collectible-card style app.  
The visual style should feel like a mix of Hearthstone card framing and Wingspan board game calm nature aesthetics, but cleaner and more minimalistic.

## Core card fields

A bird card must contain ONLY these fields:

1. English name
2. Latin name
3. Bird picture
4. Sound icon
5. Habitats as icons only, 1–3 max
6. Food as icons only, 1–3 max
7. Short humorous field note
8. Minimalistic best-months-to-observe chart
9. Wingspan in cm

Mini section labels (e.g. "Food", "Habitat", "Behaviour") are allowed and encouraged — they aid scannability. Keep them small, muted, and in the established mono/uppercase style.

## Data rules

Use these allowed food values:

- insects
- seeds
- fish
- rodents
- berries
- omnivore
- scavenger

Use these allowed behaviour values:

- nocturnal
- predator
- songbird
- mimic
- flock bird
- urban survivor
- fish hunter
- secretive
- territorial
- fast flyer
- berry lover
- forest ghost

Rarity controls the frame color. Use this exact mapping — no other colors:

| Rarity    | Color  | Hex       |
|-----------|--------|-----------|
| Common    | grey   | `#808080` |
| Uncommon  | green  | `#198b58` |
| Rare      | blue   | `#306fd5` |
| Epic      | purple | `#8d33ab` |
| Legendary | orange | `#f9a01f` |

Wingspan must be a single precise number in cm, not a range.

## Tone

Field notes should be short, funny, slightly unhinged, and dry.

Good style:

> Looks like somebody designed a bird after two glasses of wine.

Avoid:
- generic encyclopedia tone
- too cute Disney language
- long jokes
- memes that will age badly
- "majestic creature of the skies" nonsense

## Visual style

Cards should be minimalistic, readable, and not overloaded.

Use:
- rarity-colored frame
- large bird image area
- small icons for habitat and food
- compact field note
- simple month chart
- elegant fantasy/nature feeling

Avoid:
- clutter
- too many badges
- text-heavy blocks
- obvious labels for everything
- random stats not requested

## UX rules

Cards should work well in a catalog/grid.

Keep card dimensions consistent.

Important information should be scannable at a glance.

Icons must be understandable without text labels.

## Code rules

Use clean, typed components.

Prefer reusable components:

- `BirdCard`
- `RarityFrame`
- `IconRow`
- `ObservationMonthsChart`
- `SoundButton`
- `FieldNote`

Keep bird data separate from UI components.

Do not hardcode bird-specific data inside components unless making a one-off mockup.

## Component props example

```ts
type BirdCardProps = {
  nameEng: string;
  nameLatin: string;
  imageUrl: string;
  soundUrl?: string;
  rarity: BirdRarity;
  habitats: Habitat[];
  food: Food[];
  bestMonths: number[];
  wingspanCm: number;
  fieldNote: string;
};
```
