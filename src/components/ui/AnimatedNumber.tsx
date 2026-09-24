import { useEffect, useRef, useState } from 'react';
import { m, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { cx } from './cx';

/**
 * A number that moves when it changes: it springs to the new value and flashes the direction
 * tint (up or down) for 600 ms. Under reduced motion it simply changes. Mono and tabular, so
 * the width never jitters.
 */
export function AnimatedNumber({ value, format, className, flash = true }: { value: number; format: (v: number) => string; className?: string; flash?: boolean }) {
  const reduce = useReducedMotion();
  const spring = useSpring(value, { stiffness: 260, damping: 32, mass: 0.6 });
  const text = useTransform(spring, (v) => format(v));
  const prev = useRef(value);
  const [dir, setDir] = useState<'up' | 'down' | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    spring.set(value);
    if (value !== prev.current && flash) {
      setDir(value > prev.current ? 'up' : 'down');
      setPulse((n) => n + 1);
    }
    prev.current = value;
  }, [value, spring, flash]);

  return (
    <span className={cx('relative inline-block font-mono tabular-nums', className)}>
      {dir && <span key={pulse} aria-hidden className={cx('num-flash absolute -inset-x-1 -inset-y-0.5 rounded-[4px]', dir === 'up' ? 'bg-up-soft' : 'bg-down-soft')} />}
      <span className="relative">{reduce ? format(value) : <m.span>{text}</m.span>}</span>
    </span>
  );
}
