import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PMREMGenerator, type Group } from 'three';
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
export function Stage({ palette, children, live, sway = 12, target = [0, 1, 0], backdrop }: { palette: ScenePalette; children: ReactNode; live: boolean; sway?: number; target?: [number, number, number]; backdrop: 'hero' | 'cover' }) {
  const { gl, scene, camera } = useThree();
  const pivot = useRef<Group>(null);

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

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
