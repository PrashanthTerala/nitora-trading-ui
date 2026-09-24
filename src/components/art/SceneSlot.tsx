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
 * time the slot is in view and the reader has done something -- moved the pointer, touched,
 * scrolled or pressed a key -- once the page has loaded and the browser is idle. It is then
 * drawn over the poster and faded in once its first frame is ready, and stops drawing whenever
 * the slot is off screen.
 *
 * Why wait for the reader: the live scene differs from the poster only in its sway and its
 * response to the pointer, and starting it costs a few hundred milliseconds of main-thread
 * work (three.js, a WebGL context, the first frames). Started unasked, that work landed while
 * the page itself was starting; now it is spent only on someone who is there to see it, and
 * a reader who never touches the page loses nothing, because the poster is the same picture. The poster and the live scene share
 * the slot's box and camera, so the change is a crossfade, not a jump.
 */
export function SceneSlot({ scene, level = 'accent', poster, className, desktopOnly = false }: { scene: string; level?: Level | 'accent'; poster: ReactNode; className?: string; desktopOnly?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(ref);
  const dark = useTheme((s) => s.dark);
  const [allowed, setAllowed] = useState(false);
  const [seen, setSeen] = useState(false);
  const [ready, setReady] = useState(false);
  const idle = useEngagedAndIdle();

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
      {allowed && seen && idle && (
        <div className={cx('absolute inset-0 transition-opacity duration-(--duration-deliberate) ease-standard', ready ? 'opacity-100' : 'opacity-0')} aria-hidden>
          <Suspense fallback={null}>
            <LiveScene scene={scene} level={level} active={onScreen} dark={dark} onReady={() => setReady(true)} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

/**
 * True once the page has loaded, the reader has interacted (pointer, touch, wheel or key), and
 * the browser has then had an idle moment. Shared by every slot on the page.
 */
let engaged: Promise<void> | null = null;
function whenEngaged() {
  engaged ??= new Promise<void>((resolve) => {
    const events = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'keydown'] as const;
    const go = () => {
      events.forEach((e) => window.removeEventListener(e, go));
      resolve();
    };
    const listen = () => events.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
    if (document.readyState === 'complete') listen();
    else window.addEventListener('load', listen, { once: true });
  });
  return engaged;
}

function useEngagedAndIdle() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let alive = true;
    let handle = 0;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void };
    void whenEngaged().then(() => {
      if (!alive) return;
      handle = w.requestIdleCallback ? w.requestIdleCallback(() => setOk(true), { timeout: 1500 }) : window.setTimeout(() => setOk(true), 200);
    });
    return () => {
      alive = false;
      if (w.cancelIdleCallback) w.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);
  return ok;
}
