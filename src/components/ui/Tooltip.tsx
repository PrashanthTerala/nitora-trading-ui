import { cloneElement, isValidElement, useId, type ReactElement } from 'react';
import { cx } from './cx';

/**
 * A short text tooltip. It shows on hover AND on keyboard focus -- a `title` attribute does
 * neither reliably -- and the trigger is described by it, so screen readers hear it too.
 * For one line of text only; anything interactive belongs in a popover.
 */
export function Tooltip({
  content,
  children,
  side = 'bottom',
  align = 'center',
}: {
  content: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
  side?: 'top' | 'bottom';
  /** 'end' anchors the tip to the trigger's right edge -- for triggers near the viewport's edge. */
  align?: 'center' | 'end';
}) {
  const id = useId();
  return (
    <span className="group/tip relative inline-flex">
      {isValidElement(children) ? cloneElement(children, { 'aria-describedby': id }) : children}
      <span
        role="tooltip"
        id={id}
        className={cx(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-control border border-line bg-surface-3 px-2 py-1 text-caption font-medium text-ink opacity-0 shadow-3 transition-opacity duration-(--duration-fast) group-focus-within/tip:opacity-100 group-hover/tip:opacity-100',
          side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
          align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0',
        )}
      >
        {content}
      </span>
    </span>
  );
}
