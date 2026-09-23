import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { m } from 'motion/react';
import { Search } from 'lucide-react';
import { useProgress, overallProgress } from '@/store/progress';
import { flag } from '@/lib/flags';
import { t } from '@/i18n';
import { cx } from '@/components/ui/cx';
import { Kbd, modKeyLabel } from '@/components/ui/Kbd';
import { Ring } from '@/components/ui/Ring';
import { Tooltip } from '@/components/ui/Tooltip';
import { Toaster } from '@/components/ui/Toast';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { Footer } from './Footer';
import { MobileTabBar } from './MobileTabBar';
import { RouteProgressBar } from './RouteProgress';

// cmdk and the glossary load the first time the palette opens, or when the trigger is hovered.
const loadPalette = () => import('./CommandPalette');
const CommandPalette = lazy(loadPalette);

const NAV = [
  { to: '/learn', label: 'nav.learn' },
  { to: '/simulator', label: 'nav.simulator' },
  { to: '/trainer', label: 'nav.trainer' },
  { to: '/journal', label: 'nav.journal' },
  { to: '/glossary', label: 'nav.glossary' },
] as const;

/**
 * Pages that draw their own full-width bands (and contain their own text width) rather than
 * sitting in the standard 1200 px column.
 */
function isFullBleed(pathname: string) {
  if (pathname === '/' || pathname.startsWith('/simulator')) return true;
  const parts = pathname.split('/').filter(Boolean);
  // /learn/:moduleId and /learn/t/:trackId open with a hero band; a lesson lays out its own
  // three columns, wider than the standard one.
  return parts[0] === 'learn' && parts.length >= 2;
}

function usePaletteShortcut(onToggle: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onToggle]);
}

export function Shell() {
  const { pathname } = useLocation();
  const isSim = pathname.startsWith('/simulator');
  const fullBleed = isFullBleed(pathname);
  const completed = useProgress((s) => s.completed);
  const prog = overallProgress(completed);

  const paletteEnabled = flag('commandPalette');
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Stays true after the first open, so the palette keeps its close animation and its chunk.
  const [paletteMounted, setPaletteMounted] = useState(false);
  const openPalette = useCallback(() => {
    setPaletteMounted(true);
    setPaletteOpen(true);
  }, []);
  const togglePalette = useCallback(() => {
    setPaletteMounted(true);
    setPaletteOpen((o) => !o);
  }, []);
  usePaletteShortcut(paletteEnabled ? togglePalette : noop);

  return (
    <div className="flex min-h-screen flex-col max-md:pb-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom))]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[80] focus:rounded-control focus:bg-surface-3 focus:px-4 focus:py-2 focus:text-body-sm focus:font-semibold focus:text-ink focus:shadow-3"
      >
        {t('header.skip')}
      </a>
      <RouteProgressBar />

      <header className="sticky top-0 z-40 border-b border-line bg-surface-1/75 backdrop-blur-md">
        <div className="mx-auto flex h-header max-w-[1600px] items-center gap-2 px-4 sm:px-6">
          <Logo />

          <nav aria-label={t('nav.label')} className="ml-6 hidden items-center gap-0.5 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cx(
                    'relative rounded-control px-3 py-1.5 text-body-sm font-medium transition-colors duration-(--duration-fast)',
                    isActive ? 'text-ink' : 'text-ink-soft hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <m.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-control bg-surface-2 shadow-[inset_0_0_0_1px_var(--color-line)]"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        aria-hidden
                      />
                    )}
                    <span className="relative">{t(n.label)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            {paletteEnabled && (
              <button
                type="button"
                onClick={openPalette}
                onPointerEnter={() => void loadPalette()}
                onFocus={() => void loadPalette()}
                aria-label={t('header.searchLabel')}
                aria-haspopup="dialog"
                className="flex h-9 items-center gap-2 rounded-control text-ink-soft transition-colors duration-(--duration-fast) hover:bg-surface-2 hover:text-ink max-md:w-9 max-md:justify-center md:border md:border-line md:bg-surface-1 md:pl-3 md:pr-1.5 md:hover:border-line-strong"
              >
                <Search size={16} strokeWidth={1.5} aria-hidden />
                <span className="hidden pr-6 text-body-sm lg:inline">{t('header.search')}</span>
                <span className="hidden items-center gap-0.5 md:flex" aria-hidden>
                  <Kbd>{modKeyLabel()}</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </button>
            )}

            <Tooltip content={t('header.progress', { done: prog.done, total: prog.total })} align="end">
              <Link to="/learn" className="flex h-9 items-center gap-2 rounded-control px-2 text-ink-soft transition-colors duration-(--duration-fast) hover:bg-surface-2 hover:text-ink">
                <Ring value={prog.done / Math.max(1, prog.total)} size={22} stroke={2.5} label={t('header.progress', { done: prog.done, total: prog.total })} />
                <span className="font-mono text-mono-sm tabular-nums max-sm:hidden">
                  {prog.done}/{prog.total}
                </span>
              </Link>
            </Tooltip>

            <ThemeToggle className="max-md:hidden" />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className={cx('flex-1 outline-none', !fullBleed && 'mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 md:py-10')}>
        {/* Enter-only: a new page fades up 8 px. There is no exit phase, so navigation never
            waits on an animation; MotionConfig turns this into an instant swap under reduced motion. */}
        <m.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className={cx(isSim && 'h-full')}
        >
          <Outlet />
        </m.div>
      </main>

      {!isSim && <Footer />}
      <MobileTabBar onSearch={openPalette} />
      <Toaster />

      {paletteEnabled && paletteMounted && (
        <Suspense fallback={null}>
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </Suspense>
      )}
    </div>
  );
}

function noop() {}
