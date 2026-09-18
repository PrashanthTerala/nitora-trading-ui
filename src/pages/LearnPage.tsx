import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle2, Circle, Clock } from 'lucide-react';
import { CURRICULUM, ALL_LESSONS, LEVELS, type Level } from '@/content/curriculum';
import { useProgress, lessonKey, moduleProgress, overallProgress, nextLesson } from '@/store/progress';

export function LearnPage() {
  const completed = useProgress((s) => s.completed);
  const [q, setQ] = useState('');
  const prog = overallProgress(completed);
  const next = nextLesson(completed);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return null;
    return ALL_LESSONS.filter((l) => `${l.title} ${l.summary} ${l.moduleTitle}`.toLowerCase().includes(s)).slice(0, 30);
  }, [q]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Curriculum</h1>
          <p className="mt-1 text-ink-soft">
            {prog.done} of {prog.total} lessons complete · {prog.pct}%
          </p>
        </div>
        {next && (
          <Link to={next.path} className="btn-primary">
            {prog.done ? 'Continue' : 'Start'}: {next.title}
          </Link>
        )}
      </div>

      <label className="relative block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons, e.g. hammer, RSI, stop loss, margin…" className="input w-full pl-10" />
      </label>

      {results ? (
        <div className="space-y-2">
          {results.length === 0 && <p className="text-ink-soft">No lessons match.</p>}
          {results.map((l) => (
            <Link key={l.path} to={l.path} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-accent/60">
              {completed[lessonKey(l.moduleId, l.id)] ? <CheckCircle2 size={16} className="text-up" /> : <Circle size={16} className="text-ink-soft" />}
              <div className="min-w-0 flex-1">
                <div className="text-xs text-ink-soft">
                  {l.moduleEmoji} Module {l.moduleNumber} · {l.moduleTitle}
                </div>
                <div className="font-semibold">{l.title}</div>
                <div className="truncate text-sm text-ink-soft">{l.summary}</div>
              </div>
              <span className="text-xs text-ink-soft">{l.minutes} min</span>
            </Link>
          ))}
        </div>
      ) : (
        (Object.keys(LEVELS) as Level[]).map((lv) => (
          <section key={lv}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-soft">
              {LEVELS[lv].label} <span className="font-normal normal-case tracking-normal">· {LEVELS[lv].blurb}</span>
            </h2>
            <div className="space-y-3">
              {CURRICULUM.filter((m) => m.level === lv).map((m) => {
                const mp = moduleProgress(completed, m.id);
                const mins = m.lessons.reduce((s, l) => s + l.minutes, 0);
                return (
                  <details key={m.id} className="group rounded-2xl border border-line bg-surface" open={mp.pct > 0 && mp.pct < 100}>
                    <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
                      <span className="text-3xl">{m.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                          Module {m.number} · {m.subtitle}
                        </div>
                        <div className="text-lg font-bold">{m.title}</div>
                        <div className="text-sm text-ink-soft">{m.description}</div>
                      </div>
                      <div className="hidden w-40 shrink-0 text-right text-xs text-ink-soft sm:block">
                        <div className="mb-1 flex items-center justify-end gap-1">
                          <Clock size={12} /> {mins} min · {m.lessons.length} lessons
                        </div>
                        <div className="h-1.5 overflow-hidden rounded bg-panel">
                          <div className="h-full bg-accent" style={{ width: `${mp.pct}%` }} />
                        </div>
                        <div className="mt-1">{mp.pct}% complete</div>
                      </div>
                    </summary>
                    <ol className="border-t border-line">
                      {m.lessons.map((l, i) => {
                        const done = !!completed[lessonKey(m.id, l.id)];
                        return (
                          <li key={l.id}>
                            <Link to={`/learn/${m.id}/${l.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-panel">
                              {done ? <CheckCircle2 size={16} className="shrink-0 text-up" /> : <Circle size={16} className="shrink-0 text-ink-soft" />}
                              <span className="w-6 font-mono text-xs text-ink-soft">{i + 1}</span>
                              <span className="flex-1">
                                <span className="font-medium">{l.title}</span>
                                <span className="hidden text-sm text-ink-soft sm:inline"> — {l.summary}</span>
                              </span>
                              <span className="text-xs text-ink-soft">{l.minutes} min</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ol>
                  </details>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
