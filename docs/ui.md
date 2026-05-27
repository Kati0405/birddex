# UI Guidelines — BirdDex

All UI is built exclusively with **shadcn/ui** components. Do not create custom presentational components. If a shadcn component doesn't exist yet, add it with `npx shadcn@latest add <name>`.

## Installed components

| Component | Path | Used for |
|-----------|------|----------|
| `Badge`   | `components/ui/badge.tsx` | `RarityBadge`, `StatChip` |
| `Button`  | `components/ui/button.tsx` | Rarity filter toggles |
| `Card`, `CardContent` | `components/ui/card.tsx` | `BirdCard`, bird detail page |
| `Input`   | `components/ui/input.tsx` | Search field in `BirdSearch` |

## Adding a new component

```bash
npx shadcn@latest add <component-name>
```

## Theme

The birddex theme is a dark forest palette mapped to shadcn CSS variables in `app/globals.css`. There is no light/dark toggle — the site is always dark.

| shadcn token | Value | Role |
|---|---|---|
| `--background` | `#0f1a0e` | Page background |
| `--foreground` | `#e8ead4` | Body text |
| `--card` | `#1a2b18` | Card surface |
| `--card-foreground` | `#e8ead4` | Card text |
| `--secondary` | `#243320` | Recessed surfaces (card hero area) |
| `--muted-foreground` | `#7a9170` | Subdued / secondary text |
| `--border` | `#2e4a2b` | Borders, dividers |
| `--primary` | `#c8a84b` | Gold accent (logo, blockquote border) |
| `--ring` | `#c8a84b` | Focus ring |

Use these Tailwind utilities — **never** raw hex values or CSS variable references like `text-[--color-muted]`:

- Text: `text-foreground`, `text-muted-foreground`, `text-card-foreground`
- Backgrounds: `bg-background`, `bg-card`, `bg-secondary`
- Borders: `border-border`, `border-primary`
- Accent: `text-primary`, `bg-primary`

## Rarity colors

Rarity colors are one-off and not part of the shadcn token system. Apply them as Tailwind arbitrary values only inside `RarityBadge` and `BirdSearch`. The values are:

| Rarity | Color |
|--------|-------|
| Common | `#4ade80` |
| Uncommon | `#60a5fa` |
| Rare | `#c084fc` |
| Epic | `#fb923c` |
| Legendary | `#fbbf24` |

## Conventions

- Compose shadcn primitives with `className` overrides and `cn()` for merging.
- Never wrap a shadcn component in a new component just to rename it — import and use it directly.
- Use `variant` and `size` props before reaching for `className` overrides.
- Icons: use `lucide-react` (already installed as a shadcn dependency).
