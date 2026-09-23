import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import excerpt from 'virtual:lesson-excerpt';
import { findLesson, findModule } from '@/content/curriculum';
import { PatternFigure } from '@/components/mdx/Figures';
import { Callout } from '@/components/mdx/Callout';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';

const found = findLesson(excerpt.moduleId, excerpt.lessonId);
const mod = findModule(excerpt.moduleId);
const path = `/learn/${excerpt.moduleId}/${excerpt.lessonId}`;

const NOTES = [t('home.showcaseFigure'), t('home.showcaseEli5'), t('home.showcaseQuiz')];

function Marker({ n, className }: { n: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-mono-sm font-semibold text-on-accent shadow-2', className)}
    >
      {n}
    </span>
  );
}

function Pinned({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="relative">
      <Marker n={n} className="absolute -right-2 -top-2 z-10 sm:-right-3" />
      {children}
    </div>
  );
}

/** The lesson's first quiz question, answered: read-only, so it records no score. */
function QuizPreview() {
  const q = excerpt.question;
  return (
    <section className="not-prose rounded-card border border-line bg-surface-1 p-5">
      <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {t('home.showcaseQuizTitle')} · 1 / {excerpt.questionCount}
      </p>
      <p className="mt-2 font-semibold text-ink">{q.q}</p>
      <ul className="mt-3 space-y-2">
        {q.options.map((o, i) => {
          const right = i === q.answer;
          return (
            <li
              key={o}
              className={cx(
                'flex items-start gap-2 rounded-control border px-3 py-2 text-body-sm',
                right ? 'border-up bg-up-soft text-ink' : 'border-line text-ink-soft',
              )}
            >
              <span className={cx('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full', right ? 'bg-up text-on-up' : 'border border-line-strong')} aria-hidden>
                {right && <Check size={11} strokeWidth={3} />}
              </span>
              {o}
            </li>
          );
        })}
      </ul>
      {q.explain && <p className="mt-3 text-body-sm text-ink-soft">{q.explain}</p>}
    </section>
  );
}

/**
 * "Inside a lesson": a real excerpt of the engulfing lesson, rendered by the same components
 * the lesson uses, in a browser frame, with three numbered notes pointing at what it shows.
 */
export function LessonShowcase() {
  if (!found || !mod) return null;
  const { lesson } = found;
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-section sm:px-6">
      <div className="mb-10 max-w-2xl">
        <h2 className="font-display text-display font-bold text-ink">{t('home.showcaseTitle')}</h2>
        <p className="mt-4 text-body-lg text-ink-soft">{t('home.showcaseLead')}</p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-dialog border border-line bg-bg shadow-3">
          <div className="flex h-10 items-center gap-3 border-b border-line bg-surface-2 px-4" aria-hidden>
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            </span>
            <span className="min-w-0 flex-1 truncate rounded-full border border-line bg-surface-1 px-3 py-0.5 font-mono text-mono-sm text-ink-muted">{path}</span>
          </div>
          <div className="space-y-6 p-5 sm:p-8">
            <header>
              <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">
                {t('common.module', { number: mod.number })} · {mod.title}
              </p>
              <h3 className="mt-2 font-display text-h1 font-bold text-ink">{lesson.title}</h3>
              <p className="mt-2 text-body-lg text-ink-soft">{lesson.summary}</p>
            </header>
            <Pinned n={1}>
              <PatternFigure name={excerpt.figure.name} caption={excerpt.figure.caption} height={220} />
            </Pinned>
            <Pinned n={2}>
              <Callout type="eli5">
                <p>{excerpt.eli5}</p>
              </Callout>
            </Pinned>
            <Pinned n={3}>
              <QuizPreview />
            </Pinned>
          </div>
        </div>

        <div className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)]">
          <ol className="space-y-5">
            {NOTES.map((note, i) => (
              <li key={note} className="flex gap-3">
                <Marker n={i + 1} />
                <p className="pt-0.5 text-body text-ink">{note}</p>
              </li>
            ))}
          </ol>
          <Link to={path} className="mt-8 inline-flex items-center gap-1 text-body-sm font-semibold text-accent hover:text-accent-hover">
            {t('home.showcaseRead')} <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
