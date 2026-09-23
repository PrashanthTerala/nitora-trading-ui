import { Link } from 'react-router-dom';
import type { ModuleMeta } from '@/content/curriculum';
import { useProgress, moduleProgress } from '@/store/progress';
import { cardClass } from '@/components/ui/Card';
import { Ring } from '@/components/ui/Ring';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';
import { ModuleCover } from './ModuleCover';

/** A compact module card: cover, number, title, lesson count and a progress ring. */
export function ModuleTile({ module: mod, className }: { module: ModuleMeta; className?: string }) {
  const completed = useProgress((s) => s.completed);
  const mp = moduleProgress(completed, mod.id);
  return (
    <Link to={`/learn/${mod.id}`} className={cardClass({ interactive: 'yes', padding: 'none' }, cx('group flex flex-col overflow-hidden', className))}>
      <ModuleCover module={mod} variant="card" className="aspect-[16/9]" />
      <div className="flex flex-1 items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">{t('common.module', { number: mod.number })}</p>
          <p className="mt-1 font-semibold leading-snug text-ink group-hover:text-accent">{mod.title}</p>
          <p className="mt-1 text-caption text-ink-soft">{t('common.lessons', { count: mod.lessons.length })}</p>
        </div>
        <Ring value={mp.pct / 100} size={30} label={t('common.percentComplete', { pct: mp.pct })} tone={mp.pct === 100 ? 'up' : 'accent'} />
      </div>
    </Link>
  );
}
