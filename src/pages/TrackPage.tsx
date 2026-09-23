import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ALL_LESSONS, LEVELS, findTrack, modulesByLevel, modulesInTrack, moduleMinutes } from '@/content/curriculum';
import { useProgress, lessonKey } from '@/store/progress';
import { ModuleTile } from '@/components/curriculum/ModuleTile';
import { LevelRibbon } from '@/components/curriculum/ModuleCover';
import { buttonClass } from '@/components/ui/Button';
import { Ring } from '@/components/ui/Ring';
import { t } from '@/i18n';
import { usePageMeta } from '@/lib/pageMeta';

/**
 * `/learn/t/:trackId`: one track's landing page. With a single track today it is reachable but
 * not linked from the nav; it exists so a second track is a content change, not a new page.
 */
export function TrackPage() {
  const { trackId = '' } = useParams();
  const track = findTrack(trackId);
  usePageMeta(track ? { title: track.title, description: track.tagline } : {});
  const completed = useProgress((s) => s.completed);
  if (!track) return <Navigate to="/learn" replace />;

  const modules = modulesInTrack(track.id);
  const lessons = ALL_LESSONS.filter((l) => l.trackId === track.id);
  const done = lessons.filter((l) => completed[lessonKey(l.moduleId, l.id)]).length;
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
  const next = lessons.find((l) => !completed[lessonKey(l.moduleId, l.id)]);
  const hours = Math.round(modules.reduce((s, m) => s + moduleMinutes(m), 0) / 60);

  return (
    <div>
      <section className="border-b border-line bg-surface-1" style={{ backgroundImage: 'radial-gradient(70% 120% at 85% 0%, var(--color-accent-soft), transparent 65%)' }}>
        <div className="mx-auto max-w-[1200px] px-4 pb-14 pt-8 sm:px-6 md:pb-20">
          <Link to="/learn" className="inline-flex items-center gap-1.5 rounded-control text-body-sm text-ink-soft hover:text-ink">
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden /> {t('module.back')}
          </Link>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-8 md:mt-14">
            <div className="max-w-2xl">
              <p className="text-caption font-semibold uppercase tracking-[0.08em] text-accent">{t('track.eyebrow')}</p>
              <h1 className="mt-2 font-display text-display font-bold text-ink">{track.title}</h1>
              <p className="mt-4 text-body-lg text-ink-soft">{track.tagline}</p>
              <p className="mt-4 font-mono text-mono-sm text-ink-muted">
                {t('common.modules', { count: modules.length })} · {t('common.lessons', { count: lessons.length })} · {t('common.hours', { count: hours })}
              </p>
              {next && (
                <Link to={next.path} className={buttonClass({ size: 'lg' }, 'mt-8')}>
                  <span className="max-w-[18rem] truncate">{done ? t('track.continue', { title: next.title }) : t('track.start')}</span>
                  <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
                </Link>
              )}
            </div>
            <Ring value={pct / 100} size={96} stroke={6} label={t('common.percentComplete', { pct })}>
              <span className="font-mono text-mono-lg font-semibold text-ink">{pct}%</span>
            </Ring>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] space-y-12 px-4 py-12 sm:px-6 md:py-16">
        <h2 className="sr-only">{t('track.modules')}</h2>
        {modulesByLevel(track.id).map(({ level, modules: group }) => (
          <section key={level} aria-labelledby={`track-level-${level}`}>
            <div className="mb-4 flex items-center gap-3">
              <LevelRibbon level={level} className="h-5 w-[3px] rounded-full" />
              <h3 id={`track-level-${level}`} className="font-display text-h3 font-semibold text-ink">
                {LEVELS[level].label}
              </h3>
              <p className="text-body-sm text-ink-soft max-sm:hidden">{LEVELS[level].blurb}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((m) => (
                <ModuleTile key={m.id} module={m} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
