/**
 * /__art/:id -- a scene alone on the page, for tools/render-art.mjs to photograph. Development
 * only; the route and this file are dropped from production builds.
 *
 *   ?theme=dark|light   the palette to render with (applied here, not saved)
 *   ?frame=cover        a module cover, 3:2, on its level-tinted backdrop
 *   ?frame=hero         the home page poster, on the page background
 *   ?frame=og           1200x630 link-preview card: the scene on the right, the title on the left
 *
 * When the scene has drawn, `window.__art.capture(width, type, quality)` returns the finished
 * image as a data URL, composed on a 2D canvas: background, scene, and for `og` the text.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { findModule, LEVELS } from '@/content/curriculum';
import { cssColor } from '@/lib/cssColor';
import { ArtCanvas } from '@/components/three/ArtCanvas';
import { ILLUSTRATIONS } from '@/components/three/scenes';
import { t } from '@/i18n';

type Frame = 'cover' | 'hero' | 'og';

declare global {
  interface Window {
    __art?: { ready: boolean; capture: (width: number, type: string, quality: number) => Promise<string> };
  }
}

const OG = { w: 1200, h: 630, sceneX: 400 };

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export function ArtPage() {
  const { id = 'hero' } = useParams();
  const [params] = useSearchParams();
  const dark = params.get('theme') !== 'light';
  const illustration = id in ILLUSTRATIONS;
  const frame = (params.get('frame') ?? (id === 'hero' || illustration ? 'hero' : 'cover')) as Frame;
  const mod = id === 'hero' || illustration ? null : findModule(id);
  const [themed, setThemed] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  // The theme for this render only: the class, not the saved preference.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.body.style.background = 'transparent';
    setThemed(true);
  }, [dark]);

  useEffect(() => () => void (window.__art = undefined), []);

  const onFirstFrame = () => {
    window.__art = {
      ready: true,
      capture: async (width, type, quality) => {
        const gl = holder.current?.querySelector('canvas');
        if (!gl) throw new Error('no canvas');
        const out = document.createElement('canvas');
        const ctx = out.getContext('2d')!;
        if (frame === 'og') {
          out.width = OG.w;
          out.height = OG.h;
          await document.fonts.load('700 60px "Geist Variable"');
          await document.fonts.load('500 24px "Inter Variable"');
          ctx.fillStyle = cssColor('--color-bg');
          ctx.fillRect(0, 0, OG.w, OG.h);
          const glow = ctx.createRadialGradient(OG.w * 0.72, OG.h * 0.45, 0, OG.w * 0.72, OG.h * 0.45, OG.w * 0.5);
          glow.addColorStop(0, `${cssColor('--color-accent')}33`);
          glow.addColorStop(1, `${cssColor('--color-accent')}00`);
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, OG.w, OG.h);
          ctx.drawImage(gl, OG.sceneX, 0, OG.w - OG.sceneX, OG.h);
          // Fade the scene out under the text.
          const fade = ctx.createLinearGradient(OG.sceneX, 0, OG.sceneX + 260, 0);
          fade.addColorStop(0, cssColor('--color-bg'));
          fade.addColorStop(1, `${cssColor('--color-bg')}00`);
          ctx.fillStyle = fade;
          ctx.fillRect(OG.sceneX, 0, 260, OG.h);
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = cssColor('--color-accent');
          ctx.font = '600 22px "Inter Variable"';
          ctx.fillText(mod ? t('common.module', { number: mod.number }).toUpperCase() : t('home.eyebrow').toUpperCase(), 72, 150);
          ctx.fillStyle = cssColor('--color-ink');
          ctx.font = '700 60px "Geist Variable"';
          const lines = wrap(ctx, mod ? mod.title : t('brand.full'), 560);
          lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 72, 230 + i * 70));
          ctx.fillStyle = cssColor('--color-ink-soft');
          ctx.font = '400 26px "Inter Variable"';
          const sub = wrap(ctx, mod ? `${LEVELS[mod.level].label} · ${t('common.lessons', { count: mod.lessons.length })}` : t('home.titleAccent'), 520);
          sub.slice(0, 2).forEach((l, i) => ctx.fillText(l, 72, 230 + lines.length * 70 + 20 + i * 36));
          ctx.fillStyle = cssColor('--color-ink-muted');
          ctx.font = '500 22px "Inter Variable"';
          ctx.fillText(t('brand.full'), 72, OG.h - 64);
          return out.toDataURL(type, quality);
        }
        out.width = width;
        out.height = Math.round((gl.height / gl.width) * width);
        ctx.drawImage(gl, 0, 0, out.width, out.height);
        return out.toDataURL(type, quality);
      },
    };
  };

  if (!themed) return null;
  return (
    <div
      ref={holder}
      className="fixed inset-0 z-[100]"
      style={frame === 'og' ? { left: OG.sceneX, width: OG.w - OG.sceneX, height: OG.h, background: 'transparent' } : { background: 'transparent' }}
    >
      <ArtCanvas scene={id} level={mod?.level ?? 'accent'} live={false} dark={dark} onFirstFrame={onFirstFrame} />
    </div>
  );
}
