# Changelog

## Unreleased — the visual and experience overhaul

The whole site was redesigned as a quiet, premium trading terminal crossed with a well-set
textbook, in seven phases, without changing a word of lesson content, the market engine or a
storage key. Progress, journals and simulator sessions carry over untouched.

### Design system (phase 0)

- Design tokens in `src/styles/tokens.css`: OKLCH colours for both themes, type scale, spacing,
  radii, shadows and motion. Documented in `docs/DESIGN.md`, tabulated in `docs/tokens.md`, and
  shown live at `/__tokens` in development.
- `npm run lint:tokens`: no raw colour outside the token files, every text and control colour
  pair checked for contrast in both themes, chart colours kept distinguishable.
- Self-hosted fonts (Geist, Inter, JetBrains Mono): no request to Google Fonts.

### Shell, home, learn and module pages (phase 1)

- New header with a logo mark, an animated nav pill, a progress ring and a theme toggle; a
  bottom tab bar on phones; a three-column footer that keeps the disclaimer word for word.
- Command palette (Ctrl K / ⌘K) over lessons, glossary terms, simulator symbols and pages.
- Toasts, route transitions, a route-progress bar and page-shaped loading skeletons.
- A rebuilt home page, and Learn and Module pages grouped by track and level.
- Tracks in the curriculum (`trading-foundations` today), optional lesson fields (`kind`,
  `prerequisites`, `tags`, `deck`), feature flags (`VITE_FLAGS`) and every interface string in
  `src/i18n/en.ts`.

### Lesson read mode (phase 2)

- Three columns: the module outline, the lesson, and an "On this page" list that tracks reading.
- Restyled callouts, takeaways, quizzes, figures and calculators; glossary terms show their
  definition on hover or focus; figures can switch between candles, line and bars, be linked to
  and open full screen.
- The MDX component registry, grouped by domain, with `SeriesFigure` for non-candle data and the
  planned quantitative components reserved by name.
- Per-page titles, descriptions and structured data; `robots.txt` and `sitemap.xml` at build.

### Presentation mode (phase 3)

- Every one of the 128 lessons can be presented as a slide deck, built automatically from the
  lesson (press P), with speaker notes, keyboard navigation and a print layout.
- `npm run test:decks` builds every deck and checks that no slide is empty and no quiz question
  or word is lost.

### 3D artwork (phase 4)

- A 3D home hero and a cover for each of the 13 modules, from one family of glass shapes, as
  rendered posters first and live scenes only where the device and the reader welcome them.
- 13 module glyphs, and a link-preview card per module.
- `tools/render-art.mjs` renders and commits the artwork, so production never needs WebGL.

### Simulator, trainer, journal, glossary, guide and 404 (phase 5)

- The simulator as a trading terminal: resizable panels, a collapsible order ticket (a bottom
  sheet on phones), animated account figures, a fully themed chart and a shortcuts overlay.
- An order ticket that picks a side first, sizes by risk, and shows problems before the click.
- Trainer sessions of ten rounds with a stats rail, keyboard answers, links to the teaching
  lesson and a copyable result.
- A journal with KPI trend lines, equity and R charts, and the market around each trade.
- Glossary terms in a side panel listing every lesson that uses them; a guide with an "On this
  page" list; illustrated 404 and empty-journal pages.

### Verification and polish (phase 6)

- `npm run audit` runs the release checks in a real browser against a production build: axe-core
  on every route and state in both themes and two widths, horizontal-scroll checks at five
  widths, a keyboard walk of every route, a reduced-motion walk, and desktop Lighthouse.
- Results: no serious or critical accessibility violation in 80 page states; no horizontal
  scroll at 360, 768, 1024, 1440 or 1920 px; 1,037 tab stops all visible, unobscured and ringed;
  nothing but opacity moves under reduced motion; Lighthouse performance 98–99 and 100
  accessibility, best practices and SEO on Home, Learn, a lesson and the Simulator.
- Fixed along the way: charts without a text alternative (the teaching figures and the
  simulator's chart), a search button whose name did not contain its visible label, tables that
  scrolled but could not be reached by keyboard, the deck letting Tab escape behind it, text
  fields without a focus ring, focus hidden under the sticky header or the phone tab bar, the
  header overflowing at 768 px, a contrast failure on an expanded journal row, and the live 3D
  scene's start-up (over half a second of blocked main thread) now split, moved to a worker and
  started only once the reader interacts. Also: a reader who had chosen the light theme could
  get the dark theme's artwork, because the saved theme was applied after the app had already
  read it.
- The legacy `.btn-*`, `.input` and `.chip` classes are gone; every page uses the UI kit.
- `npm run bundle:report` also holds the live 3D download to its 400 kB budget.

### New dependencies

`motion`, `@react-three/fiber`, `three`, `cmdk`, `@radix-ui/react-dialog` and the self-hosted
font packages at runtime or build; `axe-core`, `lighthouse` and `playwright-core` for the checks.
Each is justified in `docs/DESIGN.md`.
