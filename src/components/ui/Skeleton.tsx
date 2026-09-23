import { cx } from './cx';

/**
 * A placeholder block in the shape of what is loading. Pulses only when the reader has not
 * asked for reduced motion.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('rounded-panel bg-surface-2 motion-safe:animate-pulse', className)} />;
}

/** A few lines of text-shaped placeholder, the last one short, as real paragraphs end. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden className={cx('space-y-2.5', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cx('h-3.5', i === lines - 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </div>
  );
}
