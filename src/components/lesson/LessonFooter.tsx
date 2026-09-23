import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, GraduationCap } from 'lucide-react';
import { findModule, type FlatLesson } from '@/content/curriculum';
import { NEXT_STEPS } from '@/content/nextSteps';
import { ModuleCover } from '@/components/curriculum/ModuleCover';
import { Button, buttonClass } from '@/components/ui/Button';
import { cardClass } from '@/components/ui/Card';
import { Kbd } from '@/components/ui/Kbd';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';

function NeighbourCard({ lesson, direction, currentModuleId, onFollow }: { lesson: FlatLesson; direction: 'prev' | 'next'; currentModuleId: string; onFollow?: () => void }) {
  const mod = findModule(lesson.moduleId);
  const next = direction === 'next';
  return (
    <Link
      to={lesson.path}
      onClick={onFollow}
      rel={next ? 'next' : 'prev'}
      className={cardClass({ interactive: 'yes', padding: 'none' }, cx('group flex items-stretch overflow-hidden', next && 'flex-row-reverse text-right'))}
    >
      {mod && <ModuleCover module={mod} variant="thumb" className="w-20 shrink-0 sm:w-24" />}
      <span className="min-w-0 flex-1 p-4">
        <span className={cx('flex items-center gap-1 text-caption text-ink-muted', next && 'justify-end')}>
          {!next && <ArrowLeft size={12} strokeWidth={1.75} aria-hidden />}
          {next ? t('lesson.next') : t('lesson.previous')}
          {next && <ArrowRight size={12} strokeWidth={1.75} aria-hidden />}
        </span>
        <span className="mt-1 block font-semibold leading-snug text-ink group-hover:text-accent">{lesson.title}</span>
        {lesson.moduleId !== currentModuleId && (
          <span className="mt-1 block text-caption text-ink-muted">{t('lesson.otherModule', { number: lesson.moduleNumber, title: lesson.moduleTitle })}</span>
        )}
      </span>
    </Link>
  );
}

/**
 * The end of a lesson: mark it complete, move on (the next card marks it complete too), and
 * one concrete thing to practise in the trainer or simulator.
 */
export function LessonFooter({
  lesson,
  prev,
  next,
  done,
  onToggleDone,
  canPresent = false,
}: {
  canPresent?: boolean;
  lesson: FlatLesson;
  prev: FlatLesson | null;
  next: FlatLesson | null;
  done: boolean;
  onToggleDone: () => void;
}) {
  const step = NEXT_STEPS[lesson.moduleId];
  return (
    <footer className="mt-14 space-y-8 border-t border-line pt-8">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button variant={done ? 'secondary' : 'primary'} size="lg" onClick={onToggleDone} aria-pressed={done}>
          {done ? <CheckCircle2 size={18} strokeWidth={1.75} className="text-up" aria-hidden /> : <Circle size={18} strokeWidth={1.75} aria-hidden />}
          {done ? t('lesson.completedUndo') : t('lesson.markComplete')}
        </Button>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-muted max-md:hidden">
          <span className="flex items-center gap-1">
            <Kbd>←</Kbd>
            <Kbd>→</Kbd> {t('lesson.keysMove')}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>M</Kbd> {t('lesson.keysComplete')}
          </span>
          {canPresent && (
            <span className="flex items-center gap-1">
              <Kbd>P</Kbd> {t('lesson.keysPresent')}
            </span>
          )}
        </p>
      </div>

      <nav aria-label={t('lesson.neighbours')} className="grid gap-3 sm:grid-cols-2">
        {prev ? <NeighbourCard lesson={prev} direction="prev" currentModuleId={lesson.moduleId} /> : <span className="max-sm:hidden" />}
        {next ? (
          <NeighbourCard lesson={next} direction="next" currentModuleId={lesson.moduleId} onFollow={() => !done && onToggleDone()} />
        ) : (
          <Link to="/simulator" className={cardClass({ interactive: 'yes', padding: 'md' }, 'flex items-center gap-3 border-accent')}>
            <GraduationCap size={22} strokeWidth={1.5} className="shrink-0 text-accent" aria-hidden />
            <span>
              <span className="block text-caption text-ink-muted">{t('lesson.finished')}</span>
              <span className="block font-semibold text-ink">{t('lesson.finishedCta')}</span>
            </span>
          </Link>
        )}
      </nav>

      {step && (
        <section aria-labelledby="whats-next" className="rounded-card border border-line bg-surface-2 p-5 sm:flex sm:items-center sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-caption font-semibold uppercase tracking-[0.08em] text-accent">{t('lesson.whatsNext')}</p>
            <h2 id="whats-next" className="mt-1 font-semibold text-ink">
              {step.title}
            </h2>
            <p className="mt-1 text-body-sm leading-relaxed text-ink-soft">{step.text}</p>
          </div>
          <Link to={step.to} className={buttonClass({ variant: 'secondary' }, 'mt-4 sm:mt-0')}>
            {t(step.to === '/trainer' ? 'nav.trainer' : step.to === '/journal' ? 'nav.journal' : 'nav.simulator')} <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
          </Link>
        </section>
      )}
    </footer>
  );
}
