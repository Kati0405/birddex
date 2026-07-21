# Testing Guide

This project uses **Vitest** and **React Testing Library** for tests.

Read this before adding or changing tests.

## Testing philosophy

Write tests for behavior, not implementation details.

Prefer testing what the user can see and do:

- text on the screen
- buttons and links
- form inputs
- loading/error/empty states
- successful UI updates after actions

Avoid testing:

- internal component state
- exact class names
- private helper implementation
- DOM structure unless it affects real behavior

A good test should survive a refactor if the user-facing behavior stays the same. If a test breaks on a pure refactor with no behavior change, that's a signal the test was coupled to implementation details, not a signal to weaken the test.

## Test types

Use these categories:

### Pure utility tests

Use for shared helpers like:

- `matchesBirdQuery`
- rarity calculation
- date formatting
- observation quality logic
- Cloudinary path/public ID helpers

These tests should not render React.

Example location:

```txt
shared/lib/bird-search.test.ts
```

### Component tests

Use for UI behavior:

- search filters birds
- modal opens and closes
- form validation appears
- empty state renders
- button triggers callback
- collected/uncollected state is displayed correctly

Example location:

```txt
features/birds/components/BirdChipPicker/BirdChipPicker.test.tsx
```

### Integration-style component tests

Use when several UI parts work together:

- quick add observation flow
- bird card back/front behavior
- collection search + rendered cards
- observation carousel navigation

These should still avoid real network/database calls.

## File naming

Use:

```txt
*.test.ts
*.test.tsx
```

Keep tests next to the thing they test unless the test spans a larger feature.

Good:

```txt
shared/lib/bird-search.ts
shared/lib/bird-search.test.ts
```

Good:

```txt
features/observations/components/QuickAddObservation/QuickAddObservationModal.tsx
features/observations/components/QuickAddObservation/QuickAddObservationModal.test.tsx
```

## React Testing Library rules

Use `screen` queries.

Prefer accessible queries in this order:

1. `getByRole`
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByTestId` only as a last resort — and only with a comment explaining why the accessible queries above don't work

Good:

```ts
screen.getByRole('button', { name: /add observation/i });
```

Avoid:

```ts
container.querySelector('.submit-button');
```

Use `queryBy...` only when checking that something is not present.

Good:

```ts
expect(screen.queryByText(/no birds found/i)).not.toBeInTheDocument();
```

Avoid:

```ts
expect(screen.queryByText(/no birds found/i)).toBeInTheDocument();
```

Use `findBy...` for async UI changes.

Good:

```ts
expect(await screen.findByText(/observation added/i)).toBeInTheDocument();
```

## User interactions

Use `@testing-library/user-event` for user actions.

Good:

```ts
const user = userEvent.setup();

await user.type(screen.getByRole('searchbox'), 'owl');
await user.click(screen.getByRole('button', { name: /save/i }));
```

Avoid `fireEvent` unless `user-event` cannot express the interaction.

## What to mock

Mock app boundaries, not the component itself.

Mock:

- Supabase calls
- Cloudinary upload/delete calls
- auth/session helpers
- Next.js router/navigation when needed
- server actions when testing client components

Do not mock:

- the component being tested
- small pure helpers unless the test is about a different layer
- React Testing Library behavior

## Supabase and auth tests

Never call the real database from unit/component tests.

For server-side database logic, prefer testing extracted pure logic separately.

For mutation/action tests, mock:

- `requireAuth` / `requireAdmin`
- Supabase client methods
- Cloudinary uploader/destroyer

Always test failure paths for mutations that touch external services — a mutation test suite that only covers the happy path is incomplete, not done.

Required BirdDex cases wherever a mutation touches Cloudinary or Supabase (see `docs/contracts/cloudinary-lifecycle.md`):

- upload succeeds but DB insert/update fails → new asset is cleaned up, old asset untouched
- DB write succeeds → old Cloudinary asset is deleted only after the DB write commits
- unauthorized user is rejected server-side, even if the client hides the UI
- a user cannot mutate another user's observation/location
- Cloudinary cleanup failure does not corrupt DB state or crash the mutation
- client-supplied `public_id` / `photoUrl` / `resource_type` is never trusted as authority — asset identity always comes from the database

## BirdDex-specific test targets

Prioritize tests for these areas:

### Search

Test that bird search:

- matches English name
- matches Latin name
- matches Ukrainian name if available
- is case-insensitive
- trims whitespace
- returns all birds for an empty query
- handles null or missing fields safely

### Collection

Test that collection UI:

- shows collected birds
- shows empty state
- filters collected birds by search query
- does not duplicate collected records in UI
- handles loading and error states

### Observations

Test that observation UI:

- requires a bird
- saves seen/heard/photographed values
- displays date and location
- handles missing notes
- shows observation count correctly
- supports multiple observations for the same bird

### Bird cards

Test that bird cards:

- show different back content for collected and uncollected birds
- do not allow invisible front-side links to capture clicks after flip
- expose meaningful button/link names for accessibility

### Locations

Test that location UI:

- shows location photo preview if present
- handles missing photo
- shows observation statistics
- protects user-owned location actions

## Test setup expectations

The project should use a single shared Vitest setup file (`vitest.setup.ts` at the repo root).

Vitest config must point to that file and use a DOM-like environment for React component tests.

## Snapshot tests

Avoid broad snapshots.

Allowed only for small, stable output where the snapshot is genuinely useful.

Do not snapshot entire pages or large components. Giant snapshots are where test quality goes to die wearing a little badge that says "coverage."

## Coverage expectations

Do not chase coverage numbers blindly.

Prefer strong tests around risky behavior:

- auth boundaries
- database writes
- Cloudinary lifecycle
- search/filter logic
- forms
- destructive actions
- empty/error states

A small useful test is better than ten decorative tests that only prove React can render a div.

## Before adding a test

Ask:

1. What user-visible behavior am I protecting?
2. What bug would this test catch?
3. Is this testing behavior or implementation?
4. Does this need mocks?
5. Is there a simpler pure helper test instead?
6. Could this behavior already be covered by an existing test?

If you can't name a specific bug the test would catch, don't write it.

## Before changing test setup

Check:

- `vitest.config.*`
- `vitest.setup.ts`
- package versions
- existing test patterns
- path aliases
- jsdom/happy-dom environment
- TypeScript config

Do not introduce a second testing pattern unless there is a clear reason.
