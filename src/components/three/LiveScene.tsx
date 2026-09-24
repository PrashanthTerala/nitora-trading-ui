/**
 * The live 3D layer, as one lazily loaded chunk (three.js and React Three Fiber come with it).
 * Only ever imported by SceneSlot, and only once the gate there has said yes.
 */
import type { Level } from '@/content/curriculum';
import { ArtCanvas } from './ArtCanvas';

export default function LiveScene({ scene, level, active, dark, onReady }: { scene: string; level: Level | 'accent'; active: boolean; dark: boolean; onReady: () => void }) {
  return <ArtCanvas scene={scene} level={level} live active={active} dark={dark} onFirstFrame={onReady} className="!absolute inset-0" />;
}
