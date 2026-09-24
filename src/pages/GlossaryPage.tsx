import { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as D from '@radix-ui/react-dialog';
import { Search, X, BookOpen, ArrowRight } from 'lucide-react';
import { GLOSSARY, type GlossaryEntry } from '@/content/glossary';
import { ALL_LESSONS } from '@/content/curriculum';
import { chipClass } from '@/components/ui/Chip';
import { cx } from '@/components/ui/cx';
import contentIndex from 'virtual:content-index';
import { usePageMeta } from '@/lib/pageMeta';
import { t } from '@/i18n';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const BY_ID = new Map(GLOSSARY.map((g) => [g.id, g]));
const LESSON_BY_PATH = new Map(ALL_LESSONS.map((l) => [l.path, l]));

/** Every lesson a term appears in, with the entry's own "best lesson" first. */
function lessonsFor(g: GlossaryEntry) {
  const paths = [...new Set([...(g.lesson ? [g.lesson] : []), ...(contentIndex.terms[g.id] ?? [])])];
  return paths.map((p) => LESSON_BY_PATH.get(p)).filter((l): l is NonNullable<typeof l> => !!l);
}

/**
 * The glossary: a card per term, grouped by letter, with an A–Z rail that stays in view. A term
 * opens in a side panel with everything known about it; the panel is driven by the URL hash,
 * so /glossary#spread (what every <Term> in a lesson links to) opens straight to it.
 */
export function GlossaryPage() {
  usePageMeta({ title: t('nav.glossary'), description: t('meta.glossary') });
  const [q, setQ] = useState('');
  const loc = useLocation();
  const navigate = useNavigate();
  const sorted = useMemo(() => [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term)), []);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sorted;
    return sorted.filter((g) => `${g.term} ${g.short} ${g.long ?? ''}`.toLowerCase().includes(s));
  }, [q, sorted]);

  const groups = useMemo(() => {
    const out = new Map<string, GlossaryEntry[]>();
    for (const g of filtered) {
      const letter = g.term[0].toUpperCase();
      out.set(letter, [...(out.get(letter) ?? []), g]);
    }
    return out;
  }, [filtered]);

  const openId = decodeURIComponent(loc.hash.slice(1));
  const open = BY_ID.get(openId) ?? null;
  const show = (id: string | null) => navigate({ hash: id ? `#${id}` : '' }, { replace: !!open });

  const jump = (letter: string) => document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="mx-auto max-w-6xl">
      <header className="max-w-3xl">
        <h1 className="font-display text-h1 font-semibold tracking-tight">{t('glossary.title')}</h1>
        <p className="mt-2 text-body-lg text-ink-soft">{t('glossary.lead', { count: GLOSSARY.length })}</p>
        <label className="relative mt-6 block">
          <span className="sr-only">{t('glossary.search')}</span>
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('glossary.searchPlaceholder')}
            className="h-12 w-full rounded-control border border-line-strong bg-surface-1 pl-11 pr-4 text-body text-ink shadow-1 outline-none transition-colors duration-(--duration-fast) placeholder:text-ink-muted focus:border-accent"
          />
        </label>
        <p className="mt-2 text-caption text-ink-soft" aria-live="polite">
          {q ? t('glossary.results', { count: filtered.length }) : ' '}
        </p>
      </header>

      <div className="mt-4 lg:grid lg:grid-cols-[2.5rem_minmax(0,1fr)] lg:gap-8">
        {/* A–Z: a column that stays in view on large screens, a strip under the header on small ones */}
        <nav aria-label={t('glossary.letters')} className="sticky top-header z-20 -mx-4 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur-sm lg:top-[calc(var(--spacing-header)+1.5rem)] lg:mx-0 lg:self-start lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <ol className="flex gap-0.5 overflow-x-auto lg:flex-col lg:overflow-visible">
            {ALPHABET.map((L) => {
              const has = groups.has(L);
              return (
                <li key={L}>
                  <button
                    type="button"
                    disabled={!has}
                    onClick={() => jump(L)}
                    className="flex h-7 w-7 items-center justify-center rounded-control font-mono text-mono-sm font-semibold text-ink-soft transition-colors duration-(--duration-fast) hover:bg-accent-soft hover:text-accent disabled:text-ink-muted disabled:opacity-40 disabled:hover:bg-transparent lg:h-6 lg:w-8"
                  >
                    {L}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-w-0 space-y-10 pt-6 lg:pt-0">
          {filtered.length === 0 && <p className="py-16 text-center text-body text-ink-soft">{t('glossary.none', { q })}</p>}
          {[...groups.entries()].map(([L, items]) => (
            <section key={L} id={`letter-${L}`} aria-labelledby={`letter-${L}-h`} className="scroll-mt-[calc(var(--spacing-header)+4rem)] lg:scroll-mt-[calc(var(--spacing-header)+1.5rem)]">
              <h2 id={`letter-${L}-h`} className="mb-3 flex items-center gap-3 font-display text-h3 font-semibold text-ink">
                {L}
                <span aria-hidden className="h-px flex-1 bg-line" />
              </h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((g) => (
                  <li key={g.id}>
                    <TermCard entry={g} active={open?.id === g.id} onOpen={() => show(g.id)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <TermPanel entry={open} onClose={() => show(null)} onOpen={(id) => show(id)} />
    </div>
  );
}

function TermCard({ entry: g, active, onOpen }: { entry: GlossaryEntry; active: boolean; onOpen: () => void }) {
  const lessons = lessonsFor(g);
  return (
    <article
      className={cx(
        'group relative flex h-full flex-col rounded-card border bg-surface-1 p-4 shadow-1 transition-[border-color,box-shadow,transform] duration-(--duration-fast) hover:-translate-y-0.5 hover:border-accent hover:shadow-2',
        active ? 'border-accent' : 'border-line',
      )}
    >
      <h3 className="font-display text-body-lg font-semibold">
        {/* The whole card opens the panel; the lesson links sit above this stretched button. */}
        <button type="button" onClick={onOpen} aria-haspopup="dialog" className="text-left after:absolute after:inset-0 after:rounded-card after:content-['']">
          {g.term}
        </button>
      </h3>
      <p className="mt-1.5 line-clamp-3 flex-1 text-body-sm text-ink-soft">{g.short}</p>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption">
        {lessons.length ? (
          <>
            <span className="text-ink-muted">{t('glossary.usedIn', { count: lessons.length })}</span>
            {lessons.slice(0, 2).map((l) => (
              <Link key={l.path} to={l.path} className="relative z-10 max-w-full truncate font-semibold text-accent hover:underline">
                {l.title}
              </Link>
            ))}
          </>
        ) : (
          <span className="text-ink-muted">{t('glossary.notUsed')}</span>
        )}
      </p>
    </article>
  );
}

/** A panel from the right edge with the whole entry, its lessons and its related terms. */
function TermPanel({ entry, onClose, onOpen }: { entry: GlossaryEntry | null; onClose: () => void; onOpen: (id: string) => void }) {
  // Keep the last entry while the panel animates closed.
  const last = useRef<GlossaryEntry | null>(null);
  if (entry) last.current = entry;
  const g = entry ?? last.current;
  const lessons = g ? lessonsFor(g) : [];
  const best = g?.lesson ? LESSON_BY_PATH.get(g.lesson) : undefined;
  return (
    <D.Root open={!!entry} onOpenChange={(o) => !o && onClose()}>
      <D.Portal>
        <D.Overlay className="anim-fade-in fixed inset-0 z-50 bg-overlay backdrop-blur-sm" />
        <D.Content
          aria-describedby={undefined}
          className="anim-panel-in fixed inset-y-0 right-0 z-50 flex w-[min(30rem,100vw)] flex-col border-l border-line bg-surface-3 shadow-4 outline-none"
        >
          {g && (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-line-subtle px-6 pb-4 pt-6">
                <div>
                  <p className="text-caption font-semibold uppercase tracking-[0.08em] text-accent">{t('glossary.title')}</p>
                  <D.Title className="mt-1 font-display text-h2 font-semibold">{g.term}</D.Title>
                </div>
                <D.Close className="rounded-control p-2 text-ink-soft hover:bg-surface-2 hover:text-ink" aria-label={t('glossary.close')}>
                  <X size={18} aria-hidden />
                </D.Close>
              </div>
              <div className="scroll-thin flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <p className="text-body-lg text-ink">{g.short}</p>
                {g.long && <p className="text-body leading-relaxed text-ink-soft">{g.long}</p>}
                {best && (
                  <div>
                    <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-soft">{t('glossary.bestLesson')}</h3>
                    <Link to={best.path} className="group flex items-center gap-3 rounded-card border border-line bg-surface-1 p-3 hover:border-accent">
                      <BookOpen size={18} className="shrink-0 text-accent" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{best.title}</span>
                        <span className="block truncate text-caption text-ink-soft">{best.moduleTitle}</span>
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-ink-soft transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </div>
                )}
                {lessons.length > (best ? 1 : 0) && (
                  <div>
                    <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-soft">{t('glossary.lessons')}</h3>
                    <ul className="space-y-1">
                      {lessons.map((l) => (
                        <li key={l.path}>
                          <Link to={l.path} className="flex items-baseline gap-2 rounded-control px-2 py-1.5 text-body-sm hover:bg-surface-2">
                            <span className="font-mono text-mono-sm text-ink-muted">{String(l.moduleNumber).padStart(2, '0')}</span>
                            <span className="text-ink">{l.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {g.related && g.related.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-soft">{t('glossary.related')}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {g.related.map((r) => {
                        const rel = BY_ID.get(r);
                        return rel ? (
                          <button key={r} type="button" onClick={() => onOpen(r)} className={cx(chipClass({ size: 'md' }), 'hover:border-accent hover:text-accent')}>
                            {rel.term}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
