import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CubeUVReflectionMapping, DataTexture, HalfFloatType, LinearFilter, LinearSRGBColorSpace, PMREMGenerator, RGBAFormat, type Group, type Texture } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ScenePalette } from './palette';
import { Backdrop } from './primitives';

/** The pointer over the whole window, -1..1, shared by every live scene. */
const pointer = { x: 0, y: 0 };
let tracking = false;
function trackPointer() {
  if (tracking) return;
  tracking = true;
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true },
  );
}

const DEG = Math.PI / 180;

/**
 * Lights, reflections and motion shared by every scene: one cool key light and a warm rim,
 * a procedural room for glass to reflect (no image is fetched), fog in the page colour so the
 * floor fades out, and -- when live -- a slow sway plus ±4° of pointer parallax.
 */
export function Stage({ palette, children, live, sway = 12, target = [0, 1, 0], backdrop, onWarm }: { palette: ScenePalette; children: ReactNode; live: boolean; sway?: number; target?: [number, number, number]; backdrop: 'hero' | 'cover'; onWarm?: () => void }) {
  const { gl, scene, camera } = useThree();
  const pivot = useRef<Group>(null);

  // The environment map, then every shader, before the first frame, and none of it as one long
  // task the page cannot interrupt. A live scene gets its map from a worker (see envWorker);
  // stills, and browsers without WebGL in workers, build it here in a task of its own. Then
  // compileAsync builds the programs off the main thread where the driver allows
  // (KHR_parallel_shader_compile); drawn straight away, the glass and its transmission pass
  // compiled synchronously inside the first frame. The canvas does not draw until `onWarm`.
  const warmed = useRef(onWarm);
  warmed.current = onWarm;
  useEffect(() => {
    let alive = true;
    let env: Texture | null = null;
    let pmrem: PMREMGenerator | null = null;
    const buildHere = () =>
      new Promise<Texture>((resolve) =>
        window.setTimeout(() => {
          pmrem = new PMREMGenerator(gl);
          resolve(pmrem.fromScene(new RoomEnvironment(), 0.04).texture);
        }, 0),
      );
    const source: Promise<Texture> = live ? workerEnvironment().then((t) => t ?? buildHere()) : buildHere();
    source.then((texture) => {
      if (!alive) return texture.dispose();
      env = texture;
      scene.environment = texture;
      gl.compileAsync(scene, camera)
        .catch(() => undefined)
        .then(() => alive && warmed.current?.());
    });
    return () => {
      alive = false;
      scene.environment = null;
      env?.dispose();
      pmrem?.dispose();
    };
  }, [gl, scene, camera, live]);

  useEffect(() => {
    camera.lookAt(...target);
    if (live) trackPointer();
  }, [camera, target, live]);

  useFrame(({ clock }, delta) => {
    const g = pivot.current;
    if (!g || !live) return;
    const t = clock.elapsedTime;
    const yaw = Math.sin(t * 0.12) * sway * DEG + pointer.x * 4 * DEG;
    const pitch = pointer.y * 4 * DEG;
    const k = 1 - Math.exp(-delta * 3);
    g.rotation.y += (yaw - g.rotation.y) * k;
    g.rotation.x += (pitch - g.rotation.x) * k;
  });

  return (
    <>
      {backdrop === 'hero' ? (
        // Exactly the page colour, so the poster and the live scene sit on the page seamlessly;
        // the accent glow is the scene's own sprite, which fades out before the edges.
        <Backdrop base={palette.bg} tint={palette.accent} strength={0} />
      ) : (
        <Backdrop base={palette.surface} tint={palette.level} strength={palette.dark ? 0.42 : 0.35} />
      )}
      <fog attach="fog" args={[backdrop === 'hero' ? palette.bg : palette.surface, 9, 19]} />
      <hemisphereLight args={[palette.key, palette.bg, palette.dark ? 0.35 : 0.9]} />
      <directionalLight position={[-4, 7, 6]} color={palette.key} intensity={palette.dark ? 2.2 : 2.6} />
      <directionalLight position={[6, 3, -6]} color={palette.rim} intensity={palette.dark ? 3 : 2} />
      <group ref={pivot}>{children}</group>
    </>
  );
}


type EnvPixels = { width: number; height: number; data: Uint16Array };
let envPixels: Promise<EnvPixels | null> | null = null;

/**
 * The prefiltered room as a texture, built in a worker; null where that is not possible. The
 * pixels are made once per page and shared: each live scene has its own WebGL context, so each
 * gets its own texture over the same data.
 */
async function workerEnvironment(): Promise<Texture | null> {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return null;
  envPixels ??= new Promise<EnvPixels | null>((resolve) => {
    try {
      const worker = new Worker(new URL('./envWorker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<EnvPixels | { error: string }>) => {
        worker.terminate();
        resolve('error' in e.data ? null : e.data);
      };
      worker.onerror = () => {
        worker.terminate();
        resolve(null);
      };
      worker.postMessage(null);
    } catch {
      resolve(null);
    }
  });
  const px = await envPixels;
  if (!px) return null;
  const tex = new DataTexture(px.data, px.width, px.height, RGBAFormat, HalfFloatType);
  tex.mapping = CubeUVReflectionMapping;
  tex.colorSpace = LinearSRGBColorSpace;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}
