/**
 * The shared vocabulary every scene is built from: glass, candles, blocks, a staircase, a
 * shield, rings, tubes, a surface, the floor grid and a glow. Parametric, so thirteen module
 * covers and the hero read as one family.
 */
import { useMemo } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  GridHelper,
  LineBasicMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  Shape,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { ScenePalette } from './palette';

type V3 = [number, number, number];

/**
 * Tinted glass: transmissive, a little rough, clear-coated so edges catch the light. The body
 * is a paler version of the tint and the depth carries the colour (attenuation), so thin glass
 * reads light and thick glass richer -- as real tinted glass does.
 */
export function useGlass(color: Color, { opacity = 1, dark = true }: { opacity?: number; dark?: boolean } = {}) {
  return useMemo(() => {
    const body = color.clone().lerp(new Color(1, 1, 1), dark ? 0.25 : 0.45);
    return new MeshPhysicalMaterial({
      color: body,
      transmission: 0.94,
      roughness: 0.14,
      metalness: 0,
      thickness: 0.7,
      ior: 1.42,
      attenuationColor: color,
      attenuationDistance: dark ? 1.6 : 2.4,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: dark ? 1 : 1.2,
      specularIntensity: 1,
      transparent: opacity < 1,
      opacity,
    });
  }, [color, opacity, dark]);
}

/** A solid, faintly glowing material for thin lines, wicks and edges. */
export function useGlow(color: Color, intensity = 0.6) {
  return useMemo(
    () => new MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4, metalness: 0.1 }),
    [color, intensity],
  );
}

const boxCache = new Map<string, RoundedBoxGeometry>();
function roundedBox(w: number, h: number, d: number, r: number) {
  const key = [w, h, d, r].map((n) => n.toFixed(3)).join(':');
  let g = boxCache.get(key);
  if (!g) {
    g = new RoundedBoxGeometry(w, Math.max(h, 2 * r + 0.001), d, 4, r);
    boxCache.set(key, g);
  }
  return g;
}

export function GlassBlock({ size, position = [0, 0, 0], rotation = [0, 0, 0], color, radius = 0.08, dark }: { size: V3; position?: V3; rotation?: V3; color: Color; radius?: number; dark: boolean }) {
  const mat = useGlass(color, { dark });
  return <mesh geometry={roundedBox(size[0], size[1], size[2], radius)} material={mat} position={position} rotation={rotation} />;
}

/**
 * A candlestick: a glass body between open and close and a wick from low to high, in world
 * units (y is price already scaled by the scene).
 */
export function Candle({ x, z = 0, open, close, high, low, palette, width = 0.46 }: { x: number; z?: number; open: number; close: number; high: number; low: number; palette: ScenePalette; width?: number }) {
  const up = close >= open;
  const color = up ? palette.up : palette.down;
  const body = useGlass(color, { dark: palette.dark });
  const wick = useGlow(color, palette.dark ? 0.55 : 0.25);
  const top = Math.max(open, close);
  const bottom = Math.min(open, close);
  const h = Math.max(top - bottom, 0.08);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, (high + low) / 2, 0]} material={wick}>
        <cylinderGeometry args={[0.022, 0.022, high - low, 12]} />
      </mesh>
      <mesh geometry={roundedBox(width, h, width, 0.07)} material={body} position={[0, bottom + h / 2, 0]} />
    </group>
  );
}

/** Steps rising to the right, each a glass block with a glowing leading edge. */
export function Staircase({ steps = 6, color, edge, dark, stepW = 0.62, rise = 0.42, depth = 1.6 }: { steps?: number; color: Color; edge: Color; dark: boolean; stepW?: number; rise?: number; depth?: number }) {
  const mat = useGlass(color, { dark });
  const glow = useGlow(edge, 1.2);
  const x0 = (-(steps - 1) * stepW) / 2;
  return (
    <group>
      {Array.from({ length: steps }, (_, i) => {
        const h = rise * (i + 1);
        return (
          <group key={i} position={[x0 + i * stepW, h / 2, 0]}>
            <mesh geometry={roundedBox(stepW * 0.96, h, depth, 0.05)} material={mat} />
            <mesh position={[0, h / 2 + 0.012, depth / 2 - 0.02]} material={glow}>
              <boxGeometry args={[stepW * 0.9, 0.025, 0.025]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** A heater shield, extruded and bevelled. */
export function Shield({ color, dark, scale = 1 }: { color: Color; dark: boolean; scale?: number }) {
  const mat = useGlass(color, { dark });
  const geom = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, 1.25);
    s.bezierCurveTo(0.55, 1.05, 0.95, 1.1, 1.05, 1.15);
    s.bezierCurveTo(1.05, 0.2, 0.75, -0.75, 0, -1.3);
    s.bezierCurveTo(-0.75, -0.75, -1.05, 0.2, -1.05, 1.15);
    s.bezierCurveTo(-0.95, 1.1, -0.55, 1.05, 0, 1.25);
    const g = new ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 6, curveSegments: 48 });
    g.center();
    return g;
  }, []);
  return <mesh geometry={geom} material={mat} scale={scale} />;
}

export function Ring({ radius = 1, tube = 0.06, color, position = [0, 0, 0], rotation = [0, 0, 0], glow = 0.8 }: { radius?: number; tube?: number; color: Color; position?: V3; rotation?: V3; glow?: number }) {
  const mat = useGlow(color, glow);
  return (
    <mesh position={position} rotation={rotation} material={mat}>
      <torusGeometry args={[radius, tube, 24, 128]} />
    </mesh>
  );
}

/** A smooth glowing line through points. */
export function Tube({ points, color, radius = 0.05, glow = 0.9 }: { points: V3[]; color: Color; radius?: number; glow?: number }) {
  const mat = useGlow(color, glow);
  const curve = useMemo(() => new CatmullRomCurve3(points.map((p) => new Vector3(...p)), false, 'catmullrom', 0.3), [points]);
  return (
    <mesh material={mat}>
      <tubeGeometry args={[curve, 200, radius, 14, false]} />
    </mesh>
  );
}

/** A height field z = f(x, y) over a square, shaded from `low` to `high` by height. */
function heightField(fn: (x: number, y: number) => number, size: number, segments: number, low?: Color, high?: Color) {
  const g = new PlaneGeometry(size, size, segments, segments);
  const pos = g.attributes.position;
  const zs: number[] = [];
  for (let i = 0; i < pos.count; i++) zs.push(fn(pos.getX(i) / (size / 2), pos.getY(i) / (size / 2)));
  const min = Math.min(...zs);
  const max = Math.max(...zs);
  const colors = new Float32Array(pos.count * 3);
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, zs[i]);
    if (low && high) {
      c.copy(low).lerp(high, (zs[i] - min) / (max - min || 1));
      colors.set([c.r, c.g, c.b], i * 3);
    }
  }
  if (low && high) g.setAttribute('color', new BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

/**
 * A smooth surface with a sparse wireframe over it. The wire has its own coarse mesh: drawn on
 * the dense one, its lines crowd into a moiré.
 */
export function Surface({ fn, size = 4, segments = 64, low, high, dark }: { fn: (x: number, y: number) => number; size?: number; segments?: number; low: Color; high: Color; dark: boolean }) {
  const solid = useMemo(() => heightField(fn, size, segments, low, high), [fn, size, segments, low, high]);
  const wire = useMemo(() => heightField((x, y) => fn(x, y) + 0.004, size, 14), [fn, size]);
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={solid}>
        <meshPhysicalMaterial vertexColors transmission={0.55} roughness={0.25} thickness={0.4} clearcoat={1} side={DoubleSide} envMapIntensity={dark ? 0.9 : 1.2} />
      </mesh>
      <mesh geometry={wire}>
        <meshBasicMaterial color={high} wireframe transparent opacity={dark ? 0.3 : 0.35} />
      </mesh>
    </group>
  );
}

/** The floor: a fine grid that fades into the fog. */
export function GridFloor({ color, y = 0, size = 16, divisions = 32, opacity = 0.5 }: { color: Color; y?: number; size?: number; divisions?: number; opacity?: number }) {
  const grid = useMemo(() => {
    const g = new GridHelper(size, divisions, color, color);
    const m = g.material as LineBasicMaterial;
    m.transparent = true;
    m.opacity = opacity;
    m.depthWrite = false;
    return g;
  }, [size, divisions, color, opacity]);
  return <primitive object={grid} position={[0, y, 0]} />;
}

let glowTexture: CanvasTexture | null = null;
function radialTexture() {
  if (glowTexture) return glowTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  glowTexture = new CanvasTexture(c);
  glowTexture.colorSpace = SRGBColorSpace;
  return glowTexture;
}

/** Fake bloom: an additive, softly fading sprite. No post-processing pass needed. */
export function Glow({ color, position = [0, 1, -2], size = 6, opacity = 0.35 }: { color: Color; position?: V3; size?: number; opacity?: number }) {
  return (
    <sprite position={position} scale={[size, size, 1]}>
      <spriteMaterial map={radialTexture()} color={color} transparent opacity={opacity} blending={AdditiveBlending} depthWrite={false} />
    </sprite>
  );
}

/**
 * The backdrop: a large unlit plane behind the scene with a soft glow in one corner. It is in
 * the scene, not added afterwards, because glass can only refract what is actually behind it.
 */
export function Backdrop({ base, tint, strength = 0.45, at = [0.78, 0.22] }: { base: Color; tint: Color; strength?: number; at?: [number, number] }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d')!;
    g.fillStyle = `#${base.getHexString()}`;
    g.fillRect(0, 0, 512, 512);
    const grad = g.createRadialGradient(512 * at[0], 512 * at[1], 0, 512 * at[0], 512 * at[1], 420);
    const hex = tint.getHexString();
    grad.addColorStop(0, `#${hex}${Math.round(strength * 255).toString(16).padStart(2, '0')}`);
    grad.addColorStop(1, `#${hex}00`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 512);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, [base, tint, strength, at]);
  return (
    <mesh position={[0, 4, -8]}>
      <planeGeometry args={[48, 30]} />
      <meshBasicMaterial map={texture} fog={false} toneMapped={false} />
    </mesh>
  );
}
