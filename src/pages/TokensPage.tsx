/**
 * /__tokens -- the design-token sheet. Development builds only; see App.tsx.
 *
 * Everything here is read from src/styles/tokens.css at build time, and every contrast figure
 * comes from src/lib/tokenPolicy.ts -- the same rules tools/lint-tokens.mjs enforces -- so the
 * sheet cannot show a palette or a pass that the build does not also have.
 */
import { useEffect, useState, type CSSProperties } from 'react';
import tokensCss from '@/styles/tokens.css?raw';
import { isColorToken, parseTokens, resolve, type Theme, type Token } from '@/lib/tokens';
import { contrastResults, DECORATIVE, NON_TEXT, TEXT, type ContrastResult } from '@/lib/tokenPolicy';
import { ALL_LESSONS, CURRICULUM, LEVELS } from '@/content/curriculum';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';

const TOKENS = parseTokens(tokensCss);
const RESULTS = contrastResults(TOKENS);
const THEMES: Theme[] = ['dark', 'light'];

const short = (name: string) => name.replace(/^--color-/, '');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Real content only: the samples quote the curriculum rather than placeholder text.
const MODULE = CURRICULUM[2];
const LESSON = ALL_LESSONS.find((l) => l.summary.length > 60) ?? ALL_LESSONS[0];

export function TokensPage() {
  const failing = RESULTS.filter((r) => !r.pass);
  const colorGroups = groupBy(TOKENS.filter(isColorToken));

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">Design system · development only</p>
        <h1 className="font-display text-h1 font-bold">Design tokens</h1>
        <p className="max-w-3xl text-body text-ink-soft">
          Read from <code className="font-mono text-mono">src/styles/tokens.css</code>. Swatches show both themes side by side, each on its own page
          background; the live samples lower down follow the current theme. Contrast is measured on the colours as rendered, using the rules in{' '}
          <code className="font-mono text-mono">src/lib/tokenPolicy.ts</code> that <code className="font-mono text-mono">npm run check</code> enforces.
        </p>
        <ContrastSummary failing={failing} />
      </header>

      <section aria-labelledby="colour" className="space-y-10">
        <h2 id="colour" className="font-display text-h2 font-bold">
          Colour
        </h2>
        {colorGroups.map(([group, tokens]) => (
          <ColorGroup key={group} group={group} tokens={tokens} />
        ))}
      </section>

      <TypeSection />
      <ElevationSection />
      <MotionSection />
      <LiveSamples />
    </div>
  );
}

// ---------------------------------------------------------------- contrast

function ContrastSummary({ failing }: { failing: ContrastResult[] }) {
  const tightest = (theme: Theme) =>
    RESULTS.filter((r) => r.theme === theme)
      .sort((a, b) => a.got / a.ratio - b.got / b.ratio)
      .slice(0, 3);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className={`rounded-xl border p-4 ${failing.length ? 'border-down bg-down-soft' : 'border-line bg-surface-1'}`}>
        <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">Contrast checks</p>
        <p className="mt-1 font-mono text-mono-lg tabular-nums">
          {RESULTS.length - failing.length}/{RESULTS.length} pass
        </p>
        <p className="mt-1 text-body-sm text-ink-soft">
          Text {TEXT}:1 · controls and graphics {NON_TEXT}:1. Decorative hairlines exempt: {DECORATIVE.join(', ')}.
        </p>
      </div>
      {THEMES.map((theme) => (
        <div key={theme} className="rounded-xl border border-line bg-surface-1 p-4">
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">Tightest in {theme}</p>
          <ul className="mt-2 space-y-1">
            {tightest(theme).map((r) => (
              <li key={r.fg + r.bg} className="flex justify-between gap-3 text-body-sm">
                <span className="text-ink-soft">
                  {r.fg} on {r.bg}
                </span>
                <span className="font-mono tabular-nums">{r.got.toFixed(2)}:1</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- colour

function groupBy(tokens: Token[]): [string, Token[]][] {
  const out = new Map<string, Token[]>();
  for (const t of tokens) out.set(t.group, [...(out.get(t.group) ?? []), t]);
  return [...out.entries()];
}

function ColorGroup({ group, tokens }: { group: string; tokens: Token[] }) {
  const [title, ...rest] = group.split(':');
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display text-h3 font-semibold">{cap(title.trim())}</h3>
        {rest.length > 0 && <p className="text-body-sm text-ink-soft">{cap(rest.join(':').trim())}</p>}
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        {tokens.map((t, i) => (
          <ColorRow key={t.name} token={t} striped={i % 2 === 1} />
        ))}
      </div>
    </div>
  );
}

function ColorRow({ token, striped }: { token: Token; striped: boolean }) {
  const name = short(token.name);
  const alias = /^var\(/.test(token.light) ? token.light.replace(/^var\(--color-|\)$/g, '') : null;
  return (
    <div className={`grid gap-3 border-b border-line-subtle p-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)] ${striped ? 'bg-surface-1' : ''}`}>
      <div className="min-w-0">
        <p className="font-mono text-mono font-semibold">{name}</p>
        <p className="text-body-sm text-ink-soft">{alias ? `Alias of ${alias} — kept so existing classes keep working.` : token.doc}</p>
      </div>
      {THEMES.map((theme) => (
        <Swatch key={theme} theme={theme} name={token.name} />
      ))}
    </div>
  );
}

function Swatch({ theme, name }: { theme: Theme; name: string }) {
  const value = resolve(TOKENS, name, theme);
  const page = resolve(TOKENS, '--color-bg', theme);
  const checks = RESULTS.filter((r) => r.theme === theme && `--color-${r.fg}` === name);
  const min = checks.length ? checks.reduce((a, b) => (a.got / a.ratio < b.got / b.ratio ? a : b)) : null;
  const decorative = DECORATIVE.includes(short(name));
  // The swatch sits on its own theme's page background, so a translucent token shows as it
  // renders rather than over whatever theme the sheet happens to be in.
  const frame: CSSProperties = { background: page };
  const fill: CSSProperties = { background: value };
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="shrink-0 rounded-lg border border-line p-1.5" style={frame}>
        <div className="h-9 w-14 rounded-md" style={fill} role="img" aria-label={`${short(name)} in the ${theme} theme: ${value}`} />
      </div>
      <div className="min-w-0 text-body-sm">
        <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">{theme}</p>
        <p className="truncate font-mono text-mono-sm text-ink-soft" title={value}>
          {value.replace(/^oklch\((.*)\)$/, '$1')}
        </p>
        {min && (
          <p className={`font-mono text-mono-sm tabular-nums ${min.pass ? 'text-ink-soft' : 'font-bold text-down'}`}>
            {min.pass ? '✓' : '✗'} {min.got.toFixed(2)}:1 on {min.bg}
          </p>
        )}
        {decorative && <p className="text-mono-sm text-ink-muted">decorative, exempt</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- type

// Static class strings: Tailwind finds classes by scanning source, so they cannot be built
// from the token name at runtime.
const SCALE: { token: string; className: string; sample: string; family: string }[] = [
  { token: 'display-xl', className: 'text-display-xl', family: 'font-display font-bold', sample: 'Learn trading from zero.' },
  { token: 'display', className: 'text-display', family: 'font-display font-bold', sample: MODULE.title },
  { token: 'h1', className: 'text-h1', family: 'font-display font-bold', sample: LESSON.title },
  { token: 'h2', className: 'text-h2', family: 'font-display font-bold', sample: MODULE.subtitle },
  { token: 'h3', className: 'text-h3', family: 'font-sans font-semibold', sample: LEVELS.analysis.label },
  { token: 'body-lg', className: 'text-body-lg', family: 'font-sans', sample: LESSON.summary },
  { token: 'prose', className: 'text-prose', family: 'font-sans', sample: LEVELS.foundation.blurb },
  { token: 'body', className: 'text-body', family: 'font-sans', sample: LEVELS.execution.blurb },
  { token: 'body-sm', className: 'text-body-sm', family: 'font-sans', sample: LEVELS.mastery.blurb },
  { token: 'caption', className: 'text-caption uppercase tracking-[0.08em]', family: 'font-sans font-semibold', sample: `Module ${String(MODULE.number).padStart(2, '0')} · ${MODULE.lessons.length} lessons` },
  { token: 'mono-lg', className: 'text-mono-lg tabular-nums', family: 'font-mono', sample: '100,000.00  +1,245.50  −312.75' },
  { token: 'mono', className: 'text-mono tabular-nums', family: 'font-mono', sample: 'NOVA 137.32  +2.1R  IDX 5,138.25' },
  { token: 'mono-sm', className: 'text-mono-sm tabular-nums', family: 'font-mono', sample: 'SMA 20 · EMA 50 · RSI 14 · 1m 5m 15m 1h' },
];

function TypeSection() {
  const byName = new Map(TOKENS.map((t) => [t.name, t]));
  return (
    <section aria-labelledby="type" className="space-y-6">
      <h2 id="type" className="font-display text-h2 font-bold">
        Type
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Inter', 'font-sans', 'Body and interface', '--font-sans'],
          ['Geist', 'font-display', 'Headings and hero numbers, from Phase 1', '--font-display'],
          ['JetBrains Mono', 'font-mono', 'Prices, tickers, R-multiples, code', '--font-mono'],
        ].map(([label, cls, use, token]) => (
          <div key={token} className="rounded-xl border border-line bg-surface-1 p-4">
            <p className={`${cls} text-h2 font-semibold`}>Aa 0123 −4.5</p>
            <p className="mt-2 font-semibold">{label}</p>
            <p className="text-body-sm text-ink-soft">{use}</p>
            <p className="mt-1 font-mono text-mono-sm text-ink-muted">{token} · self-hosted, variable</p>
          </div>
        ))}
      </div>
      <div className="divide-y divide-line-subtle overflow-hidden rounded-xl border border-line">
        {SCALE.map((s) => {
          const t = byName.get(`--text-${s.token}`);
          return (
            <div key={s.token} className="grid gap-2 p-4 md:grid-cols-[11rem_minmax(0,1fr)] md:items-baseline">
              <div>
                <p className="font-mono text-mono font-semibold">{s.token}</p>
                <p className="font-mono text-mono-sm text-ink-muted">
                  {t?.light}
                  {t?.extras['line-height'] ? ` / ${t.extras['line-height']}` : ''}
                </p>
              </div>
              <p className={`${s.className} ${s.family} min-w-0 break-words`}>{s.sample}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- elevation

function ElevationSection() {
  const shadows = ['shadow-1', 'shadow-2', 'shadow-3', 'shadow-4'] as const;
  // Static strings again, for the Tailwind scanner.
  const cls: Record<(typeof shadows)[number], string> = { 'shadow-1': 'shadow-1', 'shadow-2': 'shadow-2', 'shadow-3': 'shadow-3', 'shadow-4': 'shadow-4' };
  const docs = new Map(TOKENS.map((t) => [t.name, t.doc]));
  return (
    <section aria-labelledby="elevation" className="space-y-4">
      <h2 id="elevation" className="font-display text-h2 font-bold">
        Elevation
      </h2>
      <p className="max-w-3xl text-body-sm text-ink-soft">
        Light mode uses soft layered shadows. Dark mode uses border lightness and a faint inner top highlight instead: a drop shadow on a near-black
        page reads as a smudge, not as height. Live, in the current theme.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {shadows.map((s) => (
          <div key={s} className={`rounded-xl border border-line bg-surface-1 p-5 ${cls[s]}`}>
            <p className="font-mono text-mono font-semibold">{s}</p>
            <p className="text-body-sm text-ink-soft">{docs.get(`--${s}`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- motion

function MotionSection() {
  const [on, setOn] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const durations = TOKENS.filter((t) => t.name.startsWith('--duration-'));
  const easings = TOKENS.filter((t) => t.name.startsWith('--ease-'));
  return (
    <section aria-labelledby="motion" className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="motion" className="font-display text-h2 font-bold">
          Motion
        </h2>
        <Button variant="secondary" size="sm" onClick={() => setOn((v) => !v)} aria-pressed={on}>
          {on ? 'Reset' : 'Play'}
        </Button>
        {reduced && <Chip size="md">Reduced motion is on: every duration is 0ms</Chip>}
      </div>
      <div className="divide-y divide-line-subtle overflow-hidden rounded-xl border border-line">
        {durations.map((d) => (
          <MotionRow key={d.name} label={d.name.replace('--duration-', '')} detail={`${d.light} · ${d.doc}`} duration={`var(${d.name})`} easing="var(--ease-standard)" on={on} />
        ))}
        {easings.map((e) => (
          <MotionRow key={e.name} label={e.name.replace('--ease-', 'ease ')} detail={`${e.light} · ${e.doc}`} duration="var(--duration-deliberate)" easing={`var(${e.name})`} on={on} />
        ))}
      </div>
    </section>
  );
}

function MotionRow({ label, detail, duration, easing, on }: { label: string; detail: string; duration: string; easing: string; on: boolean }) {
  // Only transform moves, never width or position: the brief's rule, and the cheap one.
  const dot: CSSProperties = { transition: `transform ${duration} ${easing}`, transform: on ? 'translateX(calc(100% * 11))' : 'none' };
  return (
    <div className="grid gap-2 p-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
      <div>
        <p className="font-mono text-mono font-semibold">{label}</p>
        <p className="font-mono text-mono-sm text-ink-muted">{detail}</p>
      </div>
      <div className="h-6 overflow-hidden rounded-full bg-surface-2">
        <div className="h-6 w-[8%] rounded-full bg-accent" style={dot} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- live samples

function LiveSamples() {
  return (
    <section aria-labelledby="samples" className="space-y-6">
      <div>
        <h2 id="samples" className="font-display text-h2 font-bold">
          In use
        </h2>
        <p className="max-w-3xl text-body-sm text-ink-soft">
          The pairings the components move to in Phase 1 and later, live in the current theme. Every label here clears 4.5:1; today's buttons use
          white labels, which in the dark theme measure 2.5:1 on the accent and 2.3:1 on Buy.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="rounded-lg bg-accent px-4 py-2 text-body-sm font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ring">
          Start at Kindergarten
        </button>
        <button type="button" className="rounded-lg bg-up px-4 py-2 text-body-sm font-bold text-on-up focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ring">
          Buy NOVA
        </button>
        <button type="button" className="rounded-lg bg-down px-4 py-2 text-body-sm font-bold text-on-down focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ring">
          Sell NOVA
        </button>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-caption font-semibold text-accent">Active</span>
        <span className="rounded-full bg-ink px-3 py-1 text-caption font-semibold text-ink-inverse">Completed</span>
        <label className="flex items-center gap-2 text-body-sm text-ink-soft">
          Quantity
          <input
            defaultValue="70"
            inputMode="numeric"
            className="w-24 rounded-lg border border-line-strong bg-surface-1 px-3 py-1.5 font-mono text-mono tabular-nums text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Readout label="Open P&L" value="+1,245.50" className="text-up" />
        <Readout label="Day P&L" value="−312.75" className="text-down" />
        <Readout label="Unchanged" value="0.00" className="text-neutral" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[
          ['warn', 'Caution', 'Leverage multiplies losses as well as gains.', 'bg-warn-soft', 'text-warn'],
          ['danger', 'A real mistake', 'Moving a stop further away to avoid being stopped out.', 'bg-danger-soft', 'text-danger'],
          ['info', 'Note', 'All market data in the simulator is synthetic.', 'bg-info-soft', 'text-info'],
          ['up', 'Profit', 'Closed at the target: +2.0R.', 'bg-up-soft', 'text-up'],
        ].map(([key, title, body, bg, fg]) => (
          <div key={key} className={`rounded-xl p-4 ${bg}`}>
            <p className={`font-semibold ${fg}`}>{title}</p>
            <p className="text-body-sm text-ink">{body}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface-1 p-4">
          <p className="mb-2 text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">Chart overlays</p>
          <ChartSample />
        </div>
        <div className="rounded-xl border border-line bg-surface-1 p-4">
          <p className="mb-3 text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">Curriculum levels</p>
          <ul className="space-y-2">
            {(
              [
                ['foundation', 'bg-level-foundation'],
                ['reading', 'bg-level-reading'],
                ['analysis', 'bg-level-analysis'],
                ['execution', 'bg-level-execution'],
                ['mastery', 'bg-level-mastery'],
              ] as const
            ).map(([level, dot]) => (
              <li key={level} className="flex items-center gap-2 text-body-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
                <span className="font-semibold">{LEVELS[level].label}</span>
                <span className="truncate text-ink-soft">{LEVELS[level].blurb}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Readout({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-4">
      <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">{label}</p>
      <p className={`font-mono text-mono-lg font-semibold tabular-nums ${className}`}>{value}</p>
    </div>
  );
}

function ChartSample() {
  // Six gently diverging series, one per overlay token, so the palette is judged as lines
  // on a chart surface rather than as squares.
  const W = 480;
  const H = 150;
  const series = [1, 2, 3, 4, 5, 6].map((k) =>
    Array.from({ length: 40 }, (_, i) => H / 2 + Math.sin(i / 5 + k) * (14 + k * 3) + (k - 3.5) * 11),
  );
  const path = (ys: number[]) => ys.map((y, i) => `${i ? 'L' : 'M'}${((i / (ys.length - 1)) * W).toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Six chart overlay colours drawn as lines">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="var(--color-grid)" strokeWidth={1} />
      ))}
      {series.map((ys, i) => (
        <path key={i} d={path(ys)} fill="none" stroke={`var(--color-chart-${i + 1})`} strokeWidth={2} />
      ))}
    </svg>
  );
}
