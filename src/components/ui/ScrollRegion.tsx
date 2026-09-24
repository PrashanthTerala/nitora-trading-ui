import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from './cx';

/**
 * A box that scrolls sideways on its own (a wide table on a phone), and that a keyboard can
 * reach when it does: while its content overflows it is a focusable, labelled region, so arrow
 * keys scroll it (WCAG 2.1.1). While everything fits it is a plain box, and adds no tab stop.
 */
export function ScrollRegion({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={cx('overflow-x-auto', className)} tabIndex={scrolls ? 0 : undefined} role={scrolls ? 'region' : undefined} aria-label={scrolls ? label : undefined}>
      {children}
    </div>
  );
}
