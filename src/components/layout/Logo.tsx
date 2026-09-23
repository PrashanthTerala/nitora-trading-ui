import { Link } from 'react-router-dom';
import { t } from '@/i18n';

/**
 * The mark: a candlestick wearing a graduation cap -- the one thing this site is. Drawn inline
 * with currentColor and the accent token, so it follows the theme without an image request.
 */
export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {/* mortarboard */}
      <path d="M12 2.5 22 7.2 12 11.9 2 7.2Z" fill="currentColor" />
      {/* tassel */}
      <path d="M19.2 8.6v4.2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={19.2} cy={13.9} r={1.1} fill="currentColor" />
      {/* the candle: body under the cap, wick below */}
      <rect x={8.6} y={11.2} width={6.8} height={7.6} rx={1.4} fill="var(--color-accent)" />
      <path d="M12 18.8v3.2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" aria-label={t('brand.home')} className="group flex shrink-0 items-center gap-2.5 rounded-control">
      <span className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-line bg-surface-2 text-ink transition-colors duration-(--duration-fast) group-hover:border-line-strong">
        <LogoMark />
      </span>
      <span className="text-body-sm leading-none whitespace-nowrap">
        <span className="font-display font-bold tracking-tight text-ink">{t('brand.name')}</span>{' '}
        <span className="text-ink-soft max-[359px]:hidden">{t('brand.rest')}</span>
      </span>
    </Link>
  );
}
