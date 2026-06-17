---
name: architecture-guardian
description: >
  Enforces clean, feature-first architecture in the BirdDex project. Use this skill
  whenever the user asks to create a new file, add a component, refactor code, or
  discusses folder structure. Also trigger when you're about to place a file somewhere
  and want to verify it's the right location. If the codebase is drifting toward
  generic folders (components/, utils/, helpers/) or scattered related files, invoke
  this skill proactively — don't wait to be asked.
---

# Architecture Guardian

Your primary responsibility is protecting project structure consistency — not just generating code.

Before placing any file, creating any folder, or suggesting any code change, run through this checklist. Architecture consistency takes priority over quick implementation.

---

## Core principle: organize by feature, not by type

The goal is that all code related to a feature lives together. When you delete a feature, you delete one folder.

**Right:**
```
features/birds/
features/auth/
features/observations/
```

**Wrong:**
```
components/       ← everything dumped here
utils/            ← mystery box
services/         ← what even goes here?
helpers/          ← the giving up folder
```

Generic folders become archaelogical dig sites. Avoid them.

---

## Before creating any file

Ask yourself these four questions in order:

1. **Which feature does this belong to?** If it's bird-related → `features/birds/`. Auth → `features/auth/`. Observations → `features/observations/`.

2. **Does something similar already exist?** Search before creating. Duplicate logic is a structural smell.

3. **Is this truly generic, or just used in two places?** Two uses doesn't make something `shared/`. It needs to be business-logic-free AND usable outside this project.

4. **What's the right name?** Avoid `helpers`, `utils`, `common`, `misc`, `data`, `temp`. Name by what the file actually does: `bird-search.ts`, `observation-parser.ts`, `image-preloader.ts`.

---

## Component folder structure

Each significant component gets its own folder — not a flat file in a directory.

```
features/birds/components/BirdCard/
  BirdCard.tsx          ← component
  BirdCard.types.ts     ← TypeScript types
  BirdCard.helpers.ts   ← logic specific to this component
  BirdCard.test.ts      ← tests live HERE, not in a separate __tests__ folder
  index.ts              ← re-exports BirdCard for clean imports
```

This way, everything you need to understand `BirdCard` is in one place. You don't have to hunt.

---

## The `shared/` folder is not a dumping ground

A file earns its place in `shared/` only when ALL three are true:
- Used by more than one feature
- Contains no business logic (no bird-specific concepts, no observation logic)
- Would make sense in a different project entirely

When uncertain: **keep it inside the feature**. You can always promote it to `shared/` later. Premature generalization is harder to undo than late promotion.

---

## Import boundaries

Features should not reach into each other directly. If `observations` needs something from `birds`, that something belongs in `shared/` or `entities/`, not imported directly across feature boundaries.

This keeps features independently deployable and testable, and prevents the spaghetti that grows when features bleed into each other.

---

## File size — a warning sign, not a hard limit

When files grow large, it's usually because they're doing too many things. Treat these as prompts to ask "should this be split?":

- Component over ~250 lines → probably has sub-components worth extracting
- Hook over ~150 lines → probably handles multiple concerns
- Helper file over ~100 lines → probably has a naming/scoping problem

Don't split mechanically — split when it reveals meaningful structure.

---

## When architecture is degrading

If you notice any of these patterns, say so before writing more code:

- A `components/` folder with 15+ flat files
- A file called `helpers.ts` or `utils.ts`
- Two features importing from each other directly
- A component file over 300 lines with no explanation
- Related files scattered across unrelated folders

**Don't silently continue bad structure.** Point it out, suggest the fix, and let the user decide whether to refactor now or later. But make it visible.

---

## Applying this to BirdDex specifically

The current structure is transitioning. As new code gets added:

- Bird catalog logic → `features/birds/`
- Auth flows → `features/auth/`
- Observation tracking → `features/observations/`
- Truly generic UI primitives (buttons, modals with no domain logic) → `shared/ui/`
- Domain types used across features → `entities/`

When in doubt about the current state of the repo, scan it first — don't assume.

---

## Keep the app guide in sync

When a user-facing feature is added, changed, or removed (new page, new UI element, changed workflow, removed functionality), two files must be updated:

1. `docs/app-guide.md` — the full user-facing guide
2. `features/bird-guide/bird-guide-prompt.ts` — the `APP_GUIDE` constant (condensed version used as Bird Guide chat context)

If you notice these were not updated after a feature change, flag it before finishing the task.
