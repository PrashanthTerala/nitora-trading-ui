import type { ReactNode } from 'react';
import { cx } from './cx';

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={cx('inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line-strong bg-surface-2 px-1 font-mono text-mono-sm text-ink-soft', className)}>
      {children}
    </kbd>
  );
}

/** "⌘" on Apple platforms, "Ctrl" elsewhere, for the palette shortcut hint. */
export function modKeyLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl';
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? '';
  return /mac|iphone|ipad|ipod/i.test(platform) ? '⌘' : 'Ctrl';
}
