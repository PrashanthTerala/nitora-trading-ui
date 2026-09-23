# Design tokens

Generated from `src/styles/tokens.css` by `npm run tokens:doc`. Do not edit by hand: change
the CSS and regenerate. `npm run check` fails when this file is out of date.

Colours are OKLCH. Every colour token passes the contrast bar set in `tools/lint-tokens.mjs`
in both themes: 4.5:1 for text, 3:1 for control borders, chart overlays and identifiers.
`line-subtle`, `line` and `grid` are decorative hairlines and are exempt, per WCAG 1.4.11.

Durations fall to 0ms under `prefers-reduced-motion: reduce`.

## Type families

| Token | Light | Dark | Use |
|---|---|---|---|
| `--font-sans` | `'Inter Variable', ui-sans-serif, system-ui, sans-serif` | same | body text and UI |
| `--font-display` | `'Geist Variable', 'Inter Variable', ui-sans-serif, system-ui, sans-serif` | same | H1/H2 and hero numbers (from Phase 1) |
| `--font-mono` | `'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace` | same | prices, tickers, R-multiples, code |

## Surfaces

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `oklch(0.975 0.004 255)` | `oklch(0.15 0.014 255)` | page background |
| `--color-surface-1` | `oklch(0.992 0.002 255)` | `oklch(0.19 0.016 255)` | cards |
| `--color-surface-2` | `oklch(0.956 0.006 255)` | `oklch(0.22 0.017 255)` | nested panels, table headers, code |
| `--color-surface-3` | `oklch(0.996 0.001 255)` | `oklch(0.255 0.018 255)` | popovers, menus |
| `--color-overlay` | `oklch(0.2 0.02 255 / 0.45)` | `oklch(0.08 0.01 255 / 0.7)` | modal scrim, with backdrop blur |

## Lines

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-line-subtle` | `oklch(0.935 0.006 255)` | `oklch(0.245 0.016 255)` | hairline dividers inside a card; decorative |
| `--color-line` | `oklch(0.905 0.009 255)` | `oklch(0.29 0.018 255)` | card and panel borders; decorative |
| `--color-line-strong` | `oklch(0.6 0.016 255)` | `oklch(0.55 0.02 255)` | input and control borders; 3:1 against surfaces |
| `--color-grid` | `oklch(0.945 0.006 255)` | `oklch(0.24 0.016 255)` | chart grid lines |

## Ink

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-ink` | `oklch(0.21 0.03 262)` | `oklch(0.94 0.008 255)` | primary text |
| `--color-ink-soft` | `oklch(0.47 0.03 262)` | `oklch(0.73 0.022 255)` | secondary text, labels |
| `--color-ink-muted` | `oklch(0.52 0.02 262)` | `oklch(0.66 0.02 255)` | captions, placeholders, meta; still 4.5:1 |
| `--color-ink-inverse` | `oklch(0.985 0.003 255)` | `oklch(0.17 0.015 255)` | text on a strong fill |

## Brand accent: the one hue for actions and active states

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-accent` | `oklch(0.52 0.2 272)` | `oklch(0.7 0.155 272)` | primary actions, links, active state |
| `--color-accent-hover` | `oklch(0.46 0.2 272)` | `oklch(0.76 0.117 272)` | hover and pressed accent |
| `--color-accent-soft` | `oklch(0.94 0.027 272)` | `oklch(0.3 0.075 272)` | tinted background behind accent content |
| `--color-accent-ring` | `oklch(0.52 0.2 272 / 0.85)` | `oklch(0.7 0.155 272 / 0.6)` | focus ring; 3:1 against surfaces |
| `--color-on-accent` | `oklch(0.99 0.002 272)` | `oklch(0.17 0.02 272)` | label on an accent fill |

## Market semantics: price direction, P&L and order sides ONLY

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-up` | `oklch(0.52 0.14 150)` | `oklch(0.74 0.17 150)` | rising price, profit, buy |
| `--color-up-soft` | `oklch(0.955 0.04 150)` | `oklch(0.28 0.06 150)` | tint behind up content |
| `--color-on-up` | `oklch(0.99 0.002 150)` | `oklch(0.17 0.02 150)` | label on an up fill |
| `--color-down` | `oklch(0.54 0.19 25)` | `oklch(0.68 0.19 25)` | falling price, loss, sell |
| `--color-down-soft` | `oklch(0.955 0.021 25)` | `oklch(0.29 0.07 25)` | tint behind down content |
| `--color-on-down` | `oklch(0.99 0.002 25)` | `oklch(0.17 0.02 25)` | label on a down fill |
| `--color-neutral` | `oklch(0.55 0.015 255)` | `oklch(0.66 0.015 255)` | unchanged price |
| `--color-neutral-soft` | `oklch(0.945 0.006 255)` | `oklch(0.27 0.012 255)` | tint behind neutral content |

## Status: never used for price direction

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-warn` | `oklch(0.54 0.121 60)` | `oklch(0.8 0.15 75)` | caution |
| `--color-warn-soft` | `oklch(0.955 0.039 80)` | `oklch(0.3 0.06 75)` | tint behind a caution |
| `--color-danger` | `oklch(0.52 0.2 358)` | `oklch(0.69 0.19 358)` | a real mistake; deliberately more magenta than down |
| `--color-danger-soft` | `oklch(0.955 0.023 358)` | `oklch(0.29 0.07 358)` | tint behind a danger note |
| `--color-info` | `oklch(0.52 0.105 235)` | `oklch(0.76 0.11 230)` | neutral information |
| `--color-info-soft` | `oklch(0.955 0.024 235)` | `oklch(0.29 0.05 230)` | tint behind information |

## Curriculum levels: small identifiers only, never large fills

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-level-foundation` | `oklch(0.55 0.08 190)` | `oklch(0.74 0.08 190)` | level 1 dot, ribbon, cover tint |
| `--color-level-reading` | `oklch(0.55 0.08 240)` | `oklch(0.74 0.08 240)` | level 2 |
| `--color-level-analysis` | `oklch(0.55 0.09 300)` | `oklch(0.74 0.08 300)` | level 3 |
| `--color-level-execution` | `oklch(0.56 0.09 75)` | `oklch(0.78 0.09 75)` | level 4 |
| `--color-level-mastery` | `oklch(0.55 0.09 350)` | `oklch(0.74 0.08 350)` | level 5 |

## Chart overlays: colour-blind-safe hues, none green or red

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-chart-1` | `oklch(0.52 0.16 255)` | `oklch(0.72 0.14 250)` | first overlay: blue |
| `--color-chart-2` | `oklch(0.62 0.147 55)` | `oklch(0.78 0.15 60)` | orange |
| `--color-chart-3` | `oklch(0.54 0.15 340)` | `oklch(0.74 0.13 340)` | reddish purple |
| `--color-chart-4` | `oklch(0.6 0.104 220)` | `oklch(0.82 0.1 220)` | sky |
| `--color-chart-5` | `oklch(0.6 0.12 95)` | `oklch(0.88 0.15 100)` | olive gold |
| `--color-chart-6` | `oklch(0.55 0.02 255)` | `oklch(0.68 0.02 255)` | slate: envelopes and reference lines |

## Legacy names, kept so existing classes keep working

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-surface` | `var(--color-surface-1)` | same | alias of surface-1 |
| `--color-panel` | `var(--color-surface-2)` | same | alias of surface-2 |

## Type scale: fluid display and heading sizes, fixed body sizes

| Token | Light | Dark | Use |
|---|---|---|---|
| `--text-display-xl` | `clamp(2.75rem, 1.6rem + 4.4vw, 5rem) (line-height 1.05, letter-spacing -0.02em)` | same | hero headline |
| `--text-display` | `clamp(2.25rem, 1.5rem + 3vw, 3.75rem) (line-height 1.05, letter-spacing -0.02em)` | same | section headlines |
| `--text-h1` | `clamp(1.875rem, 1.4rem + 1.8vw, 2.75rem) (line-height 1.2, letter-spacing -0.02em)` | same | page title |
| `--text-h2` | `clamp(1.5rem, 1.25rem + 1vw, 2rem) (line-height 1.2, letter-spacing -0.02em)` | same | section heading |
| `--text-h3` | `clamp(1.1875rem, 1.1rem + 0.4vw, 1.375rem) (line-height 1.2, letter-spacing -0.01em)` | same | sub-heading |
| `--text-body-lg` | `1.125rem (line-height 1.6)` | same | lead paragraphs |
| `--text-body` | `1rem (line-height 1.6)` | same | UI body |
| `--text-prose` | `clamp(1rem, 0.95rem + 0.25vw, 1.0625rem) (line-height 1.7)` | same | lesson prose: 16px mobile, 17px desktop |
| `--text-body-sm` | `0.875rem (line-height 1.5)` | same | secondary UI |
| `--text-caption` | `0.75rem (line-height 1.4)` | same | captions, all-caps labels (track 0.08em) |
| `--text-mono-lg` | `1.25rem (line-height 1.3)` | same | large readouts: equity, prices |
| `--text-mono` | `0.875rem (line-height 1.4)` | same | tickers, table numbers |
| `--text-mono-sm` | `0.75rem (line-height 1.4)` | same | chart labels, small figures |

## Layout

| Token | Light | Dark | Use |
|---|---|---|---|
| `--container-lesson` | `68ch` | same | lesson prose measure |
| `--spacing-section` | `clamp(4rem, 1.5rem + 7vw, 8rem)` | same | vertical rhythm between marketing sections |
| `--spacing-header` | `3.75rem` | same | sticky header height, 60px; pages that fill the viewport subtract it |
| `--spacing-tabbar` | `4rem` | same | mobile bottom tab bar; content pads by it so nothing hides underneath |

## Radius: the design scale, named by what it rounds (md 10, lg 14, xl 20, 2xl 28 px)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--radius-control` | `10px` | same | buttons, inputs, segmented controls |
| `--radius-panel` | `10px` | same | panels and nested areas |
| `--radius-card` | `14px` | same | cards |
| `--radius-dialog` | `20px` | same | dialogs, sheets, the command palette |
| `--radius-feature` | `28px` | same | hero and feature blocks |

## Elevation: light theme uses soft layered shadows

| Token | Light | Dark | Use |
|---|---|---|---|
| `--shadow-1` | `0 1px 2px oklch(0.2 0.02 255 / 0.06), 0 1px 1px oklch(0.2 0.02 255 / 0.04)` | `inset 0 1px 0 oklch(1 0 0 / 0.04)` | resting card |
| `--shadow-2` | `0 2px 6px oklch(0.2 0.02 255 / 0.07), 0 1px 2px oklch(0.2 0.02 255 / 0.05)` | `inset 0 1px 0 oklch(1 0 0 / 0.06)` | raised card, hover |
| `--shadow-3` | `0 8px 24px oklch(0.2 0.02 255 / 0.1), 0 2px 6px oklch(0.2 0.02 255 / 0.06)` | `inset 0 1px 0 oklch(1 0 0 / 0.06), 0 12px 32px oklch(0 0 0 / 0.45)` | popover, menu |
| `--shadow-4` | `0 20px 48px oklch(0.2 0.02 255 / 0.16), 0 4px 12px oklch(0.2 0.02 255 / 0.08)` | `inset 0 1px 0 oklch(1 0 0 / 0.08), 0 24px 64px oklch(0 0 0 / 0.55)` | modal, palette |

## Motion: easings (durations are below, outside the theme)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | same | most movement |
| `--ease-emphasized` | `cubic-bezier(0.3, 0, 0, 1)` | same | entrances that should feel deliberate |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | same | things leaving |

## Motion

| Token | Light | Dark | Use |
|---|---|---|---|
| `--duration-fast` | `120ms` | same | hover, press |
| `--duration-base` | `200ms` | same | most transitions, route change |
| `--duration-slow` | `320ms` | same | panels, sheets |
| `--duration-deliberate` | `600ms` | same | number flashes, emphasis |
