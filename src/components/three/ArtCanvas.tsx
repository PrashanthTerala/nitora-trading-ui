import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import type { Level } from '@/content/curriculum';
import { readPalette } from './palette';
import { Stage } from './Stage';
import { sceneFor } from './scenes';

/**
 * One scene on a canvas. `live` scenes sway and follow the pointer and only draw while
 * `active` (on screen); still ones hold one pose, for the art renderer to capture.
 */
export function ArtCanvas({
  scene,
  level = 'accent',
  live,
  active = true,
  dark,
  onFirstFrame,
  className,
}: {
  scene: string;
  level?: Level | 'accent';
  live: boolean;
  active?: boolean;
  /** The theme, so the scene is rebuilt with the other palette when it changes. */
  dark: boolean;
  onFirstFrame?: () => void;
  className?: string;
}) {
  const def = sceneFor(scene);
  // Colours come from the tokens of the theme now applied; `dark` is a dependency so a theme
  // change reads them again.
  const palette = useMemo(() => readPalette(level), [level, dark]);
  if (!def) return null;
  return (
    <Canvas
      className={className}
      key={dark ? 'dark' : 'light'}
      dpr={live ? [1, 2] : 1}
      // A still keeps drawing until captured: the glass needs a few frames to settle.
      frameloop={live && !active ? 'never' : 'always'}
      camera={{ position: def.camera.position, fov: def.camera.fov, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: !live, powerPreference: live ? 'default' : 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = palette.dark ? 1.05 : 1.15;
        gl.outputColorSpace = SRGBColorSpace;
        // Two frames: the environment map and transmission need one to warm up.
        requestAnimationFrame(() => requestAnimationFrame(() => onFirstFrame?.()));
      }}
    >
      <Stage palette={palette} live={live} sway={def.sway} target={def.target} backdrop={scene === 'hero' ? 'hero' : 'cover'}>
        {def.render(palette)}
      </Stage>
    </Canvas>
  );
}
