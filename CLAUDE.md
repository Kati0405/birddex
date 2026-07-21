# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Code Style

- Write concise, clean code — no unnecessary boilerplate, comments, or abstractions
- Use APIs that match the versions installed in package.json. When unsure, check the official docs or existing project patterns before introducing new APIs.
- Keep files readable and focused. Avoid giant components that mix UI, business logic, helpers, icons, and data.
- Prefer small named components when JSX becomes hard to scan.
- Remove dead code, unused imports, unused variables, commented-out code, and abandoned branches before finishing.
- Do not add abstractions just for aesthetics. Extract only when it improves readability, removes real duplication, or matches an existing project pattern.

## IMPORTANT: Documentation First

**Before writing any code**, always check the `/docs` directory for a relevant guide. Read the applicable doc(s) before generating any implementation. This is mandatory — do not skip this step even for small changes.

Key docs:

- `docs/contracts/data-fetching.md` — **MUST read before any data fetching or database work**
- `docs/contracts/data-mutations.md` — **MUST read before any data mutations, Server Actions, or form handling**
- `docs/contracts/authentication.md` — **MUST read before any auth, role, or session-related work**
- `docs/contracts/cloudinary-lifecycle.md` — **MUST read before any Cloudinary, upload, image, sound, observation, location, or bird media work**
- `docs/guides/testing.md` — **MUST read before adding or changing any tests**
- `docs/guides/app-guide.md` — user-facing app guide (also used as Ask Robin chat context)

## Keep Documentation Accurate

When changing behavior, architecture, or development workflow:

1. Update the relevant documentation in `docs/`.
2. Prefer updating an existing document over creating a new one.
3. If code and documentation disagree, update the documentation in the same change.
4. Do not leave examples, file paths, or code snippets stale.

## Spec-Driven Development

For medium or large features, write or update a short spec before coding. Tiny bug fixes or very small visual tweaks do not need a spec.

Specs live in `docs/specs/`. Use `docs/specs/spec-template.md` as the format.

Before implementation:

1. Read relevant docs (`docs/contracts/data-fetching.md`, `docs/contracts/data-mutations.md`, `docs/contracts/authentication.md`, etc.)
2. Write or update the feature spec, clarifying:
   - **Scope** — what will change
   - **Data changes** — tables, fields, migrations, validation
   - **UI behavior** — states, empty/loading/error handling
   - **Auth/security rules** — who can do what, server-side checks
   - **Docs updates** — what documentation needs to change
   - **Acceptance criteria** — concrete checklist to verify the feature works

After implementation:

- Verify the work against the acceptance criteria
- Update the spec if the final implementation differs from the plan

## IMPORTANT: Keep App Guide Up to Date

After adding, changing, or removing any **user-facing feature** (new page, new UI element, changed workflow, removed functionality), update `docs/guides/app-guide.md` to reflect the change. Also update the condensed version in `features/bird-guide/bird-guide-prompt.ts` (`APP_GUIDE` constant) so the Ask Robin chat can answer "how do I..." questions accurately. This is mandatory — do not skip even for small UX changes.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # run ESLint
npm test         # run tests with Vitest
```

## Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Vitest** + **React Testing Library** for tests — see `docs/guides/testing.md`

## Architecture

This is a Next.js App Router project. All routes live under `app/`. The root layout (`app/layout.tsx`) sets up Geist fonts via `next/font/google` and applies base Tailwind classes. Pages are React Server Components by default; add `"use client"` only when needed.

Styling uses Tailwind utility classes directly in JSX — no separate CSS modules. Global styles are in `app/globals.css`.

## Component Organization

Page files should mostly compose components and fetch/prepare data. They should not contain large blocks of UI, inline SVGs, helper functions, and business logic all mixed together.

Prefer this structure when a feature grows:

- page or route component: data loading, auth checks, high-level composition
- feature component: owns the main UI flow
- small child components: repeated or visually distinct UI pieces
- hooks/helpers: only for logic that is reused or clearly improves readability
- constants/data: separate from UI components

Good component names describe the UI role:

- `ObservationCard`
- `ObservationCarousel`
- `ObservationQualityStars`
- `LocationPhotoPreview`
- `BirdCardBack`
- `CollectedBirdBack`
- `UncollectedBirdBack`

Avoid vague names like:

- `Box`
- `Thing`
- `Section2`
- `NewComponent`
- `CardStuff`

If a component grows large, do a cleanup pass and extract obvious pieces without changing behavior.

## Admin Badge Convention

Any UI element that is only visible/usable by admins (nav links, buttons, icons, menus) must carry a small visual "admin badge" so it's clearly distinguishable from regular UI — not just an `aria-label`.

Use the shared `AdminBadge` component at `shared/ui/AdminBadge/AdminBadge.tsx`:

```tsx
import AdminBadge from '@/shared/ui/AdminBadge/AdminBadge';

<AdminBadge />                    // amber star dot — inline next to a label
<AdminBadge variant="pill" />     // "Admin" text pill — next to email/username
<AdminBadge className="absolute -top-0.5 -right-0.5 w-3 h-3 border-2 border-card" />
// ^ overlaid on an icon/avatar — pass className to position/size it
```

When adding any new admin-gated UI (`{isAdmin && ...}`), always include this badge — do not skip it even for small icons. Do not inline the badge SVG/markup again — always use `AdminBadge`.

## Authentication

Auth uses Supabase Auth with Google OAuth. Two roles: `admin` (catalog editing) and `user` (collection tracking). See `docs/contracts/authentication.md` for the full reference.

**Critical rules:**

- Always use `requireAdmin()` at the top of any Server Action or page that mutates catalog data
- Auth and authorization decisions must happen server-side using getUser(), getUserRole(), requireAuth(), or requireAdmin(). Client components may receive user/role data as props for display only, but must not be trusted for security.
- Never expose the `SUPABASE_SERVICE_ROLE_KEY` to the client — it's only used in `shared/lib/supabase-admin.ts`
- Route protection lives in `proxy.ts` but Server Actions must also guard themselves independently
- To promote a user to admin: `UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid>';` in Supabase SQL Editor

## Cloudinary Asset Lifecycle

Before editing anything related to Cloudinary, uploads, images, sounds, observations, locations, or bird media, read `docs/contracts/cloudinary-lifecycle.md`.

- Do not make cosmetic Cloudinary refactors unless they improve lifecycle safety
- Keep Cloudinary changes small and test-backed
- Always preserve upload → DB write → delete-old ordering
- Never trust client-supplied `public_id`/`photoUrl`/`resource_type` as authority — old asset identity always comes from the database
- Add tests for rollback (new asset deleted on DB failure), ownership denial, and cleanup-failure behavior

---

# BirdDex Claude Code Rules

## Project goal

BirdDex is a bird catalog / collectible-card style app.  
The visual style should feel like a mix of Hearthstone card framing and Wingspan board game calm nature aesthetics, but cleaner and more minimalistic.

## Core card fields

The catalog bird card front should contain only these fields:

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
| --------- | ------ | --------- |
| Common    | grey   | `#eaecf7` |
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

Icons should be visually understandable, but must also include accessible labels, tooltips, or aria-labels where appropriate.

## SVG and Icon Rules

- Keep large SVGs in separate files or dedicated icon/illustration components.
- Do not paste large inline SVG blocks directly into page files or complex feature components.
- Prefer `lucide-react` or the existing icon system when suitable.
- If a custom SVG is needed, place it in a clearly named component, for example:
  - `BirdWingIcon.tsx`
  - `EmptyObservationIllustration.tsx`
  - `HabitatForestIcon.tsx`
- Keep visual assets separate from business logic.
- Icons must include accessible labels, tooltips, `aria-label`, or visually hidden text when the meaning is not obvious.

## Code rules

Keep bird data separate from UI components.

Do not hardcode bird-specific data inside components unless making a one-off mockup.

Before finishing any implementation, do a cleanup pass:

1. Extract oversized JSX into small named components.
2. Move large SVGs/icons out of the main component.
3. Delete dead code and unused imports.
4. Remove commented-out code.
5. Check that file names and component names are clear.
6. Do not change behavior during cleanup.

Use clean, typed components.

Prefer reusable components when the UI pattern appears more than once, such as:

- `BirdCard`
- `RarityFrame`
- `IconRow`
- `ObservationMonthsChart`
- `SoundButton`
- `FieldNote`

## Existing behavior preservation

Before refactoring, identify the current user-facing behavior and preserve it unless the task explicitly asks to change it.

Be especially careful with:

- collected vs uncollected bird card backs
- observation counts as unique species vs total observations
- Supabase RLS and Server Action auth guards
- Cloudinary uploads and cleanup on database failure
- Ask Robin guide context staying in sync with docs/guides/app-guide.md

## Component props example

```ts
type BirdCardProps = {
  nameEng: string;
  nameLatin: string;
  imageUrl: string;
  soundUrl?: string;
  rarity: BirdRarity;
  habitats: Biome[];
  food: Food[];
  bestMonths: number[];
  wingspanCm: number;
  fieldNote: string;
};
```
