import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { GLOSSARY_INDEX } from '@/content/glossary';
import { t } from '@/i18n';

const OPEN_DELAY = 150;
const CLOSE_DELAY = 120;
const CARD_W = 300;

/**
 * A glossary term: `<Term id="spread">the spread</Term>`.
 *
 * Hover or keyboard focus shows a definition card; the link itself still goes to the glossary.
 * On a touch screen there is no hover, so the first tap opens the card (which has its own
 * link) instead of leaving the lesson. The definition is also the link's accessible
 * description, so a screen reader hears it without the card.
 *
 * The card is portalled and positioned in the viewport, clamped to its edges, so it is never
 * clipped by a scrolling table or pushed off a phone screen.
 */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY_INDEX[id];
  const descId = useId();
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const lastPointer = useRef<string>('mouse');

  const schedule = useCallback((next: boolean) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), next ? OPEN_DELAY : CLOSE_DELAY);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const width = Math.min(CARD_W, window.innerWidth - 24);
    const left = Math.max(12, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - 12));
    // Above the word when there is room, so the card does not cover the line being read.
    const above = r.top > 180;
    setPos({ left, top: above ? r.top - 8 : r.bottom + 8, above });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!entry) return <>{children ?? id}</>;

  return (
    <>
      <Link
        ref={triggerRef}
        to={`/glossary#${id}`}
        aria-describedby={descId}
        className="cursor-help rounded-[2px] text-inherit underline decoration-accent/70 decoration-dotted decoration-[1.5px] underline-offset-[3px] hover:decoration-accent"
        onPointerDown={(e) => (lastPointer.current = e.pointerType)}
        onPointerEnter={(e) => e.pointerType === 'mouse' && schedule(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && schedule(false)}
        onFocus={() => schedule(true)}
        onBlur={() => schedule(false)}
        onClick={(e) => {
          if (lastPointer.current === 'touch' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {children ?? entry.term}
      </Link>
      <span id={descId} hidden>
        {entry.short}
      </span>
      {open &&
        pos &&
        createPortal(
          // No tooltip role: the card holds a link (for touch readers), and its text already
          // reaches assistive technology as the trigger's description.
          <div
            className="anim-fade-in fixed z-[60] rounded-card border border-line bg-surface-3 p-4 shadow-4"
            style={{ left: pos.left, top: pos.top, width: Math.min(CARD_W, window.innerWidth - 24), transform: pos.above ? 'translateY(-100%)' : undefined }}
            onPointerEnter={() => window.clearTimeout(timer.current)}
            onPointerLeave={() => schedule(false)}
          >
            <p className="text-caption font-semibold uppercase tracking-[0.08em] text-accent">{t('mdx.glossary')}</p>
            <p className="mt-1 font-semibold text-ink">{entry.term}</p>
            <p className="mt-1.5 text-body-sm leading-relaxed text-ink-soft">{entry.short}</p>
            <Link to={`/glossary#${id}`} className="mt-3 inline-flex items-center gap-1 text-body-sm font-semibold text-accent hover:text-accent-hover" onClick={() => setOpen(false)}>
              {t('mdx.glossaryOpen')} <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
            </Link>
          </div>,
          document.body,
        )}
    </>
  );
}
