import { useEffect, useState, type RefObject } from 'react';
import { flag } from './flags';
import { prefersReducedMotion } from './useInView';

let webgl: boolean | null = null;
function hasWebGL(): boolean {
  if (webgl === null) {
    try {
      const c = document.createElement('canvas');
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

/**
 * Whether this visitor gets live 3D at all. Everything 3D is an enhancement over a static
 * poster, so the answer is no whenever the poster is the better experience: the flag is off,
 * the reader asked for less motion, there is no WebGL, the device reports under 4 GB of memory,
 * or data saving is on.
 */
export function can3D(): boolean {
  if (!flag('3d') || typeof window === 'undefined') return false;
  if (prefersReducedMotion()) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  if (nav.connection?.saveData) return false;
  return hasWebGL();
}

/**
 * Whether an element is on screen now (not just once), so a live scene can stop drawing when
 * it scrolls away and start again when it returns.
 */
export function useOnScreen<T extends Element>(ref: RefObject<T | null>, margin = '100px') {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return on;
}
