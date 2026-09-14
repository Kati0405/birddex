# Feature Spec: My Journal

## Goal

Give signed-in users a month-by-month view of their existing observations — "small encounters, a month to remember" — without requiring them to create separate journal entries. The journal replaces the existing `/observations` page as the primary place to browse observation history.

## Scope

- New `/observations` page content: month navigation, monthly stats, grouped observation timeline, sidebar with "New to your collection" and a featured-photo block ("Best of [Month]") with an icon-only share action.
- New query helpers scoped to a single calendar month, plus lightweight full-history helpers for first-encounter detection and stats that must reflect the complete dataset (not just the loaded page).
- New `journal_photo_of_month` table to persist the user's chosen photo per month.
- Keep `/photos` and dashboard `RecentObservations` untouched — they already reuse `ObservationRow` and are out of scope.

## Out of Scope

- Image export/download or an actual share action behind the share icon. There is no existing export/share/image-generation utility in the codebase to reuse; the share icon is present as an affordance but is not yet wired to anything. Wiring it is a separate follow-up (needs an image-generation approach — canvas/server-side render — and a share target to be decided).
- Timezone conversion infrastructure — the project has no existing UTC/local conversion helper; observed dates are already stored and displayed via plain `Date`/`date-fns format()` in the browser's local time (see `ObservationRow`, `ObservationList`). The journal follows the same convention: a month boundary is the browser's local calendar month, translated to a UTC range for the DB query.

## Data Model

No changes to `observations`. Existing columns used: `observed_at`, `bird_id`, `seen`, `heard`, `photographed`, `quality`, `notes`, `photo_url`, `cloudinary_public_id`, `cloudinary_resource_type`, `lat`, `lng`, `location_name`.

New table for "Photo of the month" persistence:

```sql
create table public.journal_photo_of_month (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null, -- 'YYYY-MM', local-month key chosen client-side, validated server-side
  observation_id uuid not null references public.observations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, month_key)
);

alter table public.journal_photo_of_month enable row level security;
create policy "Own photo of month" on public.journal_photo_of_month
  for all using (auth.uid() = user_id);
```

- One row per user per month. Selecting a new photo upserts (replaces) the row for that month.
- If the referenced observation is deleted, the FK cascade removes the row — the UI falls back to "no photo selected" automatically, no orphan cleanup needed.
- `observation_id` must belong to the requesting user and have a non-null `photo_url` — enforced server-side in the Server Action, not just by the FK.
- This is genuinely new state (a preference), not a duplicate of observation data, so it does not conflict with "derive monthly summaries from observations; do not store duplicate totals."

## UI Behavior

### Route

`app/observations/page.tsx` is replaced with the journal. URL stays `/observations` (no rename — nav links, footer link, dashboard "All observations" link all keep working unchanged). Selected month is a search param: `/observations?month=2026-09`. Missing/invalid param defaults to the current local month.

### Header

Existing `AppHeader`/nav unchanged. New page header: fixed-height hero band (`h-[180px] sm:h-[220px] lg:h-[260px]`) with `/hero/blue-tit_background.png` (a watercolor Blue Tit-on-branch landscape) as a `fill`-mode background, `object-cover object-right` so cropping trims the image's empty left-side sky/lake rather than the bird on the right. A left-to-right cream gradient scrim (`from-[#faf7f0]` to transparent) sits over the image so the title/subtitle stay legible without dulling the bird. Content is laid out in a `flex flex-col justify-between` column spanning the header's full height: "My journal" title + "Small encounters, a month to remember." subtitle pinned top-left, `QuickAddObservationButton` (`variant='inline'`) pinned bottom-right (`self-end`) so it sits in the leaf cluster below the bird rather than overlapping its body. This required real iteration — the first two library images (`blue-tit-background_1.png`, a 3:1 crop with the bird pushed to the far edge and a huge empty sky) produced far too much dead space or clipped the bird when locked to the image's native aspect ratio; `blue-tit_background.png` has a tighter, more central composition and was chosen instead, with a fixed height (not aspect-ratio-locked) so the crop can be tuned independently of viewport width. This is journal-page-only: no other page uses `blue-tit_background.png`. The page-level `/hero/background_upper.png` (used elsewhere as a faint leaf-corner texture behind the page header, e.g. `DashboardPage`) is dropped on this page only — with the header now carrying its own dense leaf/branch illustration directly below it, the two leaf textures stacked and read as cluttered, so `<main>` here keeps only `/hero/background_lower.png` at the bottom (unaffected, far enough from the header to not compete visually).

### Month navigation

- Prev/next chevrons sit at the far left/right edges of the page's content container (`justify-between` instead of a centered `gap-3` row), with the month/year label centered between them. Rendered as visible rounded-square buttons (`rounded-lg`, bordered, `bg-card`, no shadow) rather than bare icons, so they read clearly as controls, not just a static decoration. Both buttons carry a `title` tooltip describing the destination month (or "No future months available" when the next button is disabled).
- Next is disabled when the selected month equals the current local month.
- Clicking the month/year label opens a popover (reuse `Popover`/`PopoverContent` primitives) with a compact year + month grid for direct jump, matching the existing `Calendar`'s popover pattern in `AddObservationModal`.
- "This month" badge shown next to the label when selected month === current month.

### Monthly statistics

Four-stat row (Species / Observations / Days with sightings / Photos added), computed server-side for the selected month from `observed_at`, using local calendar-month boundaries. "Days with sightings" counts distinct `observed_at` dates regardless of seen/heard/photographed flags (heard-only rows count). "Photos added" counts observations in the month that have a `photo_url` set — new field on `JournalMonthStats` (`photosAddedCount`), computed alongside the other stats in the same `getJournalMonthData` pass, no extra query.

Each stat is a left-aligned row with a circular icon badge (`lucide-react`: `Bird`, `Binoculars`, `CalendarDays`, `Camera`) next to the numeral, matching a reference mockup the user supplied. `grid-cols-2 sm:grid-cols-4` so the four stats sit 2×2 on narrow screens and in one row from `sm:` up. Explicitly out of scope: the mockup's small "+N vs [previous month]" trend line under each stat — that needs a previous-month comparison query the app doesn't have anywhere yet; confirmed with the user to skip it for this pass.

### Observation timeline (left column, ~2/3 width on desktop)

- Heading "[Month] encounters" (e.g. "September encounters").
- Grouped by date (newest first), each date group shows day number, weekday, and distinct-species count for that date. The large day/month column on the left is desktop-only (`lg:` and up) — on small screens it's hidden and the day/date is folded into the weekday line instead (e.g. "Tuesday, 30 Jun"), since the two-line stacked date column reads poorly at narrow widths.
- Each row reuses `ObservationRow` (thumbnail — observation photo preferred, catalog image fallback already built into `ObservationRow`/`UserObservation` — bird name, location, notes preview, seen/heard/photographed indicators), plus the existing edit (pencil) / delete (trash) actions from `ObservationList`. `ObservationRow`'s internal layout was widened to `flex-wrap` (metadata line wraps instead of forcing fixed `w-24`/`w-12`/`w-16` columns; the whole row's content block claims a full line below `sm:` so the `actions` slot drops to a second line rather than squeezing the bird name to zero width) — this was a real overflow bug affecting the narrow ~2/3-width journal card, fixed at the shared-component level since `RecentObservations`/`LocationDetail` reuse the same component and benefit too.
- First-encounter icon (`entities/bird-icons/ui/1st-time-badge.png`, 16×16, accessible via `alt`/`title`) shown inline next to the bird's name — not in the trailing actions area — when that observation is the earliest-dated observation of that species across the user's full history. Ties on the same date are broken by lowest `observations.id` (UUID) for determinism — arbitrary but stable and cheap to compute in SQL/JS without needing `created_at` semantics.
- A rarity diamond (same clip-path/color pattern as `ObservationMiniCard` on the dashboard's "Your birding" card) also sits inline next to the bird's name, using `RARITY_COLOR`. Both the diamond and the first-encounter icon were promoted from `DateGroup`'s `actions` slot into `ObservationRow` itself, via new optional `birdRarity`/`isFirstEncounter` fields on `ObservationRowData` — optional so `RecentObservations` and `LocationDetail` (the component's other two consumers, whose data doesn't carry rarity/first-encounter info) are unaffected and simply don't render them.
- Edit and delete icon buttons in the row's hover-revealed actions share one neutral hover style (`hover:bg-secondary/60 hover:text-foreground`) — delete is not styled destructively red on hover, matching the edit button exactly.
- Pagination: incrementally load older date-groups within the month using the same "load more" sentinel pattern `BirdSearch.tsx` already uses (`IntersectionObserver` + `visibleCount`), scoped per month rather than infinite across months.
- Row click → existing bird detail page with `?obs=<id>&flipped=1` (same link `ObservationRow` already emits).
- Empty month: reuse the same empty-state pattern as `ObservationList`'s empty state, but scoped to the month, offering both "Add observation" and a note that past dates can be logged (the existing `AddObservationModal` calendar already allows picking any past date, so no new capability is needed — just messaging).

### Sidebar (right column, ~1/3 width on desktop)

**New to your collection** — species whose first encounter (see above) falls in the selected month. Rendered as `BirdCardMini` cards in a horizontally scrollable row (same pattern as the dashboard's "Easy to spot" mobile layout in `ContinueCollection` — `flex gap-4 overflow-x-auto`, `--mini-card-w` sizing), applied at every screen size here rather than only below `lg:`. The scrollbar is visible on larger screens (a real scroll affordance) but hidden below the `sm:` breakpoint via a new `.no-scrollbar-mobile` utility in `globals.css` (a `max-width: 639px` media-scoped version of the existing `.no-scrollbar`), since a visible scrollbar reads as UI clutter on touch devices where swipe is the primary interaction. Each card links to the bird detail page, with the first-encounter date underneath — a calendar icon plus `d MMM yyyy` (e.g. "11 Jun 2026"), matching the date format used everywhere else (`ObservationRow`, `ObservationMiniCard`) rather than the shorter `d MMM`. Quiet empty state ("No new species this month yet.") when none.

**Best of [Month]** — a large featured-photo card (the chosen `journal_photo_of_month` photo, or a placeholder) with the month label and species/observation counts overlaid directly on the photo via a gradient scrim, plus a small "Featured" badge. No "postcard" language anywhere in the UI. A header row has only an icon-only share button (`Share2`, no label) — not wired to anything yet, per Out of Scope. Tapping the photo itself opens a picker listing the month's observation photos (thumbnails only, from the already-fetched month data — no extra fetch); selecting one calls the `setJournalPhotoOfMonthAction` Server Action that upserts `journal_photo_of_month`, and the featured photo updates immediately. If no observations in the month have photos, the photo area shows a quiet placeholder and is not clickable.

## Auth and Security

- Page: `requireAuth()` at the top, same as current `app/observations/page.tsx`.
- All new query helpers scoped by `user_id` from `requireAuth()`, never from client input — same pattern as `getAllUserObservations`.
- New Server Action `setJournalPhotoOfMonthAction`: `requireAuth()`, Zod-validated `{ monthKey, observationId }`, verifies the observation belongs to the user and has a `photo_url` before upserting — never trusts client-supplied photo URLs (consistent with the Cloudinary contract's "never trust client input as authority," even though this action stores a reference, not a new asset).
- No new Cloudinary upload/delete paths — "Photo of the month" only references an existing observation's already-uploaded photo, so the asset lifecycle contract's create/replace/delete flows don't apply here.

## Code Organization

New feature code lives under `features/observations/` (journal is observation data reorganized by month, not a separate domain):

```
features/observations/
  journal-queries.ts                     // month-scoped stats, timeline page, first-encounters, sidebar data
  actions/journal-mutations.ts           // setJournalPhotoOfMonthAction
  components/JournalPage/JournalPage.tsx           // top-level composition (server data → client interactivity boundary)
  components/JournalHeader/JournalHeader.tsx
  components/MonthNav/MonthNav.tsx                 // 'use client' — prev/next/popover, updates ?month=
  components/MonthNav/MonthPickerPopover.tsx
  components/JournalStats/JournalStats.tsx
  components/JournalTimeline/JournalTimeline.tsx   // 'use client' — incremental load per month
  components/JournalTimeline/DateGroup.tsx
  components/JournalSidebar/NewToCollection.tsx
  components/JournalSidebar/MonthPhotoHighlight.tsx  // 'use client' — featured photo + photo picker + Server Action call
```

Reused as-is, no changes needed: `ObservationRow`, `AddObservationModal`, `QuickAddObservationButton`/`QuickAddObservationModal`, `deleteObservationAction`, `updateObservationAction`, `BirdCardMini`, `ConfirmDeleteModal`, `Badge`, `Popover`/`PopoverContent`/`Calendar` primitives, `RARITY_COLOR`, `cloudinaryThumbnail`.

`app/observations/page.tsx` becomes a thin Server Component: `requireAuth()`, read `?month=`, call the new journal queries, pass data to `JournalPage`.

## Docs

- `docs/guides/app-guide.md` — replace the "Observations Page" section with a "My Journal" section describing month navigation, stats, timeline, first encounters, and sidebar features.
- `features/bird-guide/bird-guide-prompt.ts` (`APP_GUIDE` constant) — update the condensed Observations Page description to match, so Ask Robin's "how do I..." answers stay accurate.
- `docs/guides/database-migrations.md` — no change needed (process doc); add the new migration file under `supabase/migrations/`.

## Acceptance Criteria

- [ ] `/observations` renders the journal for signed-in users; unauthenticated users are redirected to `/login` (unchanged `requireAuth()` behavior).
- [ ] Month defaults to current local month; `?month=YYYY-MM` selects a specific month; invalid/out-of-range values fall back to current month.
- [ ] Next-month navigation is disabled once the current month is reached; cannot navigate into the future via URL manipulation either (server clamps).
- [ ] Stats (species/observations/days with sightings) match a manual count against the DB for a seeded month, including a heard-only observation counting toward "days with sightings."
- [ ] Timeline groups by local date, newest first, each group shows correct distinct-species count.
- [ ] First-encounter icon appears on exactly one observation per species (the earliest by `observed_at`, tie-broken by lowest id) and updates correctly after adding a backdated observation earlier than the current first encounter.
- [ ] Editing/deleting an observation from the timeline works via the existing modal/actions and refreshes the affected month's stats and first-encounter state.
- [ ] "New to your collection" lists only species first-encountered within the selected month, in a horizontally scrollable row (scrollbar visible on `sm:`+ screens, hidden below it) at every screen size; empty state shown otherwise.
- [ ] The featured photo selection persists across reloads, updates when changed, and falls back to a placeholder if the chosen observation's photo is later deleted.
- [ ] No "postcard" wording appears anywhere in the UI; the share action is an icon-only button with no label.
- [ ] Tapping the featured photo opens the picker and only does so when the month has photographed observations; the stats row reads as visually prominent (large numeral, no icon), not a thin plain line.
- [ ] Prev/next month chevrons sit at the edges of the page container, are visibly styled as controls (not bare icons), and each carry a hover tooltip naming the destination month (or explaining why disabled).
- [ ] Edit and delete buttons on a timeline row use identical hover styling.
- [ ] The rarity diamond and first-encounter icon appear inline next to the bird's name on `ObservationRow`, not in the trailing actions area; `RecentObservations` and `LocationDetail` (the component's other consumers) render unaffected since those fields are optional.
- [ ] "New to your collection" dates show a calendar icon and the full `d MMM yyyy` format, matching the rest of the app.
- [ ] On small screens, the timeline's per-day date column is hidden and the day/date appears inline with the weekday instead.
- [ ] On small screens, encounter cards show their full right border with no horizontal overflow, and the bird name/date/badges/actions remain fully readable (wrapping onto multiple lines rather than being clipped or squeezed to zero width).
- [ ] Empty month shows an empty state with a working "Add observation" action.
- [ ] No fetch loads the user's entire observation history into a client component; only the current month's page plus small aggregate results cross the server/client boundary.
- [ ] The stats row shows four values (species, observations, days with sightings, photos added) each with a circular icon, matching the count of observations in the month that have a photo attached.
- [ ] `docs/guides/app-guide.md` and `features/bird-guide/bird-guide-prompt.ts` updated.
