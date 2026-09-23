import { lazy, Suspense, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Brain, CandlestickChart, MoreHorizontal, NotebookPen } from 'lucide-react';
import { t } from '@/i18n';
import { cx } from '@/components/ui/cx';

// The sheet and its dialog primitive load only when "More" is first tapped.
const MoreSheet = lazy(() => import('./MoreSheet'));

const TABS = [
  { to: '/learn', label: 'nav.learn', icon: BookOpen },
  { to: '/simulator', label: 'nav.simulator', icon: CandlestickChart },
  { to: '/trainer', label: 'nav.trainer', icon: Brain },
  { to: '/journal', label: 'nav.journal', icon: NotebookPen },
] as const;

const item = 'flex flex-1 flex-col items-center justify-center gap-1 text-caption font-medium transition-colors duration-(--duration-fast)';

/**
 * The mobile navigation: a bottom tab bar within thumb reach, instead of a hamburger. Opaque
 * rather than glass -- blur is kept to the few surfaces the design allows it on.
 */
export function MobileTabBar({ onSearch }: { onSearch: () => void }) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <>
      <nav aria-label={t('nav.tabs')} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-1 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex h-tabbar">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={({ isActive }) => cx(item, isActive ? 'text-accent' : 'text-ink-soft')}>
              <tab.icon size={20} strokeWidth={1.5} aria-hidden />
              {t(tab.label)}
            </NavLink>
          ))}
          <button type="button" onClick={() => setMoreOpen(true)} className={cx(item, 'text-ink-soft')} aria-haspopup="dialog">
            <MoreHorizontal size={20} strokeWidth={1.5} aria-hidden />
            {t('nav.more')}
          </button>
        </div>
      </nav>
      {moreOpen && (
        <Suspense fallback={null}>
          <MoreSheet
            open={moreOpen}
            onOpenChange={setMoreOpen}
            onSearch={() => {
              setMoreOpen(false);
              onSearch();
            }}
          />
        </Suspense>
      )}
    </>
  );
}
