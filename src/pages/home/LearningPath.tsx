import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LEVELS, TRACKS, modulesByLevel, type Level } from '@/content/curriculum';
import { ModuleTile } from '@/components/curriculum/ModuleTile';
import { t } from '@/i18n';

/**
 * The curriculum as a path: a vertical timeline with a node per level on desktop, module cards
 * to its right; on phones each level becomes a row that snap-scrolls sideways.
 */
export function LearningPath() {
  const track = TRACKS[0];
  const groups = modulesByLevel(track.id);
  return (
    <section className="border-y border-line-subtle bg-surface-1">
      <div className="mx-auto max-w-[1200px] px-4 py-section sm:px-6">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-display font-bold text-ink">{t('home.pathTitle')}</h2>
            <p className="mt-4 text-body-lg text-ink-soft">{t('home.pathLead')}</p>
          </div>
          <Link to="/learn" className="flex items-center gap-1 text-body-sm font-semibold text-accent hover:text-accent-hover">
            {t('home.pathAll')} <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
          </Link>
        </div>

        <ol className="relative">
          {/* the path itself: a hairline of accent that fades out at both ends */}
          <span
            aria-hidden
            className="absolute bottom-6 left-[7px] top-2 w-px max-md:hidden"
            style={{ background: 'linear-gradient(transparent, var(--color-accent) 8%, var(--color-accent) 92%, transparent)' }}
          />
          {groups.map(({ level, modules }) => (
            <li key={level} className="relative pb-12 last:pb-0 md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-10 md:pl-10">
              <LevelNode level={level} />
              <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 max-md:scroll-px-4 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
                {modules.map((m) => (
                  <ModuleTile key={m.id} module={m} className="snap-start max-md:w-[78%] max-md:max-w-72 max-md:shrink-0" />
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function LevelNode({ level }: { level: Level }) {
  return (
    <div className="relative mb-4 md:mb-0 md:pt-1">
      <span
        aria-hidden
        className="absolute -left-10 top-1.5 hidden h-[15px] w-[15px] rounded-full border-2 border-accent bg-bg md:block"
        style={{ boxShadow: '0 0 0 4px var(--color-accent-soft), 0 0 16px var(--color-accent-soft)' }}
      />
      <h3 className="flex items-center gap-2 font-display text-h3 font-semibold text-ink">
        <span className="h-2 w-2 rounded-full md:hidden" style={{ background: `var(--color-level-${level})` }} aria-hidden />
        {LEVELS[level].label}
      </h3>
      <p className="mt-1 text-body-sm text-ink-soft">{LEVELS[level].blurb}</p>
    </div>
  );
}
