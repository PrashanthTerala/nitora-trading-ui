/**
 * The live 3D layer, as one lazily loaded chunk (three.js and React Three Fiber come with it).
 * Only ever imported by SceneSlot, and only once the gate there has said yes.
 *
 * The canvas is created one task after the chunk has run, so evaluating three.js and creating
 * the WebGL context are two short tasks rather than one long one.
 */
import { useEffect, useState } from 'react';
import type { Level } from '@/content/curriculum';
import { ArtCanvas } from './ArtCanvas';

export default function LiveScene({ scene, level, active, dark, onReady }: { scene: string; level: Level | 'accent'; active: boolean; dark: boolean; onReady: () => void }) {
  const [mount, setMount] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setMount(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  if (!mount) return null;
  return <ArtCanvas scene={scene} level={level} live active={active} dark={dark} onFirstFrame={onReady} className="!absolute inset-0" />;
}
