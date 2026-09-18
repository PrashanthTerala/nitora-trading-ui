import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CandlestickChart, Brain, NotebookPen, ShieldCheck, Sparkles } from 'lucide-react';
import { CURRICULUM, LEVELS, TOTAL_LESSONS, TOTAL_MINUTES, type Level } from '@/content/curriculum';
import { useProgress, overallProgress, nextLesson, moduleProgress } from '@/store/progress';
import { CandleSvg } from '@/components/figures/CandleSvg';
import { regimeSeries } from '@/content/figures';

const heroBars = regimeSeries('trend-up', 60);

export function HomePage() {
  const completed = useProgress((s) => s.completed);
  const prog = overallProgress(completed);
  const next = nextLesson(completed);

  return (
    <div className="space-y-16">
      {/* hero */}
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <span className="chip chip-on mb-4">
            <Sparkles size={12} className="mr-1" /> Free · No sign-up · Zero risk
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Learn trading from zero.
            <br />
            <span className="text-accent">Practise without losing a cent.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            A complete, plain-language school of trading: every candle, pattern, indicator, order type, risk rule and mental trap, taught one small step at a time, then practised in a
            realistic paper-trading simulator with bar-by-bar replay.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={next ? next.path : '/learn'} className="btn-primary text-base">
              {prog.done > 0 ? 'Continue learning' : 'Start at Kindergarten'} <ArrowRight size={16} />
            </Link>
            <Link to="/simulator" className="btn-ghost text-base">
              <CandlestickChart size={16} /> Open the simulator
            </Link>
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-ink-soft">Lessons</dt>
              <dd className="font-mono text-2xl font-bold">{TOTAL_LESSONS}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Modules</dt>
              <dd className="font-mono text-2xl font-bold">{CURRICULUM.length}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Reading time</dt>
              <dd className="font-mono text-2xl font-bold">{Math.round(TOTAL_MINUTES / 60)}h</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-3 shadow-xl">
          <CandleSvg bars={heroBars} height={300} showVolume />
        </div>
      </section>

      {/* pillars */}
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { icon: BookOpen, title: 'A real curriculum', text: 'Thirteen modules from "what is a market" to options Greeks, ordered so each idea stands on the last.', to: '/learn' },
          { icon: CandlestickChart, title: 'A real simulator', text: 'Eight synthetic markets with distinct personalities, every order type, brackets, leverage and margin calls.', to: '/simulator' },
          { icon: Brain, title: 'Pattern trainer', text: 'Flash-card drills that show you a candle snippet and ask what it is, and a next-candle prediction game.', to: '/trainer' },
          { icon: NotebookPen, title: 'An honest journal', text: 'Every simulated trade is logged with R-multiples, expectancy, profit factor and drawdown. Tag your mistakes.', to: '/journal' },
        ].map((p) => (
          <Link key={p.title} to={p.to} className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-accent/60 hover:shadow-md">
            <p.icon className="mb-3 text-accent" size={22} />
            <h3 className="font-bold">{p.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{p.text}</p>
          </Link>
        ))}
      </section>

      {/* path */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">The learning path</h2>
            <p className="text-ink-soft">Named like school years on purpose. Nobody skips a grade.</p>
          </div>
          <Link to="/learn" className="text-sm font-semibold text-accent">
            All modules →
          </Link>
        </div>
        <div className="space-y-8">
          {(Object.keys(LEVELS) as Level[]).map((lv) => (
            <div key={lv}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-soft">
                {LEVELS[lv].label} <span className="font-normal normal-case tracking-normal">· {LEVELS[lv].blurb}</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CURRICULUM.filter((m) => m.level === lv).map((m) => {
                  const mp = moduleProgress(completed, m.id);
                  return (
                    <Link key={m.id} to={`/learn/${m.id}`} className="flex gap-3 rounded-xl border border-line bg-surface p-4 transition hover:border-accent/60">
                      <span className="text-2xl">{m.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                          Module {m.number} · {m.subtitle}
                        </div>
                        <div className="font-bold">{m.title}</div>
                        <div className="mt-1 line-clamp-2 text-sm text-ink-soft">{m.description}</div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                          <span className="h-1.5 flex-1 overflow-hidden rounded bg-panel">
                            <span className="block h-full bg-accent" style={{ width: `${mp.pct}%` }} />
                          </span>
                          {mp.done}/{mp.total}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-6 md:flex md:items-center md:gap-6">
        <ShieldCheck size={36} className="mb-3 shrink-0 text-up md:mb-0" />
        <div>
          <h3 className="font-bold">A promise about honesty</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Most people who trade actively lose money. This site will never tell you a pattern "always works" or that a strategy "can't lose". It teaches you to think in probabilities, size
            positions so that losses are survivable, and to measure yourself before risking real money. If a lesson ever sounds like hype, that is a bug: it should sound like a good
            teacher.
          </p>
        </div>
      </section>
    </div>
  );
}
