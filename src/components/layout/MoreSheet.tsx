import { Link } from 'react-router-dom';
import { BookA, Compass, Search } from 'lucide-react';
import { Sheet, SheetClose, SheetContent } from '@/components/ui/Sheet';
import { Segmented } from '@/components/ui/Segmented';
import { useTheme } from '@/lib/theme';
import { flag } from '@/lib/flags';
import { t } from '@/i18n';

const row = 'flex items-center gap-3 rounded-control px-3 py-3 text-body text-ink hover:bg-surface-2';

/** What the mobile tab bar has no room for: the glossary, the guide, search and the theme. */
export default function MoreSheet({ open, onOpenChange, onSearch }: { open: boolean; onOpenChange: (open: boolean) => void; onSearch: () => void }) {
  const dark = useTheme((s) => s.dark);
  const setDark = useTheme((s) => s.setDark);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={t('more.title')} closeLabel={t('toast.dismiss')}>
        <nav className="space-y-1">
          {flag('commandPalette') && (
            <button type="button" onClick={onSearch} className={`${row} w-full`}>
              <Search size={18} strokeWidth={1.5} className="text-ink-soft" aria-hidden /> {t('header.search')}
            </button>
          )}
          <SheetClose asChild>
            <Link to="/glossary" className={row}>
              <BookA size={18} strokeWidth={1.5} className="text-ink-soft" aria-hidden /> {t('nav.glossary')}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link to="/guide" className={row}>
              <Compass size={18} strokeWidth={1.5} className="text-ink-soft" aria-hidden /> {t('nav.guide')}
            </Link>
          </SheetClose>
        </nav>
        <div className="mt-4 flex items-center justify-between border-t border-line-subtle pt-4">
          <span className="text-body-sm font-semibold text-ink-soft">{t('more.theme')}</span>
          <Segmented
            label={t('more.theme')}
            value={dark ? 'dark' : 'light'}
            onChange={(v) => setDark(v === 'dark')}
            options={[
              { value: 'light', label: t('more.light') },
              { value: 'dark', label: t('more.dark') },
            ]}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
