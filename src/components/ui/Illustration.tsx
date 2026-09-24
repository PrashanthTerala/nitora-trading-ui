import { useTheme } from '@/lib/theme';
import { cx } from './cx';

/**
 * A rendered illustration from the 3D scene family (public/art/illustrations, made by
 * tools/render-art.mjs), in the current theme. Drawn on the page background, so it sits on
 * the page without a frame; the soft radial mask hides the edge of the render. Decorative:
 * the text beside it always says what it shows.
 */
export function Illustration({ id, className, eager = false }: { id: 'broken-candle' | 'empty-journal'; className?: string; eager?: boolean }) {
  const dark = useTheme((s) => s.dark);
  const base = `/art/illustrations/${id}-${dark ? 'dark' : 'light'}`;
  return (
    <img
      src={`${base}.webp`}
      srcSet={`${base}-480.webp 480w, ${base}.webp 960w`}
      sizes="(min-width: 640px) 440px, 80vw"
      width={960}
      height={720}
      alt=""
      aria-hidden
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={cx('h-auto w-full [mask-image:radial-gradient(closest-side,black_62%,transparent)]', className)}
    />
  );
}
