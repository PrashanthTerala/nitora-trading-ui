import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Level } from '@/content/curriculum';
import { useTheme } from '@/lib/theme';
import { can3D, useOnScreen } from '@/lib/use3D';
import { cx } from '@/components/ui/cx';

const LiveScene = lazy(() => import('@/components/three/LiveScene'));

/**
 * A static poster that becomes a live 3D scene where that is welcome.
 *
 * The poster -- the same scene, rendered at build time -- always renders first and stays for
 * anyone without live 3D (see can3D). For everyone else, the scene's code is fetched the first
 * time the slot scrolls into view, drawn over the poster, and faded in once its first frame is
 * ready; it stops drawing whenever the slot is off screen. The poster and the live scene share
 * the slot's box and camera, so the change is a crossfade, not a jump.
 */
export function SceneSlot({ scene, level = 'accent', poster, className, desktopOnly = false }: { scene: string; level?: Level | 'accent'; poster: ReactNode; className?: string; desktopOnly?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(ref);
  const dark = useTheme((s) => s.dark);
  const [allowed, setAllowed] = useState(false);
  const [seen, setSeen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const decide = () => setAllowed(can3D() && (!desktopOnly || window.matchMedia('(min-width: 1024px)').matches));
    decide();
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', decide);
    return () => mq.removeEventListener('change', decide);
  }, [desktopOnly]);

  useEffect(() => {
    if (onScreen) setSeen(true);
  }, [onScreen]);

  // A theme change rebuilds the scene; show the poster again until it has drawn.
  useEffect(() => setReady(false), [dark]);

  return (
    <div ref={ref} className={cx('relative', className)}>
      {poster}
      {allowed && seen && (
        <div className={cx('absolute inset-0 transition-opacity duration-(--duration-deliberate) ease-standard', ready ? 'opacity-100' : 'opacity-0')} aria-hidden>
          <Suspense fallback={null}>
            <LiveScene scene={scene} level={level} active={onScreen} dark={dark} onReady={() => setReady(true)} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
