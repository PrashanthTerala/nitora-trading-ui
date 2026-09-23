import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Link2, Maximize2 } from 'lucide-react';
import { Segmented } from '@/components/ui/Segmented';
import { Tooltip } from '@/components/ui/Tooltip';
import { toast } from '@/components/ui/Toast';
import { slugify, textOf } from '@/lib/slug';
import { t } from '@/i18n';
import { useDeck } from '@/components/deck/context';

const FigureLightbox = lazy(() => import('./FigureLightbox'));

export type FigureMode = 'candles' | 'line' | 'bars';

export interface FigureContext {
  /** How to draw the series; only meaningful when the frame offers the switch. */
  mode: FigureMode;
  /** True inside the lightbox, where a figure can afford more height. */
  large: boolean;
  /** True on a phone-width screen, where a figure should be drawn narrower so it stays legible. */
  narrow: boolean;
}

const NARROW = '(max-width: 639px)';

function useNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

type Render = ReactNode | ((ctx: FigureContext) => ReactNode);

const iconButton =
  'flex h-7 w-7 items-center justify-center rounded-control text-ink-soft transition-colors duration-(--duration-fast) hover:bg-surface-3 hover:text-ink';

/**
 * The frame every lesson figure sits in: a title bar with a small toolbar, the figure, and
 * its caption.
 *
 * The toolbar can switch candles / line / bars (for figures drawn from OHLC data), copy a link
 * straight to the figure, and open it full screen. The figure's id comes from its title, so a
 * copied link survives edits elsewhere in the lesson.
 */
export function FigureFrame({
  title,
  caption,
  modes = false,
  defaultMode = 'candles',
  children,
}: {
  title?: string;
  caption?: ReactNode;
  /** Offer the candles / line / bars switch. */
  modes?: boolean;
  defaultMode?: FigureMode;
  children: Render;
}) {
  const [mode, setMode] = useState<FigureMode>(defaultMode);
  const [expanded, setExpanded] = useState(false);
  const narrow = useNarrow();
  // On a slide the figure already has the screen: draw it large (narrow on a phone), and drop
  // the buttons that only make sense on the reading page.
  const { inDeck } = useDeck();
  const label = title ?? textOf(caption).slice(0, 60);
  const id = label ? `fig-${slugify(label)}` : undefined;
  const render = (large: boolean) => (typeof children === 'function' ? children({ mode, large, narrow }) : children);
  const inline = render(inDeck && !narrow);

  const copyLink = async () => {
    if (!id) return;
    const url = `${location.origin}${location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t('mdx.figure.copied') });
    } catch {
      toast({ title: t('mdx.figure.copyFailed'), description: url });
    }
  };

  const modeSwitch = modes && (
    <Segmented
      size="sm"
      label={t('mdx.figure.modeLabel')}
      value={mode}
      onChange={setMode}
      options={[
        { value: 'candles', label: t('mdx.figure.candles') },
        { value: 'line', label: t('mdx.figure.line') },
        { value: 'bars', label: t('mdx.figure.bars') },
      ]}
    />
  );

  const toolbar = (
    <div className="flex items-center gap-1">
      {modeSwitch}
      {id && !inDeck && (
        <Tooltip content={t('mdx.figure.copy')} align="end">
          <button type="button" onClick={copyLink} className={iconButton} aria-label={t('mdx.figure.copy')}>
            <Link2 size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </Tooltip>
      )}
      {!inDeck && (
        <Tooltip content={t('mdx.figure.expand')} align="end">
          <button type="button" onClick={() => setExpanded(true)} className={iconButton} aria-label={t('mdx.figure.expand')} aria-haspopup="dialog">
            <Maximize2 size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </Tooltip>
      )}
    </div>
  );

  return (
    <figure id={inDeck ? undefined : id} className="not-prose group/figure my-8 overflow-hidden rounded-card border border-line bg-surface-1 shadow-1">
      <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-subtle bg-surface-2 py-1.5 pl-4 pr-2">
        <p className="min-w-0 flex-1 py-1 text-body-sm font-semibold text-ink">{title}</p>
        {toolbar}
      </div>
      <div className="p-3">{inline}</div>
      {caption && <figcaption className="border-t border-line-subtle px-4 py-3 text-body-sm leading-relaxed text-ink-soft">{caption}</figcaption>}

      {expanded && (
        <Suspense fallback={null}>
          <FigureLightbox open onOpenChange={setExpanded} title={title ?? t('mdx.figure.untitled')} caption={caption} toolbar={modeSwitch || undefined} closeClass={iconButton}>
            {render(true)}
          </FigureLightbox>
        </Suspense>
      )}
    </figure>
  );
}
