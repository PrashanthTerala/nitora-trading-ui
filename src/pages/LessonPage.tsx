import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock, List } from 'lucide-react';
import { findLesson, findModule } from '@/content/curriculum';
import { mdxComponents } from '@/components/mdx';
import { useProgress, lessonKey } from '@/store/progress';
import { LessonBodySkeleton } from '@/components/layout/PageSkeletons';
import { RouteFallback } from '@/components/layout/RouteProgress';
import { toast } from '@/components/ui/Toast';
import { t } from '@/i18n';

const lessonModules = import.meta.glob('../content/modules/*/*.mdx') as Record<string, () => Promise<{ default: ComponentType }>>;

function loaderFor(moduleId: string, lessonId: string) {
  return lessonModules[`../content/modules/${moduleId}/${lessonId}.mdx`];
}

export function LessonPage() {
  const { moduleId = '', lessonId = '' } = useParams();
  const found = findLesson(moduleId, lessonId);
  const mod = findModule(moduleId);
  const completed = useProgress((s) => s.completed);
  const markComplete = useProgress((s) => s.markComplete);
  const unmarkComplete = useProgress((s) => s.unmarkComplete);
  const setLastVisited = useProgress((s) => s.setLastVisited);
  const complete = (k: string) => {
    markComplete(k);
    toast({ title: t('toast.lessonComplete'), tone: 'up' });
  };
  const quizScores = useProgress((s) => s.quizScores);
  const [Content, setContent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = lessonKey(moduleId, lessonId);
  const done = !!completed[key];

  useEffect(() => {
    setContent(null);
    setError(null);
    const loader = loaderFor(moduleId, lessonId);
    if (!loader) {
      setError('missing');
      return;
    }
    let alive = true;
    loader()
      .then((m) => alive && setContent(() => m.default))
      .catch((e) => alive && setError(String(e)));
    setLastVisited(key);
    return () => {
      alive = false;
    };
  }, [moduleId, lessonId, key, setLastVisited]);

  const [showToc, setShowToc] = useState(false);
  const sidebar = useMemo(() => mod?.lessons ?? [], [mod]);

  if (!found || !mod) return <Navigate to="/learn" replace />;
  const { lesson, prev, next } = found;
  const quiz = quizScores[key];

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
      {/* module sidebar */}
      <aside className="mb-6 lg:mb-0">
        <div className="lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)]">
          <button type="button" onClick={() => setShowToc((s) => !s)} className="btn-ghost mb-2 w-full justify-between lg:hidden">
            <span className="flex items-center gap-2">
              <List size={14} /> {t('common.module', { number: mod.number })} · {mod.title}
            </span>
            <span className="text-xs text-ink-soft">
              {lesson.index + 1}/{mod.lessons.length}
            </span>
          </button>
          <nav className={`${showToc ? 'block' : 'hidden'} rounded-2xl border border-line bg-surface p-3 lg:block`}>
            <Link to={`/learn/${mod.id}`} className="mb-2 block px-2 text-xs font-bold uppercase tracking-wider text-ink-soft hover:text-ink">
              {t('common.module', { number: mod.number })} · {mod.title}
            </Link>
            <ol className="space-y-0.5">
              {sidebar.map((l, i) => {
                const active = l.id === lesson.id;
                const d = !!completed[lessonKey(mod.id, l.id)];
                return (
                  <li key={l.id}>
                    <Link to={`/learn/${mod.id}/${l.id}`} className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-[13px] leading-snug ${active ? 'bg-accent/10 font-semibold text-accent' : 'text-ink-soft hover:bg-panel hover:text-ink'}`}>
                      {d ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-up" /> : <Circle size={14} className="mt-0.5 shrink-0 opacity-50" />}
                      <span>
                        <span className="mr-1 font-mono text-[11px] opacity-60">{i + 1}.</span>
                        {l.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </aside>

      {/* lesson */}
      <article className="min-w-0 max-w-3xl">
        <header className="mb-8 border-b border-line pb-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Module {mod.number} · {mod.subtitle} · Lesson {lesson.index + 1} of {mod.lessons.length}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">{lesson.title}</h1>
          <p className="mt-3 text-lg text-ink-soft">{lesson.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {lesson.minutes} min read
            </span>
            {quiz && (
              <span className="chip">
                Quiz best: {quiz.score}/{quiz.total}
              </span>
            )}
            {done && (
              <span className="chip chip-on">
                <CheckCircle2 size={12} className="mr-1" /> Completed
              </span>
            )}
          </div>
        </header>

        <div className="prose-lesson">
          {error === 'missing' && (
            <div className="rounded-xl border border-warn/40 bg-warn/10 p-5 text-sm">
              This lesson is still being written. Check back soon, or continue to the next lesson.
            </div>
          )}
          {error && error !== 'missing' && <div className="rounded-xl border border-down/40 bg-down/10 p-5 text-sm">Failed to load lesson: {error}</div>}
          {!error && !Content && (
            <RouteFallback label={t('loading.lesson')}>
              <LessonBodySkeleton />
            </RouteFallback>
          )}
          {Content && (
            <MDXProvider components={mdxComponents}>
              <Content />
            </MDXProvider>
          )}
        </div>

        <footer className="mt-12 space-y-6 border-t border-line pt-6">
          <div className="flex flex-wrap items-center gap-3">
            {done ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  unmarkComplete(key);
                  toast({ title: t('toast.lessonUndone') });
                }}
              >
                <CheckCircle2 size={16} className="text-up" /> Completed · mark as not done
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => complete(key)}>
                <CheckCircle2 size={16} /> Mark lesson complete
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link to={prev.path} className="group rounded-xl border border-line bg-surface p-4 hover:border-accent/60">
                <div className="flex items-center gap-1 text-xs text-ink-soft">
                  <ArrowLeft size={12} /> Previous
                </div>
                <div className="mt-1 font-semibold group-hover:text-accent">{prev.title}</div>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                to={next.path}
                onClick={() => !done && markComplete(key)}
                className="group rounded-xl border border-line bg-surface p-4 text-right hover:border-accent/60"
              >
                <div className="flex items-center justify-end gap-1 text-xs text-ink-soft">
                  Next <ArrowRight size={12} />
                </div>
                <div className="mt-1 font-semibold group-hover:text-accent">{next.title}</div>
                {next.moduleId !== mod.id && <div className="text-xs text-ink-soft">Starts module {next.moduleNumber}: {next.moduleTitle}</div>}
              </Link>
            ) : (
              <Link to="/simulator" className="rounded-xl border border-accent/40 bg-accent/5 p-4 text-right">
                <div className="text-xs text-ink-soft">You finished the curriculum 🎓</div>
                <div className="mt-1 font-semibold text-accent">Go practise in the simulator</div>
              </Link>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}
