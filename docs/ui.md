# UI Guidelines — BirdDex

All UI is built exclusively with **shadcn/ui** components. Do not create custom presentational components. If a shadcn component doesn't exist yet, add it with `npx shadcn@latest add <name>`.

## Installed components

| Component | Path | Used for |
|-----------|------|----------|
| `Badge`   | `components/ui/badge.tsx` | `RarityBadge`, `StatChip` |
| `Button`  | `components/ui/button.tsx` | Rarity filter toggles, actions |
| `Card`, `CardContent` | `components/ui/card.tsx` | `BirdCard`, bird detail page |
| `Input`   | `components/ui/input.tsx` | Search field in `BirdSearch` |
| `Calendar` | `components/ui/calendar.tsx` | Date picker in observation modal |
| `Popover` | `components/ui/popover.tsx` | Date picker trigger |

## Adding a new component

```bash
npx shadcn@latest add <component-name>
```

## Theme

The BirdDex theme is a **light earthy / parchment palette** mapped to shadcn CSS variables in `app/globals.css`. There is no dark mode — the site is always light.

| shadcn token | Value | Role |
|---|---|---|
| `--background` | `#f5f0e8` | Page background (parchment) |
| `--foreground` | `#1c1810` | Body text (dark ink) |
| `--card` | `#fdfaf4` | Card surface |
| `--card-foreground` | `#1c1810` | Card text |
| `--secondary` | `#ede8dc` | Recessed surfaces, sidebar |
| `--muted` | `#ede8dc` | Muted backgrounds |
| `--muted-foreground` | `#7a7060` | Subdued / secondary text |
| `--border` | `#d8d0be` | Borders, dividers |
| `--primary` | `#5a7a3a` | Green accent (logo, active states) |
| `--primary-foreground` | `#fdfaf4` | Text on primary background |
| `--ring` | `#5a7a3a` | Focus ring |

Use these Tailwind utilities — **never** raw hex values or CSS variable references like `text-[--color-muted]`:

- Text: `text-foreground`, `text-muted-foreground`, `text-card-foreground`
- Backgrounds: `bg-background`, `bg-card`, `bg-secondary`, `bg-muted`
- Borders: `border-border`, `border-primary`
- Accent: `text-primary`, `bg-primary`, `text-primary-foreground`
- Font families: `font-sans` (Lato), `font-mono` (DM Mono), `font-heading` (Playfair Display)

## Rarity colors

Rarity colors are one-off and not part of the shadcn token system. They are defined as Tailwind theme tokens (`--color-rarity-*`) and must be applied as `bg-rarity-*` / `text-rarity-*` utilities or as inline styles only inside `BirdCard`, `RarityBadge`, and `BirdSearch`. The values are:

| Rarity | Tailwind token | Hex |
|--------|----------------|-----|
| Common | `rarity-common` | `#eaecf7` |
| Uncommon | `rarity-uncommon` | `#198b58` |
| Rare | `rarity-rare` | `#306fd5` |
| Epic | `rarity-epic` | `#8d33ab` |
| Legendary | `rarity-legendary` | `#f9a01f` |

For **dynamic** rarity colors (e.g. computed from a bird's rarity at runtime) use the `RARITY_COLOR` map from `@/entities/bird-domain` with inline styles. Do not hard-code color hex strings outside of `globals.css` and `entities/bird-domain.ts`.

## Conventions

- Compose shadcn primitives with `className` overrides and `cn()` for merging.
- Never wrap a shadcn component in a new component just to rename it — import and use it directly.
- Use `variant` and `size` props before reaching for `className` overrides.
- Icons: use `lucide-react` (already installed as a shadcn dependency).
- Responsive layout: use Tailwind responsive prefixes (`sm:`, `md:`) — no `@media` blocks in component files.
- Never use raw hex values in component files. All static color values must map to a CSS variable token via a Tailwind utility class.
