import { Chip } from '@/components/ui/Chip';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';
import type { TickerRow } from './engineSnapshot';

function Row({ row }: { row: TickerRow }) {
  const up = row.changePct >= 0;
  return (
    <span className="flex shrink-0 items-baseline gap-2 px-5 font-mono text-mono-sm tabular-nums">
      <span className="font-semibold text-ink">{row.symbol}</span>
      <span className="text-ink-soft">{row.price.toFixed(row.decimals)}</span>
      <span className={up ? 'text-up' : 'text-down'}>
        {up ? '+' : '−'}
        {Math.abs(row.changePct).toFixed(2)}%
      </span>
    </span>
  );
}

/**
 * The eight simulator instruments at the default seed's opening clock. A slow marquee that
 * pauses on hover or focus; under reduced motion it is a static row that scrolls by hand.
 */
export function TickerStrip({ rows }: { rows: TickerRow[] | null }) {
  return (
    <section aria-label={t('home.tickerLabel')} className="border-b border-line-subtle bg-surface-1">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center">
        <Chip tone="neutral" className="ml-4 sm:ml-6">
          {t('home.tickerNote')}
        </Chip>
        <div
          tabIndex={0}
          className="marquee relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)] motion-reduce:overflow-x-auto"
        >
          {rows ? (
            <div className="marquee-track flex w-max">
              {[0, 1].map((copy) => (
                <div key={copy} className={cx('flex', copy === 1 && 'motion-reduce:hidden')} aria-hidden={copy === 1 || undefined}>
                  {rows.map((r) => (
                    <Row key={r.symbol} row={r} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-4" />
          )}
        </div>
      </div>
    </section>
  );
}
