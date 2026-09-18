import { Link, useParams, Navigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowLeft, Clock } from 'lucide-react';
import { findModule, CURRICULUM, LEVELS } from '@/content/curriculum';
import { useProgress, lessonKey, moduleProgress } from '@/store/progress';

export function ModulePage() {
  const { moduleId = '' } = useParams();
  const mod = findModule(moduleId);
  const completed = useProgress((s) => s.completed);
  if (!mod) return <Navigate to="/learn" replace />;
  const mp = moduleProgress(completed, mod.id);
  const firstUndone = mod.lessons.find((l) => !completed[lessonKey(mod.id, l.id)]) ?? mod.lessons[0];
  const prevMod = CURRICULUM[mod.number - 1];
  const nextMod = CURRICULUM[mod.number + 1];
  const mins = mod.lessons.reduce((s, l) => s + l.minutes, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link to="/learn" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={14} /> All modules
      </Link>
      <header className="flex gap-5">
        <span className="text-5xl">{mod.emoji}</span>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Module {mod.number} · {mod.subtitle} · {LEVELS[mod.level].label}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{mod.title}</h1>
          <p className="mt-2 text-ink-soft">{mod.description}</p>
          <div className="mt-3 flex items-center gap-3 text-sm text-ink-soft">
            <Clock size={14} /> {mins} min · {mod.lessons.length} lessons · {mp.pct}% complete
          </div>
          <Link to={`/learn/${mod.id}/${firstUndone.id}`} className="btn-primary mt-4">
            {mp.done ? 'Continue module' : 'Start module'}
          </Link>
        </div>
      </header>
      <ol className="overflow-hidden rounded-2xl border border-line bg-surface">
        {mod.lessons.map((l, i) => {
          const done = !!completed[lessonKey(mod.id, l.id)];
          return (
            <li key={l.id} className="border-b border-line last:border-0">
              <Link to={`/learn/${mod.id}/${l.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-panel">
                {done ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-up" /> : <Circle size={18} className="mt-0.5 shrink-0 text-ink-soft" />}
                <span className="w-6 pt-0.5 font-mono text-xs text-ink-soft">{i + 1}</span>
                <span className="flex-1">
                  <span className="font-semibold">{l.title}</span>
                  <span className="block text-sm text-ink-soft">{l.summary}</span>
                </span>
                <span className="pt-0.5 text-xs text-ink-soft">{l.minutes} min</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="flex justify-between text-sm">
        {prevMod ? (
          <Link to={`/learn/${prevMod.id}`} className="btn-ghost">
            ← {prevMod.title}
          </Link>
        ) : (
          <span />
        )}
        {nextMod && (
          <Link to={`/learn/${nextMod.id}`} className="btn-ghost">
            {nextMod.title} →
          </Link>
        )}
      </div>
    </div>
  );
}
