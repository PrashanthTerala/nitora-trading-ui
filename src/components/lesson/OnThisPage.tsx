import { useEffect, useState, type RefObject } from 'react';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';

export interface TocItem {
  id: string;
  label: string;
  level: 2 | 3;
}

/** How far below the header a heading must reach to count as "being read". */
const READ_LINE = 120;

/**
 * Headings in the article (anything marked data-toc: the lesson's ## and ###, the takeaways and
 * the quiz), which one is being read, and how far through the article the reader is.
 *
 * `version` changes when the article's content does, so the list is rebuilt once the lesson's
 * MDX has loaded.
 */
export function useLessonScroll(articleRef: RefObject<HTMLElement | null>, version: unknown) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    const els = [...article.querySelectorAll<HTMLElement>('[data-toc][id]')];
    setItems(
      els.map((el) => ({
        id: el.id,
        label: el.dataset.tocLabel ?? el.textContent?.trim() ?? el.id,
        level: el.dataset.toc === '3' ? 3 : 2,
      })),
    );

    let frame = 0;
    const measure = () => {
      frame = 0;
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spacing-header')) * 16 || 60;
      let current: string | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top - header <= READ_LINE) current = el.id;
        else break;
      }
      setActive(current);
      const rect = article.getBoundingClientRect();
      const span = rect.height - (window.innerHeight - header);
      setProgress(span <= 0 ? 1 : Math.min(1, Math.max(0, (header - rect.top) / span)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [articleRef, version]);

  return { items, active, progress };
}

/**
 * The right-hand "On this page" list. Its rail doubles as the reading-progress line: the accent
 * fill grows as the article is read, and the heading being read is set in full ink.
 */
export function OnThisPage({ items, active, progress }: { items: TocItem[]; active: string | null; progress: number }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label={t('lesson.onThisPage')} className="sticky top-[calc(var(--spacing-header)+1.5rem)] max-h-[calc(100vh-var(--spacing-header)-3rem)] overflow-y-auto scroll-thin">
      <p className="mb-3 text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">{t('lesson.onThisPage')}</p>
      <div className="relative">
        <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-line" />
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-0.5 origin-top rounded-full bg-accent transition-transform duration-(--duration-fast)"
          style={{ transform: `scaleY(${progress})` }}
        />
        <ol className="space-y-0.5">
          {items.map((item) => {
            const on = item.id === active;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={on ? 'location' : undefined}
                  className={cx(
                    'relative block py-1 pr-2 text-body-sm leading-snug transition-colors duration-(--duration-fast)',
                    item.level === 3 ? 'pl-7' : 'pl-4',
                    on ? 'font-medium text-ink' : 'text-ink-muted hover:text-ink',
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-4 font-mono text-mono-sm text-ink-muted">{t('lesson.progress', { pct: Math.round(progress * 100) })}</p>
    </nav>
  );
}

/** Below the wide layout there is no rail, so progress is a 2 px line under the header. */
export function ReadingProgressBar({ progress }: { progress: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-header z-30 h-0.5 xl:hidden">
      <div className="h-full origin-left bg-accent" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
