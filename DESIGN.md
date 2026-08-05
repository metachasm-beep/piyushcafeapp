# Spatial Glass — Hospitality Design System

Calm, food-first guest ordering. Glass is atmosphere, not the product.

## Direction

- **Food first** — dish photography and restaurant name carry the brand
- **Warm stone + bronze** — soft linen backgrounds, charcoal ink, muted bronze accent
- **Glass secondary** — translucent panels, quiet borders, soft depth
- **Avoid** — indigo/purple blob themes, loud glow, dashboard clutter in the hero

## Tokens

Defined on `.sg-shell` in `src/lib/styles/spatial-glass.css`.

| Token | Role |
| --- | --- |
| `--sg-ink` | Primary text |
| `--sg-muted` / `--sg-faint` | Secondary / tertiary text |
| `--sg-accent` / `--sg-accent-strong` | CTAs, prices, active states |
| `--sg-surface` | Glass fill |
| `--sg-line` | Dividers, quiet borders |
| `--sg-radius-*` | Concentric radii (`xs` → `xl`, `sheet`) |
| `--sg-space-*` | Spacing scale |
| `--sg-shadow-*` | Elevation |
| `--sg-ease` / `--sg-duration*` | Motion |

Preview: open [`/design-tokens.html`](./static/design-tokens.html) in the app (served from `static/`).

## Concentric radii

Outer tile radius minus padding equals inner media radius.

- Menu row: `--sg-radius-lg` tile, `padding: 10px` → media `calc(var(--sg-radius-lg) - 10px)`
- Featured card: `--sg-radius-xl` outer, `12px` padding → media `--sg-radius-sm`

## Typography

- Display / UI: Cabinet Grotesk
- Meta / labels: Geist Mono
- Titles: `text-wrap: balance` via `.sg-title-balance`
- Body: `text-wrap: pretty` via `.sg-text-pretty`
- Money / qty / timers: `.sg-num` (`tabular-nums`)

## Components

| Class | Use |
| --- | --- |
| `.sg-tile` | Soft glass surface |
| `.sg-media` | Dish photo with neutral inset outline |
| `.sg-cat-pill` / `.sg-filter-pill` | Category & dietary chips |
| `.sg-qty-btn*` | Quantity / add controls |
| `.sg-sheet*` | Unified bottom-sheet chrome |
| `.sg-pay-tile` | Checkout payment method |
| `.sg-empty-cart` | Empty cart state |
| `.sg-thumb-bar` | Thumb-zone action bar |

## Surfaces

1. **Table menu** — restaurant + table header, compressed sticky filters, sticky section labels, compact expandable rows
2. **Cart / checkout sheets** — shared handle, radius, enter timing; calm payment tiles
3. **Order tracking** — quiet status hero, soft stage rail
4. **Owner / superadmin** — `--sa-*` tokens in `src/lib/styles/superadmin.css` (teal accent, WARN/ERR secondaries, density modes)

## Motion

- Stagger float-in on menu rows
- Add-to-cart pop + `+1` cue (`.sg-qty-btn-add.is-pop`)
- Sheet fly with `--sg-duration-sheet`
- Respect `prefers-reduced-motion`

## Skinning a restaurant

Override CSS variables on `.sg-shell` (or a restaurant-scoped wrapper) after design intake:

```css
.sg-shell[data-skin="acme"] {
  --sg-accent: #2f5d50;
  --sg-accent-strong: #244a40;
  --sg-bg-0: #eef2ef;
  /* … */
}
```
