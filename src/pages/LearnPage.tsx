import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, m } from 'motion/react';
import { ArrowRight, ChevronDown, Clock, Search } from 'lucide-react';
import { ALL_LESSONS, LEVELS, TRACKS, findModule, moduleMinutes, modulesByLevel, type Level, type ModuleMeta, type TrackId } from '@/content/curriculum';
import { useProgress, lessonKey, moduleProgress, overallProgress, nextLesson } from '@/store/progress';
import { ModuleCover, LevelBadge, LevelRibbon } from '@/components/curriculum/ModuleCover';
import { LessonRow } from '@/components/curriculum/LessonRow';
import { cardClass } from '@/components/ui/Card';
import { Kbd } from '@/components/ui/Kbd';
import { Ring } from '@/components/ui/Ring';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { Tabs } from '@/components/ui/Tabs';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';
import { usePageMeta } from '@/lib/pageMeta';

type LevelFilter = Level | 'all';
type Completed = Record<string, number>;
type QuizScores = Record<string, { score: number; total: number }>;

/** `/` focuses the search box, unless the reader is already typing somewhere. */
function useSlashToFocus(ref: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      e.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ref]);
}

export function LearnPage() {
  usePageMeta({ title: t('learn.title'), description: t('meta.learn') });
  const completed = useProgress((s) => s.completed);
  const quizScores = useProgress((s) => s.quizScores);
  const prog = overallProgress(completed);
  const [trackId, setTrackId] = useState<TrackId>(TRACKS[0].id);
  const [level, setLevel] = useState<LevelFilter>('all');
  const [hideDone, setHideDone] = useState(false);
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const panelId = useId();
  useSlashToFocus(searchRef);

  const track = TRACKS.find((tr) => tr.id === trackId) ?? TRACKS[0];
  const groups = modulesByLevel(track.id).filter((g) => level === 'all' || g.level === level);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return null;
    return ALL_LESSONS.filter(
      (l) =>
        l.trackId === track.id &&
        (level === 'all' || findModule(l.moduleId)?.level === level) &&
        !(hideDone && completed[lessonKey(l.moduleId, l.id)]) &&
        `${l.title} ${l.summary} ${l.moduleTitle} ${(l.tags ?? []).join(' ')}`.toLowerCase().includes(s),
    );
  }, [q, track.id, level, hideDone, completed]);

  return (
    <div className="space-y-8">
      <header className="grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <div>
          <h1 className="font-display text-h1 font-bold text-ink">{t('learn.title')}</h1>
          <p className="mt-2 text-body text-ink-soft">{t('learn.progress', { done: prog.done, total: prog.total, pct: prog.pct })}</p>
        </div>
        <ResumeCard completed={completed} />
      </header>

      {TRACKS.length > 1 && (
        <Tabs label={t('learn.tracks')} panelId={panelId} value={trackId} onChange={setTrackId} tabs={TRACKS.map((tr) => ({ value: tr.id, label: tr.title }))} />
      )}

      <div className="-mx-4 border-b md:sticky md:top-header md:z-30 border-line-subtle bg-bg px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <label className="relative min-w-0 flex-[1_1_18rem]">
            <span className="sr-only">{t('learn.searchLabel')}</span>
            <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Escape') return;
                setQ('');
                e.currentTarget.blur();
              }}
              placeholder={t('learn.search')}
              aria-keyshortcuts="/"
              className="input h-10 w-full pl-9 pr-10"
            />
            <Kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 max-sm:hidden">/</Kbd>
          </label>
          <div className="max-w-full overflow-x-auto">
            <Segmented
              label={t('learn.levels')}
              value={level}
              onChange={setLevel}
              options={[{ value: 'all' as LevelFilter, label: t('learn.allLevels') }, ...track.levels.map((lv) => ({ value: lv as LevelFilter, label: LEVELS[lv].label }))]}
            />
          </div>
          <Switch checked={hideDone} onChange={setHideDone} label={t('learn.hideCompleted')} />
        </div>
      </div>

      <div id={panelId} role={TRACKS.length > 1 ? 'tabpanel' : undefined}>
        {results ? (
          <SearchResults results={results} completed={completed} quizScores={quizScores} />
        ) : (
          <div className="space-y-12">
            {groups.map(({ level: lv, modules }) => {
              const shown = hideDone ? modules.filter((mod) => moduleProgress(completed, mod.id).pct < 100) : modules;
              if (!shown.length) return null;
              return (
                <section key={lv} aria-labelledby={`level-${lv}`}>
                  <div className="mb-4 flex items-center gap-3">
                    <LevelRibbon level={lv} className="h-5 w-[3px] rounded-full" />
                    <h2 id={`level-${lv}`} className="font-display text-h3 font-semibold text-ink">
                      {LEVELS[lv].label}
                    </h2>
                    <p className="text-body-sm text-ink-soft max-sm:hidden">{LEVELS[lv].blurb}</p>
                  </div>
                  <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((mod, i) => (
                      <ModuleCard key={mod.id} module={mod} index={i} completed={completed} quizScores={quizScores} hideDone={hideDone} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ResumeCard({ completed }: { completed: Completed }) {
  const next = nextLesson(completed);
  if (!next) {
    return (
      <div className={cardClass({ padding: 'md' })}>
        <p className="font-semibold text-ink">{t('learn.allDone')}</p>
        <p className="mt-1 text-body-sm text-ink-soft">{t('learn.allDoneLead')}</p>
      </div>
    );
  }
  const mod = findModule(next.moduleId);
  const started = Object.keys(completed).length > 0;
  return (
    <Link to={next.path} className={cardClass({ interactive: 'yes', padding: 'none' }, 'group flex overflow-hidden')}>
      {mod && <ModuleCover module={mod} variant="thumb" className="w-24 shrink-0 sm:w-36" />}
      <div className="min-w-0 flex-1 p-4">
        <p className="text-caption font-semibold uppercase tracking-[0.08em] text-accent">{started ? t('learn.resumeContinue') : t('learn.resumeStart')}</p>
        <p className="mt-1 line-clamp-2 font-semibold leading-snug text-ink">{next.title}</p>
        <p className="mt-1 flex items-center gap-1.5 text-caption text-ink-muted">
          <Clock size={12} strokeWidth={1.5} aria-hidden /> {t('common.minutes', { count: next.minutes })} · {t('common.module', { number: next.moduleNumber })}
        </p>
      </div>
      <span className="flex items-center pr-4 text-accent" aria-hidden>
        <ArrowRight size={18} strokeWidth={1.5} className="transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function ModuleCard({
  module: mod,
  index,
  completed,
  quizScores,
  hideDone,
}: {
  module: ModuleMeta;
  index: number;
  completed: Completed;
  quizScores: QuizScores;
  hideDone: boolean;
}) {
  const mp = moduleProgress(completed, mod.id);
  // Open by default only for a module the reader is part-way through.
  const [open, setOpen] = useState(mp.pct > 0 && mp.pct < 100);
  const listId = useId();
  const lessons = mod.lessons.map((l, i) => ({ l, i })).filter(({ l }) => !(hideDone && completed[lessonKey(mod.id, l.id)]));
  return (
    <m.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      // First-paint stagger: 40 ms apart, capped so the ninth card on waits no longer than the eighth.
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1], delay: Math.min(index, 8) * 0.04 }}
      className={cardClass({ padding: 'none' }, 'overflow-hidden')}
    >
      <Link to={`/learn/${mod.id}`} className="group block">
        <ModuleCover module={mod} variant="card" className="aspect-[16/9]" />
        <div className="flex items-start gap-3 p-4 pb-3">
          <div className="min-w-0 flex-1">
            <LevelBadge level={mod.level} />
            <h3 className="mt-1.5 font-semibold leading-snug text-ink group-hover:text-accent">{mod.title}</h3>
            <p className="mt-1 line-clamp-2 text-body-sm text-ink-soft">{mod.description}</p>
          </div>
          <Ring value={mp.pct / 100} size={32} label={t('common.percentComplete', { pct: mp.pct })} tone={mp.pct === 100 ? 'up' : 'accent'} />
        </div>
      </Link>
      <div className="flex items-center justify-between gap-3 border-t border-line-subtle px-4 py-2">
        <span className="font-mono text-mono-sm text-ink-muted">
          {t('common.lessons', { count: mod.lessons.length })} · {t('common.minutes', { count: moduleMinutes(mod) })}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={listId}
          className="flex items-center gap-1 rounded-control px-2 py-1 text-body-sm font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
        >
          {open ? t('learn.hideLessons') : t('learn.showLessons')}
          <ChevronDown size={14} strokeWidth={1.5} className={cx('transition-transform duration-(--duration-fast)', open && 'rotate-180')} aria-hidden />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <m.ol
            id={listId}
            key="lessons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="border-t border-line-subtle p-2"
          >
            {lessons.map(({ l, i }) => {
              const key = lessonKey(mod.id, l.id);
              return (
                <li key={l.id}>
                  <LessonRow to={`/learn/${mod.id}/${l.id}`} lesson={l} index={i} done={!!completed[key]} quiz={quizScores[key]} />
                </li>
              );
            })}
          </m.ol>
        )}
      </AnimatePresence>
    </m.article>
  );
}

function SearchResults({ results, completed, quizScores }: { results: typeof ALL_LESSONS; completed: Completed; quizScores: QuizScores }) {
  return (
    <div>
      <p className="mb-3 text-body-sm text-ink-soft" role="status">
        {results.length ? t('learn.results', { count: results.length }) : t('learn.noResults')}
      </p>
      {results.length > 0 && (
        <ol className={cardClass({ padding: 'none' }, 'divide-y divide-line-subtle p-1')}>
          {results.slice(0, 60).map((l) => {
            const key = lessonKey(l.moduleId, l.id);
            return (
              <li key={l.path}>
                <p className="px-3 pt-2 text-caption text-ink-muted">
                  {t('common.module', { number: l.moduleNumber })} · {l.moduleTitle}
                </p>
                <LessonRow to={l.path} lesson={l} index={l.index} done={!!completed[key]} quiz={quizScores[key]} showSummary className="pt-1" />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
