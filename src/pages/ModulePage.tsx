import { Link, Navigate, useParams } from 'react-router-dom';
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react';
import { findModule, modulesInTrack, moduleMinutes } from '@/content/curriculum';
import { useProgress, lessonKey, moduleProgress } from '@/store/progress';
import { ModuleCover, LevelBadge } from '@/components/curriculum/ModuleCover';
import { buttonClass } from '@/components/ui/Button';
import { cardClass } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Ring } from '@/components/ui/Ring';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';

/** The cover drifts 10 px against the scroll -- a hint of depth, and nothing under reduced motion. */
function ParallaxCover({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, reduce ? 0 : 10]);
  return (
    <m.div aria-hidden className="absolute inset-x-0 -top-3 bottom-0" style={{ y }}>
      {children}
    </m.div>
  );
}

export function ModulePage() {
  const { moduleId = '' } = useParams();
  const mod = findModule(moduleId);
  const completed = useProgress((s) => s.completed);
  const quizScores = useProgress((s) => s.quizScores);
  if (!mod) return <Navigate to="/learn" replace />;

  const mp = moduleProgress(completed, mod.id);
  const firstUndone = mod.lessons.find((l) => !completed[lessonKey(mod.id, l.id)]) ?? mod.lessons[0];
  const siblings = modulesInTrack(mod.track);
  const at = siblings.findIndex((x) => x.id === mod.id);
  const prevMod = siblings[at - 1];
  const nextMod = siblings[at + 1];
  const cta = mp.pct === 100 ? t('module.review') : mp.done ? t('module.resume') : t('module.start');

  return (
    <div>
      <section className="relative isolate overflow-hidden border-b border-line">
        <ParallaxCover>
          <ModuleCover module={mod} variant="hero" className="h-full w-full" />
        </ParallaxCover>
        {/* keeps the text legible over any cover: the page colour rises from the left and bottom */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(90deg, var(--color-bg) 25%, color-mix(in oklch, var(--color-bg) 55%, transparent) 70%, transparent), linear-gradient(0deg, var(--color-bg), transparent 45%)' }}
        />
        <div className="relative mx-auto max-w-[1200px] px-4 pb-12 pt-8 sm:px-6 md:pb-16">
          <Link to="/learn" className="inline-flex items-center gap-1.5 rounded-control text-body-sm text-ink-soft hover:text-ink">
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden /> {t('module.back')}
          </Link>
          <div className="mt-10 max-w-2xl md:mt-16">
            <div className="flex flex-wrap items-center gap-3">
              <LevelBadge level={mod.level} />
              <span className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">
                {t('common.module', { number: mod.number })} · {mod.subtitle}
              </span>
            </div>
            <h1 className="mt-3 font-display text-display font-bold text-ink">{mod.title}</h1>
            <p className="mt-4 text-body-lg text-ink-soft">{mod.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-body-sm text-ink-soft">
              <span className="flex items-center gap-1.5">
                <Clock size={14} strokeWidth={1.5} aria-hidden /> {t('common.minutes', { count: moduleMinutes(mod) })}
              </span>
              <span>{t('common.lessons', { count: mod.lessons.length })}</span>
              <span className="flex items-center gap-2">
                <Ring value={mp.pct / 100} size={24} stroke={2.5} label={t('common.percentComplete', { pct: mp.pct })} tone={mp.pct === 100 ? 'up' : 'accent'} />
                {t('common.percentComplete', { pct: mp.pct })}
              </span>
            </div>
            <Link to={`/learn/${mod.id}/${firstUndone.id}`} className={buttonClass({ size: 'lg' }, 'mt-8')}>
              {cta} <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1200px] items-start gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="lessons-title">
          <h2 id="lessons-title" className="mb-6 font-display text-h2 font-semibold text-ink">
            {t('module.lessonsTitle')}
          </h2>
          <ol className="relative">
            {mod.lessons.map((l, i) => {
              const key = lessonKey(mod.id, l.id);
              const done = !!completed[key];
              const quiz = quizScores[key];
              const current = l.id === firstUndone.id && mp.pct < 100;
              return (
                <li key={l.id} className="relative pl-12">
                  {/* the connector: from this node down to the next */}
                  {i < mod.lessons.length - 1 && (
                    <span aria-hidden className={cx('absolute left-[15px] top-[42px] -bottom-2.5 w-px', done ? 'bg-up' : 'bg-line')} />
                  )}
                  <span
                    aria-hidden
                    className={cx(
                      'absolute left-0 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border font-mono text-mono-sm font-semibold tabular-nums',
                      done ? 'border-up bg-up-soft text-up' : current ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface-1 text-ink-muted',
                    )}
                  >
                    {done ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                  </span>
                  <Link
                    to={`/learn/${mod.id}/${l.id}`}
                    className="group mb-1 flex items-start gap-3 rounded-card px-4 py-3 transition-colors duration-(--duration-fast) hover:bg-surface-1"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink group-hover:text-accent">
                        <span className="sr-only">{done ? `${t('common.completed')}: ` : ''}</span>
                        {l.title}
                      </span>
                    </span>
                    {quiz && (
                      <Chip tone={quiz.score === quiz.total ? 'up' : 'accent'} className="mt-0.5 max-sm:hidden">
                        {t('common.quizBest', { score: quiz.score, total: quiz.total })}
                      </Chip>
                    )}
                    <span className="shrink-0 pt-0.5 font-mono text-mono-sm text-ink-muted">{t('common.minutes', { count: l.minutes })}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="outcomes-title" className={cardClass({ padding: 'lg' })}>
            <h2 id="outcomes-title" className="font-display text-h3 font-semibold text-ink">
              {t('module.outcomesTitle')}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {/* One outcome per lesson: each summary says what that lesson teaches. */}
              {mod.lessons.map((l) => (
                <li key={l.id} className="flex gap-2.5 text-body-sm text-ink-soft">
                  <Check size={14} strokeWidth={2} className="mt-1 shrink-0 text-accent" aria-hidden />
                  {l.summary}
                </li>
              ))}
            </ul>
          </section>
          <nav aria-label={t('module.siblings')} className="grid grid-cols-2 gap-3">
            {prevMod ? (
              <Link to={`/learn/${prevMod.id}`} className={cardClass({ interactive: 'yes', padding: 'sm' })}>
                <span className="flex items-center gap-1 text-caption text-ink-muted">
                  <ArrowLeft size={12} strokeWidth={1.5} aria-hidden /> {t('module.previous')}
                </span>
                <span className="mt-1 line-clamp-2 block text-body-sm font-semibold text-ink">{prevMod.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {nextMod && (
              <Link to={`/learn/${nextMod.id}`} className={cardClass({ interactive: 'yes', padding: 'sm' }, 'text-right')}>
                <span className="flex items-center justify-end gap-1 text-caption text-ink-muted">
                  {t('module.next')} <ArrowRight size={12} strokeWidth={1.5} aria-hidden />
                </span>
                <span className="mt-1 line-clamp-2 block text-body-sm font-semibold text-ink">{nextMod.title}</span>
              </Link>
            )}
          </nav>
        </aside>
      </div>
    </div>
  );
}
