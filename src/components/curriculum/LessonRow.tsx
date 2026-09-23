import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import type { LessonMeta } from '@/content/curriculum';
import { Chip } from '@/components/ui/Chip';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';

/** One lesson in a list: completion, number, title, minutes and its best quiz score. */
export function LessonRow({
  to,
  lesson,
  index,
  done,
  quiz,
  showSummary = false,
  className,
}: {
  to: string;
  lesson: LessonMeta;
  index: number;
  done: boolean;
  quiz?: { score: number; total: number };
  showSummary?: boolean;
  className?: string;
}) {
  return (
    <Link to={to} className={cx('group flex items-start gap-3 rounded-control px-3 py-2.5 transition-colors duration-(--duration-fast) hover:bg-surface-2', className)}>
      {done ? (
        <CheckCircle2 size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-up" aria-label={t('common.completed')} />
      ) : (
        <Circle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-muted" aria-label={t('common.notStarted')} />
      )}
      <span className="w-5 shrink-0 pt-px font-mono text-mono-sm text-ink-muted tabular-nums">{index + 1}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-medium text-ink group-hover:text-accent">{lesson.title}</span>
        {showSummary && <span className="mt-0.5 block text-body-sm text-ink-soft">{lesson.summary}</span>}
      </span>
      {quiz && (
        <Chip tone={quiz.score === quiz.total ? 'up' : 'accent'} className="mt-px">
          {t('common.quizBest', { score: quiz.score, total: quiz.total })}
        </Chip>
      )}
      <span className="shrink-0 pt-px font-mono text-mono-sm text-ink-muted">{t('common.minutes', { count: lesson.minutes })}</span>
    </Link>
  );
}
