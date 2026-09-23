import { useEffect, useState } from 'react';
import { prefersReducedMotion, useInView } from '@/lib/useInView';

/**
 * A number that counts up from zero the first time it scrolls into view. Under reduced motion
 * it simply shows the value. The final value is always what assistive technology reads.
 */
export function CountUp({ value, duration = 900, suffix = '', className }: { value: number; duration?: number; suffix?: string; className?: string }) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out cubic: quick start, soft landing
      setShown(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden>
        {shown}
        {suffix}
      </span>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
    </span>
  );
}
