/**
 * The hero, the thirteen module scenes and two illustrations. Each is a small arrangement of the shared
 * primitives, tinted with the module's level colour, so the covers read as one family.
 */
import type { ReactNode } from 'react';
import type { ScenePalette } from './palette';
import { Candle, GlassBlock, Glow, GridFloor, Ring, Shield, Staircase, Surface, Tube, useGlass, useGlow } from './primitives';

type V3 = [number, number, number];

export interface SceneDef {
  camera: { position: V3; fov: number };
  target: V3;
  /** Degrees of slow sway when live. */
  sway?: number;
  render: (p: ScenePalette) => ReactNode;
}

/** Candles in open/high/low/close price units, mapped into the scene by `scale`. */
type Bar = [number, number, number, number];

function CandleRow({ bars, palette, spacing = 0.78, base = 38, unit = 0.062, arc = 0.06 }: { bars: Bar[]; palette: ScenePalette; spacing?: number; base?: number; unit?: number; arc?: number }) {
  const y = (v: number) => (v - base) * unit;
  const x0 = (-(bars.length - 1) * spacing) / 2;
  return (
    <>
      {bars.map(([o, h, l, c], i) => {
        const x = x0 + i * spacing;
        return <Candle key={i} x={x} z={-arc * x * x} open={y(o)} high={y(h)} low={y(l)} close={y(c)} palette={palette} />;
      })}
    </>
  );
}

/** Rising, then turning down: the hero's shape (and the old poster's). */
const HERO_BARS: Bar[] = [
  [42, 50, 38, 48],
  [48, 60, 45, 57],
  [57, 62, 51, 54],
  [54, 71, 53, 69],
  [69, 82, 66, 79],
  [79, 88, 74, 76],
  [76, 78, 61, 63],
  [63, 67, 52, 56],
];

function Floor({ p, y = 0 }: { p: ScenePalette; y?: number }) {
  return <GridFloor color={p.line} y={y} opacity={p.dark ? 0.45 : 0.55} />;
}

const cover = (position: V3 = [0, 3.2, 8.6], target: V3 = [0, 1.15, 0]) => ({ camera: { position, fov: 34 }, target });

// ---------------------------------------------------------------- scene parts that need hooks

function StandScene({ p }: { p: ScenePalette }) {
  const coin = useGlow(p.accent, 0.35);
  return (
    <>
      <Floor p={p} />
      <GlassBlock size={[3.2, 1.3, 1.4]} position={[0, 0.65, 0]} color={p.level} dark={p.dark} />
      {[-1.45, 1.45].map((x) => (
        <GlassBlock key={x} size={[0.12, 1.5, 0.12]} position={[x, 2.05, -0.5]} color={p.level} dark={p.dark} radius={0.04} />
      ))}
      <GlassBlock size={[3.6, 0.14, 1.7]} position={[0, 2.85, -0.2]} rotation={[0.18, 0, 0]} color={p.accent} dark={p.dark} radius={0.05} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.8, 1.36 + i * 0.09, 0.2]} material={coin}>
          <cylinderGeometry args={[0.28, 0.28, 0.07, 48]} />
        </mesh>
      ))}
      <mesh position={[-0.7, 1.36, 0.25]} material={coin}>
        <cylinderGeometry args={[0.28, 0.28, 0.07, 48]} />
      </mesh>
      <Glow color={p.level} position={[0, 1.6, -2.4]} size={6.5} opacity={p.dark ? 0.3 : 0.18} />
    </>
  );
}

function ChartPanelScene({ p }: { p: ScenePalette }) {
  const pts: V3[] = [-1.9, -1.4, -0.9, -0.4, 0.1, 0.6, 1.1, 1.6, 2.0].map((x, i) => [x, 1.0 + [0, 0.35, 0.15, 0.7, 0.55, 1.1, 0.9, 1.5, 1.35][i], 0.18]);
  return (
    <>
      <Floor p={p} />
      <GlassBlock size={[4.6, 2.9, 0.18]} position={[0, 1.65, 0]} color={p.level} dark={p.dark} radius={0.07} />
      <Tube points={pts} color={p.accent} radius={0.055} />
      {[0.7, 1.3, 1.9, 2.5].map((y) => (
        <mesh key={y} position={[0, y, 0.11]}>
          <boxGeometry args={[4.2, 0.008, 0.008]} />
          <meshBasicMaterial color={p.line} transparent opacity={0.6} />
        </mesh>
      ))}
      <Glow color={p.accent} position={[0.6, 2, -1.8]} size={5.5} opacity={p.dark ? 0.3 : 0.16} />
    </>
  );
}

function StackScene({ p }: { p: ScenePalette }) {
  const bars: Bar[] = [
    [60, 64, 45, 48],
    [48, 51, 40, 44],
    [44, 58, 42, 56],
    [56, 70, 55, 68],
    [68, 72, 58, 60],
  ];
  return (
    <>
      <Floor p={p} />
      <CandleRow bars={bars} palette={p} spacing={0.95} base={36} unit={0.085} arc={0.12} />
      <Glow color={p.level} position={[0, 1.6, -2.4]} size={6.5} opacity={p.dark ? 0.32 : 0.18} />
    </>
  );
}

function StairsScene({ p }: { p: ScenePalette }) {
  return (
    <>
      <Floor p={p} />
      <group rotation={[0, -0.35, 0]}>
        <Staircase steps={6} color={p.level} edge={p.accent} dark={p.dark} />
      </group>
      <Glow color={p.accent} position={[1.2, 2.4, -2]} size={6} opacity={p.dark ? 0.32 : 0.18} />
    </>
  );
}

function HeadShouldersScene({ p }: { p: ScenePalette }) {
  const path: V3[] = [
    [-2.4, 0.5, 0], [-1.7, 1.5, 0], [-1.2, 0.9, 0], [-0.5, 2.5, 0], [0.2, 0.9, 0], [0.9, 1.5, 0], [1.5, 0.8, 0], [2.3, 0.2, 0],
  ];
  const neck = useGlow(p.accent, 1);
  return (
    <>
      <Floor p={p} />
      <GlassBlock size={[5, 0.12, 1.2]} position={[0, 0.02, 0]} color={p.level} dark={p.dark} radius={0.05} />
      <Tube points={path} color={p.level} radius={0.09} glow={0.5} />
      <mesh position={[-0.15, 0.9, 0.02]} rotation={[0, 0, 0]} material={neck}>
        <boxGeometry args={[3.6, 0.03, 0.03]} />
      </mesh>
      {path.slice(1, 7).map((pt, i) => (
        <GlassBlock key={i} size={[0.26, 0.26, 0.26]} position={pt} color={p.level} dark={p.dark} radius={0.12} />
      ))}
      <Glow color={p.level} position={[-0.4, 2, -2]} size={6} opacity={p.dark ? 0.3 : 0.16} />
    </>
  );
}

function OscillatorScene({ p }: { p: ScenePalette }) {
  const wave: V3[] = Array.from({ length: 24 }, (_, i) => {
    const x = -2.5 + (i / 23) * 5;
    return [x, 1.45 + Math.sin(x * 1.9) * 0.85 * Math.exp(-0.05 * x * x), 0];
  });
  return (
    <>
      <Floor p={p} />
      <GlassBlock size={[5.4, 0.1, 0.5]} position={[0, 2.35, -0.1]} color={p.down} dark={p.dark} radius={0.04} />
      <GlassBlock size={[5.4, 0.1, 0.5]} position={[0, 0.55, -0.1]} color={p.up} dark={p.dark} radius={0.04} />
      <Tube points={wave} color={p.accent} radius={0.06} />
      <Glow color={p.accent} position={[0, 1.5, -2]} size={6} opacity={p.dark ? 0.3 : 0.16} />
    </>
  );
}

function OrderBookScene({ p }: { p: ScenePalette }) {
  // Bids (left) and asks (right) stacked by price, a gap between them: the spread.
  const sizes = [0.7, 1.05, 1.5, 1.2, 1.9];
  const asks = [1.5, 1.2, 1.9, 0.7, 1.05];
  return (
    <>
      <Floor p={p} />
      {sizes.map((w, i) => (
        <GlassBlock key={`b${i}`} size={[w, 0.26, 1]} position={[-0.25 - w / 2, 0.2 + i * 0.36, 0]} color={p.up} dark={p.dark} radius={0.05} />
      ))}
      {asks.map((w, i) => (
        <GlassBlock key={`a${i}`} size={[w, 0.26, 1]} position={[0.25 + w / 2, 0.2 + i * 0.36, 0]} color={p.down} dark={p.dark} radius={0.05} />
      ))}
      <GlassBlock size={[0.08, 2.1, 0.08]} position={[0, 1.0, 0.55]} color={p.accent} dark={p.dark} radius={0.03} />
      <Glow color={p.level} position={[0, 1.4, -2]} size={6} opacity={p.dark ? 0.3 : 0.16} />
    </>
  );
}

function ShieldScene({ p }: { p: ScenePalette }) {
  return (
    <>
      <Floor p={p} />
      <group position={[0, 1.55, 0]} rotation={[0, -0.25, 0]}>
        <Shield color={p.level} dark={p.dark} scale={1.05} />
        <Ring radius={0.45} tube={0.05} color={p.accent} position={[0, 0.15, 0.3]} glow={1} />
      </group>
      <Glow color={p.accent} position={[0, 1.7, -1.8]} size={6} opacity={p.dark ? 0.32 : 0.18} />
    </>
  );
}

function BrainScene({ p }: { p: ScenePalette }) {
  const inner = useGlass(p.level, { dark: p.dark });
  return (
    <>
      <Floor p={p} />
      <group position={[0, 1.55, 0]}>
        {[-0.55, 0.55].map((x) => (
          <group key={x} position={[x, 0, 0]} scale={[0.95, 0.85, 1.25]}>
            <mesh>
              <icosahedronGeometry args={[1, 2]} />
              <meshBasicMaterial color={p.accent} wireframe transparent opacity={p.dark ? 0.7 : 0.8} />
            </mesh>
          </group>
        ))}
        <mesh material={inner} scale={[1.05, 0.8, 1]}>
          <sphereGeometry args={[1, 48, 32]} />
        </mesh>
      </group>
      <Glow color={p.accent} position={[0, 1.6, -1.8]} size={6.5} opacity={p.dark ? 0.35 : 0.18} />
    </>
  );
}

function TargetScene({ p }: { p: ScenePalette }) {
  const arrow = useGlass(p.accent, { dark: p.dark });
  return (
    <>
      <Floor p={p} />
      <group position={[0.4, 1.6, 0]} rotation={[0, -0.4, 0]}>
        {[1.35, 0.95, 0.55].map((r, i) => (
          <Ring key={r} radius={r} tube={0.06} color={i === 2 ? p.accent : p.level} glow={i === 2 ? 1.1 : 0.6} />
        ))}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.16, 32, 16]} />
          <meshPhysicalMaterial color={p.accent} emissive={p.accent} emissiveIntensity={1} />
        </mesh>
      </group>
      {/* the arrow's tip is at the group's origin, the bullseye */}
      <group position={[0.4, 1.6, 0.08]} rotation={[0, 0.35, 0.42]}>
        <mesh material={arrow} position={[-1.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 2.2, 16]} />
        </mesh>
        <mesh material={arrow} position={[-0.17, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.13, 0.34, 24]} />
        </mesh>
      </group>
      <Glow color={p.level} position={[0.4, 1.6, -1.8]} size={6.5} opacity={p.dark ? 0.3 : 0.16} />
    </>
  );
}

function GlobeScene({ p }: { p: ScenePalette }) {
  const inner = useGlass(p.level, { dark: p.dark });
  return (
    <>
      <Floor p={p} />
      <group position={[0, 1.6, 0]} rotation={[0.25, 0.4, 0]}>
        <mesh material={inner}>
          <sphereGeometry args={[1.15, 64, 32]} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.2, 18, 12]} />
          <meshBasicMaterial color={p.accent} wireframe transparent opacity={p.dark ? 0.45 : 0.6} />
        </mesh>
        <Ring radius={1.75} tube={0.035} color={p.accent} rotation={[Math.PI / 2.4, 0, 0]} glow={1} />
      </group>
      <Glow color={p.accent} position={[0, 1.6, -1.8]} size={6.5} opacity={p.dark ? 0.32 : 0.18} />
    </>
  );
}

// A call option's value over price (x) and time left (y): the payoff kink, smoothed by time.
const payoff = (x: number, y: number) => {
  const s = x * 1.6;
  const t = 0.15 + ((y + 1) / 2) * 0.9;
  return ((Math.log(1 + Math.exp((s / t) * 1.6)) * t) / 1.6) * 1.1;
};

function SurfaceScene({ p }: { p: ScenePalette }) {
  return (
    <>
      <Floor p={p} y={-0.01} />
      <group position={[0, 0.25, 0]} rotation={[0, -0.6, 0]}>
        <Surface fn={payoff} size={4.2} low={p.level} high={p.accent} dark={p.dark} />
      </group>
      <Glow color={p.accent} position={[0.5, 1.8, -2]} size={6} opacity={p.dark ? 0.3 : 0.16} />
    </>
  );
}

function ConsistentScene({ p }: { p: ScenePalette }) {
  return (
    <>
      <Floor p={p} />
      <Ring radius={1.8} tube={0.05} color={p.accent} position={[0, 1.55, -0.3]} glow={1} />
      {Array.from({ length: 8 }, (_, i) => {
        const x = -1.4 + i * 0.4;
        const h = 0.35 + i * 0.16;
        return <GlassBlock key={i} size={[0.28, h, 0.5]} position={[x, 0.55 + h / 2, 0]} color={i % 3 === 2 ? p.down : p.up} dark={p.dark} radius={0.05} />;
      })}
      <Glow color={p.level} position={[0, 1.6, -2]} size={6.5} opacity={p.dark ? 0.3 : 0.16} />
    </>
  );
}

export const HERO: SceneDef = {
  camera: { position: [0, 1.7, 9.4], fov: 32 },
  target: [0, 1.5, 0],
  sway: 14,
  render: (p) => (
    <>
      <GridFloor color={p.line} y={-0.3} opacity={p.dark ? 0.35 : 0.4} />
      <CandleRow bars={HERO_BARS} palette={p} />
      <Glow color={p.accent} position={[0.3, 1.6, -2.2]} size={7.5} opacity={p.dark ? 0.38 : 0.2} />
    </>
  ),
};

/** One scene per module, keyed by module id. Cameras frame each object in the middle of a 3:2 cover. */
export const MODULE_SCENES: Record<string, SceneDef> = {
  'm00-what-is-a-market': { ...cover([0, 2.4, 7.8], [0, 1.55, 0]), render: (p) => <StandScene p={p} /> },
  'm01-reading-price': { ...cover([0, 1.9, 7.6], [0, 1.65, 0]), render: (p) => <ChartPanelScene p={p} /> },
  'm02-candlestick-patterns': { ...cover([0, 2.3, 6.8], [0, 1.7, 0]), render: (p) => <StackScene p={p} /> },
  'm03-market-structure': { ...cover([0, 3, 7.2], [0, 1.2, 0]), render: (p) => <StairsScene p={p} /> },
  'm04-chart-patterns': { ...cover([0, 2.2, 7.4], [0, 1.3, 0]), render: (p) => <HeadShouldersScene p={p} /> },
  'm05-indicators': { ...cover([0, 2.1, 7.2], [0, 1.45, 0]), render: (p) => <OscillatorScene p={p} /> },
  'm06-orders-and-execution': { ...cover([0, 2.2, 6.4], [0, 0.95, 0]), render: (p) => <OrderBookScene p={p} /> },
  'm07-risk-management': { ...cover([0, 2, 6.4], [0, 1.5, 0]), render: (p) => <ShieldScene p={p} /> },
  'm08-trading-psychology': { ...cover([0, 2.1, 6.3], [0, 1.5, 0]), render: (p) => <BrainScene p={p} /> },
  'm09-strategies': { ...cover([0, 2.1, 7], [0, 1.5, 0]), render: (p) => <TargetScene p={p} /> },
  'm10-fundamentals-and-macro': { ...cover([0, 2.1, 6.8], [0, 1.55, 0]), render: (p) => <GlobeScene p={p} /> },
  'm11-derivatives-and-other-markets': { ...cover([0, 3.2, 6.4], [0, 0.9, 0]), render: (p) => <SurfaceScene p={p} /> },
  'm12-becoming-consistent': { ...cover([0, 2.1, 8], [0, 1.55, 0]), render: (p) => <ConsistentScene p={p} /> },
};

// ---------------------------------------------------------------- illustrations

/** The 404: one tall down candle snapped in two, its top half fallen beside it. */
function BrokenCandleScene({ p }: { p: ScenePalette }) {
  const wick = useGlow(p.down, p.dark ? 0.55 : 0.25);
  return (
    <>
      <Floor p={p} />
      {/* the half still standing, on its lower wick, broken off at a slant */}
      <mesh position={[-0.6, 0.18, 0]} material={wick}>
        <cylinderGeometry args={[0.028, 0.028, 0.36, 12]} />
      </mesh>
      <GlassBlock size={[0.62, 1.2, 0.62]} position={[-0.6, 0.95, 0]} color={p.down} dark={p.dark} radius={0.06} />
      <GlassBlock size={[0.62, 0.2, 0.62]} position={[-0.62, 1.58, 0]} rotation={[0, 0, 0.3]} color={p.down} dark={p.dark} radius={0.05} />
      {/* the half that fell, lying on its side, its upper wick along the floor */}
      <group position={[0.85, 0.31, 0.3]} rotation={[0, 0.45, -Math.PI / 2 + 0.06]}>
        <GlassBlock size={[0.62, 1.05, 0.62]} position={[0, 0, 0]} color={p.down} dark={p.dark} radius={0.06} />
        <mesh position={[0, 0.88, 0]} material={wick}>
          <cylinderGeometry args={[0.028, 0.028, 0.7, 12]} />
        </mesh>
      </group>
      {/* shards */}
      <GlassBlock size={[0.16, 0.07, 0.13]} position={[0.02, 0.04, 0.55]} rotation={[0, 0.8, 0]} color={p.down} dark={p.dark} radius={0.02} />
      <GlassBlock size={[0.12, 0.06, 0.18]} position={[-0.25, 0.03, 0.85]} rotation={[0, -0.4, 0]} color={p.down} dark={p.dark} radius={0.02} />
      <GlassBlock size={[0.1, 0.05, 0.09]} position={[0.3, 0.03, 0.95]} rotation={[0, 0.3, 0]} color={p.down} dark={p.dark} radius={0.02} />
      <Glow color={p.down} position={[0.2, 1.2, -2]} size={6} opacity={p.dark ? 0.26 : 0.12} />
      <Glow color={p.accent} position={[-1.4, 1.8, -2.4]} size={4.5} opacity={p.dark ? 0.2 : 0.1} />
    </>
  );
}

/** The empty journal: an open book of glass pages, ruled and blank, and one candle waiting above it. */
function EmptyJournalScene({ p }: { p: ScenePalette }) {
  const wick = useGlow(p.accent, p.dark ? 0.7 : 0.35);
  const spine = useGlass(p.level, { dark: p.dark });
  const page = (side: 1 | -1) => (
    <group position={[side * 0.88, 0.36, 0]} rotation={[0, 0, side * 0.24]}>
      <GlassBlock size={[1.7, 0.07, 2.2]} position={[0, 0, 0]} color={p.level} dark={p.dark} radius={0.03} />
      {[-0.7, -0.35, 0, 0.35, 0.7].map((z) => (
        <mesh key={z} position={[0, 0.045, z]}>
          <boxGeometry args={[1.35, 0.006, 0.012]} />
          <meshBasicMaterial color={p.line} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
  return (
    <>
      <Floor p={p} />
      {page(-1)}
      {page(1)}
      <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} material={spine}>
        <cylinderGeometry args={[0.07, 0.07, 2.2, 16]} />
      </mesh>
      <mesh position={[0, 1.8, -0.1]} material={wick}>
        <cylinderGeometry args={[0.025, 0.025, 1.05, 12]} />
      </mesh>
      <GlassBlock size={[0.36, 0.5, 0.36]} position={[0, 1.78, -0.1]} color={p.accent} dark={p.dark} radius={0.05} />
      <Glow color={p.accent} position={[0, 1.7, -1.6]} size={5} opacity={p.dark ? 0.34 : 0.18} />
    </>
  );
}

/** Scenes drawn on the page background rather than a cover, for empty states and the 404. */
export const ILLUSTRATIONS: Record<string, SceneDef> = {
  'broken-candle': { camera: { position: [0.1, 1.9, 5.8], fov: 32 }, target: [0.1, 0.7, 0.2], sway: 10, render: (p) => <BrokenCandleScene p={p} /> },
  'empty-journal': { camera: { position: [0, 2.3, 5.8], fov: 32 }, target: [0, 0.85, 0], sway: 10, render: (p) => <EmptyJournalScene p={p} /> },
};

export type SceneId = 'hero' | keyof typeof MODULE_SCENES;

export function sceneFor(id: string): SceneDef | null {
  return id === 'hero' ? HERO : (MODULE_SCENES[id] ?? ILLUSTRATIONS[id] ?? null);
}

