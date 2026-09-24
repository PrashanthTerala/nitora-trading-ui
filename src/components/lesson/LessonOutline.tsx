import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Circle } from 'lucide-react';
import type { ModuleMeta } from '@/content/curriculum';
import { useProgress, lessonKey, moduleProgress } from '@/store/progress';
import { LevelRibbon } from '@/components/curriculum/ModuleCover';
import { ModuleGlyph } from '@/components/curriculum/ModuleGlyph';
import { Ring } from '@/components/ui/Ring';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';

/**
 * The module's lessons beside the one being read. A sticky column on wide screens; on narrow
 * ones a disclosure above the article, closed by default so the lesson comes first.
 */
export function LessonOutline({ module: mod, currentId }: { module: ModuleMeta; currentId: string }) {
  const completed = useProgress((s) => s.completed);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const mp = moduleProgress(completed, mod.id);
  const index = mod.lessons.findIndex((l) => l.id === currentId);

  return (
    <nav aria-label={t('lesson.outline')} className="lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)] lg:max-h-[calc(100vh-var(--spacing-header)-3rem)] lg:overflow-y-auto lg:overscroll-contain lg:pb-4 scroll-thin">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={listId}
        className="flex w-full items-center gap-3 rounded-card border border-line bg-surface-1 px-4 py-3 text-left lg:hidden"
      >
        <Ring value={mp.pct / 100} size={24} stroke={2.5} label={t('common.percentComplete', { pct: mp.pct })} />
        <span className="min-w-0 flex-1">
          <span className="block text-caption text-ink-muted">{t('common.module', { number: mod.number })}</span>
          <span className="block truncate text-body-sm font-semibold text-ink">{mod.title}</span>
        </span>
        <span className="font-mono text-mono-sm text-ink-muted">
          {index + 1}/{mod.lessons.length}
        </span>
        <ChevronDown size={16} strokeWidth={1.5} className={cx('text-ink-soft transition-transform duration-(--duration-fast)', open && 'rotate-180')} aria-hidden />
      </button>

      <div id={listId} className={cx(open ? 'mt-2 block rounded-card border border-line bg-surface-1 p-2' : 'hidden', 'lg:mt-0 lg:block lg:border-0 lg:bg-transparent lg:p-0')}>
        <Link to={`/learn/${mod.id}`} className="group mb-3 hidden items-start gap-3 rounded-control px-2 py-1 lg:flex">
          <LevelRibbon level={mod.level} className="mt-1 h-8 w-[3px] shrink-0 rounded-full" />
          <ModuleGlyph module={mod} className="mt-1 h-7 w-7 text-ink-soft group-hover:text-accent" />
          <span className="min-w-0 flex-1">
            <span className="block text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">{t('common.module', { number: mod.number })}</span>
            <span className="block text-body-sm font-semibold leading-snug text-ink group-hover:text-accent">{mod.title}</span>
          </span>
          <Ring value={mp.pct / 100} size={24} stroke={2.5} label={t('common.percentComplete', { pct: mp.pct })} className="mt-1" />
        </Link>
        <ol className="space-y-0.5">
          {mod.lessons.map((l, i) => {
            const active = l.id === currentId;
            const done = !!completed[lessonKey(mod.id, l.id)];
            return (
              <li key={l.id}>
                <Link
                  to={`/learn/${mod.id}/${l.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'relative flex items-start gap-2.5 rounded-control py-1.5 pl-3 pr-2 text-body-sm leading-snug transition-colors duration-(--duration-fast)',
                    active ? 'bg-accent-soft font-semibold text-ink' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  {active && <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent" />}
                  {done ? (
                    <CheckCircle2 size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-up" aria-label={t('common.completed')} />
                  ) : (
                    <Circle size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="mr-1.5 font-mono text-mono-sm text-ink-muted">{i + 1}</span>
                    {l.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
