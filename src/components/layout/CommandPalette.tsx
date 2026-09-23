import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { BookA, BookOpen, CandlestickChart, Compass, FileText, Home, Moon, Palette, Search, NotebookPen, Brain } from 'lucide-react';
import { ALL_LESSONS } from '@/content/curriculum';
import { SYMBOLS } from '@/engine/market/symbols';
import type { GlossaryEntry } from '@/content/glossary';
import { useTheme } from '@/lib/theme';
import { Kbd } from '@/components/ui/Kbd';
import { t } from '@/i18n';

/**
 * Ctrl K / Cmd K: one box that reaches every lesson, glossary term, simulator symbol and page.
 *
 * Loaded on first open (it is not in the initial bundle), and the glossary's 258 entries are
 * fetched only when the palette opens -- they are too large to carry on every page for a
 * feature most visits never use.
 */
const itemClass =
  'flex cursor-pointer items-center gap-3 rounded-control px-3 py-2 text-body-sm text-ink data-[selected=true]:bg-surface-2 data-[selected=true]:shadow-[inset_2px_0_0_var(--color-accent)]';
const groupClass =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-ink-muted';

const PAGES = [
  { to: '/', label: 'palette.home', icon: Home },
  { to: '/learn', label: 'nav.learn', icon: BookOpen },
  { to: '/simulator', label: 'nav.simulator', icon: CandlestickChart },
  { to: '/trainer', label: 'nav.trainer', icon: Brain },
  { to: '/journal', label: 'nav.journal', icon: NotebookPen },
  { to: '/glossary', label: 'nav.glossary', icon: BookA },
  { to: '/guide', label: 'nav.guide', icon: Compass },
] as const;

/**
 * Word matching instead of cmdk's default fuzzy score, which let "engulf" match "Economic
 * Calendar" letter by letter. Every word typed must appear; a title that starts with the
 * query ranks first, then one that contains it whole, then matches found only in a summary.
 */
function filter(value: string, search: string, keywords?: string[]): number {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  const title = value.toLowerCase();
  const hay = `${title} ${(keywords ?? []).join(' ').toLowerCase()}`;
  if (!words.every((w) => hay.includes(w))) return 0;
  const q = words.join(' ');
  return title.startsWith(q) ? 1 : title.includes(q) ? 0.8 : words.every((w) => title.includes(w)) ? 0.6 : 0.3;
}

export default function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const toggleTheme = useTheme((s) => s.toggle);
  const [terms, setTerms] = useState<GlossaryEntry[] | null>(null);

  useEffect(() => {
    if (!open || terms) return;
    let alive = true;
    import('@/content/glossary').then((mod) => alive && setTerms(mod.GLOSSARY));
    return () => {
      alive = false;
    };
  }, [open, terms]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  const openSymbol = async (symbol: string) => {
    // Only switch the simulator's instrument when it is already on the synthetic market;
    // changing source would reset the account, which a search result must never do silently.
    const { useSim } = await import('@/store/sim');
    const sim = useSim.getState();
    if (sim.source === 'synthetic') sim.setSymbol(symbol);
    go('/simulator');
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={t('header.searchLabel')}
      filter={filter}
      overlayClassName="anim-fade-in fixed inset-0 z-50 bg-overlay backdrop-blur-sm"
      contentClassName="anim-dialog-in fixed left-1/2 top-[10vh] z-50 w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-dialog border border-line bg-surface-3/90 shadow-4 backdrop-blur-md"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search size={18} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />
        <Command.Input placeholder={t('palette.placeholder')} className="h-14 w-full bg-transparent text-body text-ink outline-none placeholder:text-ink-muted" />
        <Kbd>Esc</Kbd>
      </div>
      <Command.List className={`max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain p-2 ${groupClass}`}>
        <Command.Empty className="px-3 py-10 text-center text-body-sm text-ink-soft">{t('palette.empty')}</Command.Empty>

        <Command.Group heading={t('palette.pages')}>
          {PAGES.map((p) => (
            <Command.Item key={p.to} value={`page ${t(p.label)}`} onSelect={() => go(p.to)} className={itemClass}>
              <p.icon size={16} strokeWidth={1.5} className="text-ink-soft" aria-hidden />
              {t(p.label)}
            </Command.Item>
          ))}
          {import.meta.env.DEV && (
            <Command.Item value="page design tokens" onSelect={() => go('/__tokens')} className={itemClass}>
              <Palette size={16} strokeWidth={1.5} className="text-ink-soft" aria-hidden />
              {t('palette.tokens')}
            </Command.Item>
          )}
        </Command.Group>

        <Command.Group heading={t('palette.actions')}>
          <Command.Item
            value="toggle theme light dark"
            onSelect={() => {
              toggleTheme();
              onOpenChange(false);
            }}
            className={itemClass}
          >
            <Moon size={16} strokeWidth={1.5} className="text-ink-soft" aria-hidden />
            {t('palette.toggleTheme')}
          </Command.Item>
        </Command.Group>

        <Command.Group heading={t('palette.lessons')}>
          {ALL_LESSONS.map((l) => (
            <Command.Item key={l.path} value={`${l.title} ${l.moduleTitle} ${l.path}`} keywords={[l.summary]} onSelect={() => go(l.path)} className={itemClass}>
              <FileText size={16} strokeWidth={1.5} className="shrink-0 text-ink-soft" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{l.title}</span>
              <span className="shrink-0 font-mono text-mono-sm text-ink-muted">{t('palette.moduleShort', { number: l.moduleNumber })}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading={t('palette.symbols')}>
          {SYMBOLS.map((s) => (
            <Command.Item key={s.symbol} value={`${s.symbol} ${s.name}`} onSelect={() => void openSymbol(s.symbol)} className={itemClass}>
              <CandlestickChart size={16} strokeWidth={1.5} className="shrink-0 text-ink-soft" aria-hidden />
              <span className="font-mono text-mono font-semibold">{s.symbol}</span>
              <span className="min-w-0 flex-1 truncate text-ink-soft">{s.name}</span>
              <span className="shrink-0 text-caption text-ink-muted">{t('common.synthetic')}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading={t('palette.terms')}>
          {terms === null ? (
            <Command.Loading>
              <p className="px-3 py-2 text-body-sm text-ink-muted">{t('palette.loadingTerms')}</p>
            </Command.Loading>
          ) : (
            terms.map((g) => (
              <Command.Item key={g.id} value={`${g.term} glossary`} keywords={[g.short]} onSelect={() => go(`/glossary#${g.id}`)} className={itemClass}>
                <BookA size={16} strokeWidth={1.5} className="shrink-0 text-ink-soft" aria-hidden />
                <span className="shrink-0 font-semibold">{g.term}</span>
                <span className="min-w-0 flex-1 truncate text-ink-soft">{g.short}</span>
              </Command.Item>
            ))
          )}
        </Command.Group>
      </Command.List>
      <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-caption text-ink-muted max-sm:hidden">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> {t('palette.navigate')}
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd> {t('palette.open')}
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>Esc</Kbd> {t('palette.close')}
        </span>
      </div>
    </Command.Dialog>
  );
}
