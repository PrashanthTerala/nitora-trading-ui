# TradeLab Academy — Lesson Writing Guide

This guide is the contract between the curriculum (`src/content/curriculum.ts`) and the lesson
files (`src/content/modules/<module-id>/<lesson-id>.mdx`). Every lesson must follow it so the site
reads as one voice and every file builds.

## 1. Where files go

One MDX file per lesson, at exactly:

```
src/content/modules/<module.id>/<lesson.id>.mdx
```

The `module.id` and `lesson.id` are declared in `src/content/curriculum.ts`. Do not invent new ids,
do not rename, do not skip. The page shell renders the lesson title, module name and reading time
from the curriculum, so **do not put an H1 in the file**. Start with prose.

## 2. Voice and pedagogy

The site promise is: *learn trading from zero, the way you would teach a bright ten-year-old.*

- **Analogy first, term second.** Introduce the everyday picture (lemonade stand, tug of war,
  queue at a shop), then name the real term in bold, then use the real term from then on.
- **One idea per paragraph, 2–4 sentences.** Short lines. No walls of text.
- **Concrete numbers over abstractions.** "You buy 10 shares at $50 and it falls to $45, so you are
  down $50" beats "losses occur when price declines".
- **Honest, not hyped.** Say when something is unreliable. Say "usually" and "often", never
  "always works". Trading is hard; the site should make people competent, not excited.
- **No financial advice, no product promotion, no guru tone.** No "I made $10k with this".
- **Build on earlier lessons.** Link to prior lessons when you use a term they taught, e.g.
  `[bid and ask](/learn/m00-what-is-a-market/07-bid-ask-spread)`.
- **British/American neutral spelling is fine; be consistent within a file.**
- Address the reader as "you". Contractions are fine.

## 3. Required structure

```
(2–3 paragraph hook: why this matters, the analogy)

## Section heading
prose, figures, callouts

## Section heading
...

<KeyTakeaways>
- 4 to 6 bullets, each one sentence
</KeyTakeaways>

<Quiz questions={[ ...4 to 6 questions... ]} />

(optional) <TryIt>…</TryIt>
```

Rules:
- Use `##` for sections and `###` for sub-sections. Never `#`.
- At least **one figure** in any lesson about candles, patterns, structure or indicators.
- At least **one `<Callout type="eli5">`** in every lesson (the child-level restatement).
- At least **one `<Callout type="warning">` or `type="danger"`** where there is a real trap.
- Target length: about **150 words per curriculum minute** (a 8-minute lesson ≈ 1,200 words).
  Minimum 800 words, maximum 2,000, excluding quiz.
- End with `<KeyTakeaways>` then `<Quiz>`. The quiz goes last (or `<TryIt>` after it).

## 4. Components (exact API)

All components are auto-available in MDX. Do not import anything.

### Callout
```mdx
<Callout type="eli5">
Imagine a lemonade stand...
</Callout>
```
`type` is one of: `eli5`, `tip`, `warning`, `danger`, `info`, `story`, `math`. Optional `title="..."`.
Put a blank line after the opening tag and before the closing tag. Markdown works inside.

### KeyTakeaways
```mdx
<KeyTakeaways>
- First point.
- Second point.
</KeyTakeaways>
```

### Quiz
```mdx
<Quiz questions={[
  { q: "What does a long lower wick on a candle tell you?", options: ["Buyers gave up", "Sellers pushed price down but buyers pushed it back", "The market was closed", "Volume was low"], answer: 1, explain: "The wick shows where price went and was rejected." },
  { q: "...", options: ["...", "...", "...", "..."], answer: 0, explain: "..." }
]} />
```
- `answer` is the zero-based index of the correct option.
- **Inside `questions={[...]}` you are writing JavaScript**: use double quotes for all strings, and
  write apostrophes inside them normally (`"It's fine"`). Never use a double quote inside a
  double-quoted string; rephrase instead.
- 4 options per question, 4–6 questions. Mix recall and application ("what would you do").

### Figures

**Preset figure** (preferred; every candle and chart pattern has one):
```mdx
<PatternFigure name="hammer" />
<PatternFigure name="hammer" caption="Your own caption overriding the default." />
```
Available names:

Candle anatomy: `anatomy-bullish`, `anatomy-bearish`, `body-sizes`

Single candle: `doji`, `long-legged-doji`, `dragonfly-doji`, `gravestone-doji`, `hammer`, `hanging-man`,
`inverted-hammer`, `shooting-star`, `marubozu-bullish`, `marubozu-bearish`, `spinning-top`, `high-wave`

Two candle: `bullish-engulfing`, `bearish-engulfing`, `bullish-harami`, `bearish-harami`, `harami-cross`,
`piercing-line`, `dark-cloud-cover`, `tweezer-bottom`, `tweezer-top`, `bullish-counterattack`, `bearish-counterattack`

Three candle: `morning-star`, `evening-star`, `morning-doji-star`, `abandoned-baby-bullish`, `abandoned-baby-bearish`,
`three-white-soldiers`, `three-black-crows`, `three-inside-up`, `three-inside-down`, `three-outside-up`, `three-outside-down`

Continuation: `rising-three-methods`, `falling-three-methods`, `upside-tasuki-gap`, `downside-tasuki-gap`,
`rising-window`, `falling-window`, `mat-hold-bullish`, `mat-hold-bearish`, `on-neck`, `in-neck`, `thrusting-line`

Context lessons: `hammer-no-context`, `pattern-at-support`

Chart patterns: `head-and-shoulders`, `inverse-head-and-shoulders`, `double-top`, `double-bottom`, `triple-top`,
`triple-bottom`, `ascending-triangle`, `descending-triangle`, `symmetrical-triangle`, `bull-flag`, `bear-flag`,
`pennant`, `rising-wedge`, `falling-wedge`, `rectangle`, `cup-and-handle`, `rounding-bottom`

Market structure: `uptrend`, `downtrend`, `range`, `support-resistance`, `breakout-retest`, `fakeout`,
`role-reversal`, `supply-demand`, `wyckoff-cycle`, `gap-up`, `gap-down`

**Chart types side by side** (for the chart-types lesson):
```mdx
<ChartTypesFigure />
```

**Indicator figure** (computed live from a synthetic series):
```mdx
<IndicatorFigure indicator="rsi" />
<IndicatorFigure indicator="bollinger" regime="range" caption="..." />
<IndicatorFigure indicator="sma" period={50} />
```
`indicator` is one of: `sma`, `ema`, `sma-vs-ema`, `crossover`, `rsi`, `macd`, `stochastic`, `bollinger`,
`atr`, `vwap`, `obv`, `adx`, `fibonacci`, `pivots`, `divergence`, `overload`, `clean`.
`regime` (optional) is one of: `trend-up`, `trend-down`, `range`, `reversal`, `volatile`, `crash`, `intraday`.

**Custom candles** (when no preset fits):
```mdx
<CandleFigure
  title="A gap that got filled"
  bars={[
    { o: 100, h: 102, l: 99, c: 101.5 },
    { o: 104, h: 105, l: 103, c: 104.5 },
    { o: 104.4, h: 104.8, l: 101, c: 101.2 }
  ]}
  annotations={[
    { type: "label", index: 1, text: "gap up" },
    { type: "hline", price: 102, text: "old high", from: 0, to: 2 },
    { type: "zone", from: 0, to: 2, priceFrom: 101, priceTo: 102, text: "zone" },
    { type: "arrow", index: 2, direction: "down", text: "filled" },
    { type: "bracket", from: 0, to: 2, text: "three days" }
  ]}
  caption="..."
  showVolume={false}
/>
```
Each bar is `{ o, h, l, c, v? }`. Keep `h` ≥ max(o,c) and `l` ≤ min(o,c). Annotation types:
`label` (index, text, position?: "above"|"below"), `hline` (price, text?, from?, to?),
`zone` (from, to, priceFrom, priceTo, text?), `line` (from: [index, price], to: [index, price], text?, extend?),
`arrow` (index, direction, text?), `bracket` (from, to, text, position?), `highlight` (from, to).

### Widgets
- `<Term id="spread">the spread</Term>` — glossary hover link. Use for the first mention of a
  glossary term in a lesson. Ids are kebab-case (`bid`, `ask`, `spread`, `stop-loss`, `rsi`...).
- `<TryIt to="/simulator">Open the simulator, pick NOVA on the 5m chart and ...</TryIt>` — send the reader to practise.
  `to` can be `/simulator`, `/trainer` (pattern trainer) or `/journal`.
- `<Compare left="Trader" right="Investor">` + two markdown lists `</Compare>` — two-column table.
- `<StatRow><Stat value="1%" label="risk per trade" /> ... </StatRow>` — up to 4 stats.
- `<PositionSizer />`, `<ExpectancyCalc />`, `<RecoveryTable />`, `<StreakSimulator />` — interactive calculators for the risk module.

## 5. MDX gotchas (these break the build)

- Never write a bare `<` or `>` in prose. Write "less than", "greater than", or use `&lt;`.
  This includes things like `<50` or `->`. Arrows: write "to" or use `→`.
- Never write `{` or `}` in prose. In JSX props they are fine.
- No HTML comments (`<!-- -->`). No raw HTML tags other than the components above.
- Blank line before and after every component block and every heading.
- Inside component *props* you write JavaScript (double quotes). Inside component *children* you
  write Markdown.
- Do not indent component blocks by 4+ spaces (it becomes a code block).
- Markdown tables (GFM) are fine and encouraged for comparisons.
- Use `**bold**` for defined terms on first use, `*italic*` sparingly, inline `code` only for
  actual keys/values like `GTC` or `0.01`.
- Percent signs, dollar signs and numbers are fine anywhere.

## 6. Quality checklist before finishing a lesson

- [ ] File path matches curriculum ids exactly.
- [ ] No H1. Starts with a hook.
- [ ] At least one eli5 callout; at least one figure where visual.
- [ ] Every claim about reliability is hedged honestly.
- [ ] Links to at least one earlier lesson where relevant.
- [ ] `<KeyTakeaways>` then `<Quiz>` at the end; quiz is valid JS with double quotes.
- [ ] No bare `<`, `>`, `{`, `}` in prose.
- [ ] Word count in range for the lesson's minutes.
