import { useEffect, useState } from 'react';
import { whenIdle } from '@/lib/useInView';
import type { EngineSnapshot } from './engineSnapshot';

// The market is deterministic, so one computation serves every visit to the home page.
let cached: EngineSnapshot | null = null;

/** The engine's view of the default market, or null until it has been computed. */
export function useEngineSnapshot(): EngineSnapshot | null {
  const [snap, setSnap] = useState<EngineSnapshot | null>(cached);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    const cancel = whenIdle(() => {
      void import('./engineSnapshot').then(({ computeSnapshot }) => {
        cached ??= computeSnapshot();
        if (alive) setSnap(cached);
      });
    });
    return () => {
      alive = false;
      cancel();
    };
  }, []);
  return snap;
}
