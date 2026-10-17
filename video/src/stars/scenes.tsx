/**
 * "Morning Star and Evening Star", cinematic (directive V3), on CinematicChart and the shared
 * pieces: every chart is candles, every number on screen comes from ./data.ts, labels sit on what
 * they name (no pointer lines), disclaimer tags go in the corner, and the three candles (night,
 * star, day) arrive one at a time, as the narration tells them.
 */
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { OHLC } from '@/engine/market/types';
import { CornerTag, ILLUSTRATION, SYNTHETIC, body, kicker, s, useMark, useSpeechAt } from '../kit';
import { CinematicChart } from '../cinematic/CinematicChart';
import { ACCENT, Checklist, DOWN, PRICE, Panel, PatternIntro, PractiseEnd, Recap, SOFT, UP, fmt, grow, upto, view } from '../cinematic/pieces';
import { Headline, clamp, fade } from '../cinematic/scenes';
import * as d from './data';

const MID = 'var(--color-chart-2)';

/** The three candles arriving one at a time: candle one, then the star growing, then the third growing. */
function threeCandles(bars: OHLC[], f: number, one: number, star: number, three: number) {
  const g7 = interpolate(f, [star, star + s(1.8)], [0, 1], clamp);
  const g8 = interpolate(f, [three, three + s(2.2)], [0, 1], clamp);
  return { bars: grow(grow(bars, 7, g7), 8, g8), draw: upto(f >= three ? 8 : f >= star ? 7 : f >= one ? 6 : 5, bars.length) };
}

// ---------------------------------------------------------------- title

export function StarsIntro() {
  return <PatternIntro kicker="Module 2 · Candlestick patterns · Lesson 10" words={['Morning', '&', 'evening', 'stars']} sub="Night, a pause, then day." bars={d.MS} growIndex={8} />;
}

// ---------------------------------------------------------------- intro

/** Night, the grey in-between, day; then the morning star telling the same story, and its mirror. */
export function IntroCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const define = useMark('define', 11);
  const evening = useMark('evening', 22);
  const out = fade(f, define, s(0.6));
  const toEvening = fade(f, evening, s(0.6));
  const sky = [
    { label: 'night', color: '#1b2140', from: at(0.04) },
    { label: 'the in-between', color: '#5b6273', from: at(0.1) },
    { label: 'day', color: '#d9a441', from: at(0.16) },
  ];
  const ms = threeCandles(d.MS, f, define + s(0.3), at(0.42), at(0.52));
  return (
    <AbsoluteFill>
      <Headline key={f < define ? 'a' : f < evening ? 'b' : 'c'} kicker={f < define ? 'The idea' : 'The pattern'} at={f < define ? s(0.3) : f < evening ? define : evening} accent={f < define ? undefined : f < evening ? UP : DOWN}>
        {f < define ? 'Night, the in-between, then day' : f < evening ? 'Morning star: night, a star, then day' : 'Evening star: the mirror, at dusk'}
      </Headline>
      {f < define + s(0.6) && (
        <AbsoluteFill style={{ opacity: 1 - out }}>
          <CornerTag label={ILLUSTRATION} />
          <div style={{ position: 'absolute', left: 160, right: 160, top: 420, height: 260, display: 'flex', gap: 24 }}>
            {sky.map((k) => (
              <div key={k.label} style={{ flex: 1, borderRadius: 28, background: k.color, opacity: fade(f, k.from), display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 26, fontSize: 38, fontWeight: 700, color: 'var(--color-ink)' }}>
                {k.label}
              </div>
            ))}
          </div>
        </AbsoluteFill>
      )}
      {f >= define && (
        <AbsoluteFill style={{ opacity: out }}>
          <CornerTag label={SYNTHETIC} />
          <AbsoluteFill style={{ opacity: 1 - toEvening }}>
            <CinematicChart
              cam={view(d.MS, 2.5, 9.6, 0.16)}
              bars={ms.bars}
              lines={[]}
              draw={ms.draw}
              head={false}
              maxBody={80}
              legend={PRICE}
              notes={[
                { label: 'night', color: DOWN, opacity: fade(f, define + s(0.6)), index: 6 },
                { label: 'star', color: ACCENT, opacity: fade(f, at(0.42) + s(1.2)), index: 7 },
                { label: 'day', color: UP, opacity: fade(f, at(0.52) + s(1.8)), index: 8 },
              ]}
            />
          </AbsoluteFill>
          {toEvening > 0 && (
            <AbsoluteFill style={{ opacity: toEvening }}>
              <CinematicChart cam={view(d.ES, 2.5, 9.6, 0.16)} bars={d.ES} lines={[]} draw={upto(8, d.ES.length)} head={false} maxBody={80} legend={PRICE} outlines={[{ from: 6, to: 8, color: ACCENT, opacity: 1 }]} notes={[{ label: 'dusk', color: DOWN, opacity: fade(f, evening + s(1)), index: 8 }]} />
            </AbsoluteFill>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- rules

export function RulesCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const trend = useMark('trend', 1.5);
  const star = useMark('star', 5);
  const third = useMark('third', 11);
  const t = threeCandles(d.MS, f, 0, star, third);
  return (
    <AbsoluteFill>
      <Headline kicker="The exact rules" at={s(0.3)}>
        Morning star: a stall below, then a deep close
      </Headline>
      <CinematicChart
        cam={view(d.MS, 2.6, 8.7, 0.14)}
        bars={t.bars}
        lines={[]}
        draw={t.draw}
        head={false}
        maxBody={60}
        plot={{ left: 120, right: 960, top: 300, bottom: 900 }}
        regions={[{ from: -0.5, to: 5.5, color: DOWN, opacity: fade(f, trend) * (1 - fade(f, star)) }]}
        levels={[
          { price: d.FIRST_CLOSE, label: `first close ${fmt(d.FIRST_CLOSE)}`, color: SOFT, opacity: fade(f, star) * (1 - fade(f, third)) },
          { price: d.MID, label: `middle ${fmt(d.MID)}`, color: MID, opacity: fade(f, third) },
        ]}
      />
      <Checklist
        items={[
          { title: 'After a decline: a big red candle', detail: 'candle one', from: Math.max(trend, at(0.02)) },
          { title: 'A small body, below candle one\'s', detail: `${fmt(d.STAR_BOTTOM)}–${fmt(d.STAR_TOP)} below ${fmt(d.FIRST_CLOSE)}`, from: star, mono: true },
          { title: 'Candle three closes past the middle', detail: `${fmt(d.THIRD_CLOSE)} > ${fmt(d.MID)}`, from: third, mono: true },
          { title: 'The star\'s colour: any', detail: 'green or red', from: at(0.86) },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- psychology

export function PsychologyCinematic() {
  const f = useCurrentFrame();
  const day1 = useMark('day1', 0.5);
  const day2 = useMark('day2', 3);
  const day3 = useMark('day3', 12);
  const t = threeCandles(d.MS, f, day1, day2 + s(0.3), day3 + s(0.3));
  return (
    <AbsoluteFill>
      <Headline kicker="The psychology" at={s(0.3)} accent={ACCENT}>
        Selling, a stall, then buying: three sessions
      </Headline>
      <CinematicChart
        cam={view(d.MS, 2.5, 9.6, 0.16)}
        bars={t.bars}
        lines={[]}
        draw={t.draw}
        head={false}
        maxBody={80}
        legend={PRICE}
        spotlight={{ index: f >= day3 ? 8 : f >= day2 ? 7 : 6, value: 99, radius: 460, strength: fade(f, day1) * 0.7 }}
        outlines={[{ from: 6, to: 8, color: ACCENT, opacity: fade(f, day3 + s(3)) }]}
        notes={[
          { label: 'day 1: sellers win big', color: DOWN, opacity: fade(f, day1 + s(0.4)), index: 6 },
          { label: 'day 2: goes nowhere', color: ACCENT, opacity: fade(f, day2 + s(2)), index: 7 },
          { label: 'day 3: buyers drive it back', color: UP, opacity: fade(f, day3 + s(2.4)), index: 8 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- seesaw

/** The lesson's seesaw: slam down, wobble, swing the other way. */
export function SeesawCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const t1 = at(0.12);
  const t2 = at(0.38);
  const t3 = at(0.62);
  const settle = (from: number) => Math.exp(-Math.max(0, f - from) / s(0.6));
  let angle = interpolate(f, [t1, t1 + s(0.4)], [0, -14], { ...clamp, easing: Easing.out(Easing.quad) });
  if (f >= t2) angle = -4 + 5 * Math.sin((f - t2) / 4) * settle(t2);
  if (f >= t3) angle = interpolate(f, [t3, t3 + s(0.5)], [-4, 14], { ...clamp, easing: Easing.out(Easing.quad) });
  const L = 520;
  const cx = 960;
  const cy = 640;
  const end = (side: number) => ({ x: cx + side * L * Math.cos((angle * Math.PI) / 180), y: cy + side * L * Math.sin((angle * Math.PI) / 180) });
  const left = end(-1);
  const right = end(1);
  const captions: [string, string, number][] = [
    ['slams down: the red candle', DOWN, t1],
    ['wobbles: the star', ACCENT, t2],
    ['swings back: the green candle', UP, t3],
  ];
  return (
    <AbsoluteFill>
      <Headline kicker="Picture it" at={s(0.3)}>
        The star is the wobble
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <polygon points={`${cx - 50},${cy + 120} ${cx + 50},${cy + 120} ${cx},${cy + 10}`} fill={SOFT} />
        <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="#c9a86a" strokeWidth={22} strokeLinecap="round" />
        {f >= t1 && <circle cx={left.x + 60} cy={left.y - 56} r={44} fill={DOWN} opacity={fade(f, t1, s(0.3))} />}
        {f >= t2 && <circle cx={right.x - 60} cy={right.y - 40} r={28} fill={ACCENT} opacity={fade(f, t2, s(0.3))} />}
        {f >= t3 && <circle cx={right.x - 130} cy={right.y - 46} r={34} fill={UP} opacity={fade(f, t3, s(0.3))} />}
      </svg>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 900, display: 'flex', justifyContent: 'space-between' }}>
        {captions.map(([text, color, from]) => (
          <div key={text} style={{ ...body, fontSize: 34, fontWeight: 700, color, opacity: fade(f, from) }}>
            {text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- evening

export function EveningCinematic() {
  const f = useCurrentFrame();
  const star = useMark('star', 4);
  const third = useMark('third', 9);
  const t = threeCandles(d.ES, f, 0, star, third);
  return (
    <AbsoluteFill>
      <Headline kicker="The mirror image" at={s(0.3)} accent={DOWN}>
        Evening star: a stall above, then a deep red close
      </Headline>
      <CinematicChart
        cam={view(d.ES, 2.5, 9.6, 0.16)}
        bars={t.bars}
        lines={[]}
        draw={t.draw}
        head={false}
        maxBody={80}
        legend={PRICE}
        spotlight={{ index: f >= third ? 8 : 7, value: 100, radius: 460, strength: fade(f, star) * 0.7 }}
        levels={[{ price: d.ES_MID, label: `middle ${fmt(d.ES_MID)}`, color: MID, opacity: fade(f, third) }]}
        notes={[
          { label: 'gaps up, goes nowhere', color: ACCENT, opacity: fade(f, star + s(1.8)) * (1 - fade(f, third)), index: 7 },
          { label: `${d.ES_REACH}% into the green body`, color: DOWN, opacity: fade(f, third + s(2.4)), index: 8 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- star

/** Three middles on the same first and third candles: a doji, the figure's small star, and a medium body. */
export function StarCinematic() {
  const f = useCurrentFrame();
  const small = useMark('small', 2);
  const gap = useMark('gap', 9);
  const colour = useMark('colour', 15);
  const P = [
    { x0: 120, x1: 660, title: 'Doji star: strongest', bars: d.DOJI_STAR },
    { x0: 690, x1: 1230, title: 'Small star: the figure', bars: d.MS },
    { x0: 1260, x1: 1800, title: 'Medium body: not a star', bars: d.LAZY_STAR },
  ];
  return (
    <AbsoluteFill>
      <Headline key={String(f >= gap)} kicker="Reading the star" at={f >= gap ? gap : s(0.3)} accent={ACCENT}>
        {f >= gap ? 'A gap on both sides leaves the star alone' : 'The smaller the star, the better'}
      </Headline>
      {P.map((pn, k) => (
        <div key={k} style={{ opacity: fade(f, small + k * s(0.6)) }}>
          <Panel x0={pn.x0} x1={pn.x1} y0={240} y1={900} title={pn.title} state={1} />
          <CinematicChart
            cam={view(pn.bars, 5.3, 8.7, 0.12)}
            bars={pn.bars}
            lines={[]}
            draw={upto(8, pn.bars.length)}
            head={false}
            maxBody={56}
            plot={{ left: pn.x0 + 30, right: pn.x1 - 150, top: 340, bottom: 800 }}
            outlines={[{ from: 7, to: 7, color: k === 2 ? DOWN : ACCENT, opacity: 1 }]}
            notes={k === 1 ? [{ label: 'gaps', color: ACCENT, opacity: fade(f, gap + s(0.6)), index: 7 }] : []}
          />
        </div>
      ))}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', ...body, fontSize: 36, color: 'var(--color-ink)', opacity: fade(f, colour) }}>
        The star's colour does not matter.
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- third

export function ThirdCinematic() {
  const f = useCurrentFrame();
  const deep = useMark('deep', 5);
  const volume = useMark('volume', 13);
  return (
    <AbsoluteFill>
      <Headline kicker="Reading the third candle" at={s(0.3)} accent={UP}>
        {`The built-in confirmation: ${d.REACH}% of the body back`}
      </Headline>
      <CinematicChart
        cam={view(d.MS, 4.6, 9.4, 0.12)}
        bars={d.MS}
        lines={[]}
        draw={upto(8, d.MS.length)}
        head={false}
        maxBody={90}
        legend={PRICE}
        levels={[
          { price: d.FIRST_OPEN, label: `first open ${fmt(d.FIRST_OPEN)}`, color: DOWN, opacity: fade(f, deep) },
          { price: d.FIRST_CLOSE, label: `first close ${fmt(d.FIRST_CLOSE)}`, color: DOWN, opacity: fade(f, deep + s(0.5)) },
        ]}
        brackets={[{ index: 8, from: d.FIRST_CLOSE, to: d.THIRD_CLOSE, color: UP, opacity: fade(f, deep + s(1.5)), label: `${d.REACH}%` }]}
        notes={[{ label: 'heavy volume here: real buying', color: SOFT, opacity: fade(f, volume + s(0.4)) }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- valid

export function ValidCinematic() {
  const f = useCurrentFrame();
  const timeframe = useMark('timeframe', 8);
  const split = fade(f, timeframe, s(0.6));
  const half = (bars: OHLC[], left: number, title: string, note: string) => (
    <>
      <div style={{ position: 'absolute', left, top: 270, fontSize: 34, fontWeight: 700, color: 'var(--color-ink)' }}>{title}</div>
      <CinematicChart cam={view(d.MS, 4.4, 8.7, 0.14)} bars={bars} lines={[]} head={false} maxBody={60} draw={upto(8, bars.length)} plot={{ left, right: left + 620, top: 340, bottom: 820 }} outlines={[{ from: 7, to: 7, color: ACCENT, opacity: 1 }]} notes={[{ label: note, color: ACCENT, opacity: fade(f, timeframe + s(1)), index: 7 }]} />
    </>
  );
  return (
    <AbsoluteFill>
      <Headline key={String(f >= timeframe)} kicker="Where it is valid" at={f >= timeframe ? timeframe : s(0.3)}>
        {f >= timeframe ? 'Daily charts: gaps isolate the star' : 'A clear trend first, ideally into a level'}
      </Headline>
      <AbsoluteFill style={{ opacity: 1 - split }}>
        <CornerTag label={SYNTHETIC} />
        <CinematicChart cam={view(d.MS, -0.8, 9.6, 0.16)} bars={d.MS} lines={[]} head={false} maxBody={80} draw={upto(8, d.MS.length)} legend={PRICE} regions={[{ from: -0.5, to: 5.5, color: DOWN, opacity: fade(f, s(1)), label: 'a decline first' }]} outlines={[{ from: 6, to: 8, color: ACCENT, opacity: fade(f, s(2)) }]} />
      </AbsoluteFill>
      {split > 0 && (
        <AbsoluteFill style={{ opacity: split }}>
          <CornerTag label="Left: synthetic data · Right: illustration" />
          {half(d.MS, 160, 'Daily: gaps on both sides', 'isolated')}
          {half(d.NO_GAP, 1040, 'Five-minute: no gaps', 'weaker')}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- trade

export function TradeCinematic() {
  const f = useCurrentFrame();
  const entry = useMark('entry', 2);
  const stop = useMark('stop', 10);
  const head = f < entry ? 'A trade idea to practise' : f < stop ? 'Entry: at the third candle\'s close' : 'Stop: below the star\'s low';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="A trade idea" at={f < entry ? s(0.3) : f < stop ? entry : stop} accent={f < entry ? undefined : f < stop ? UP : DOWN}>
        {head}
      </Headline>
      <CinematicChart
        cam={view(d.MS, 2.5, 9.9, 0.16)}
        bars={d.MS}
        lines={[]}
        head={false}
        maxBody={80}
        draw={upto(8, d.MS.length)}
        legend={PRICE}
        spotlight={f >= stop ? { index: 7, value: d.STOP + 1, radius: 420, strength: fade(f, stop) * 0.75 } : { index: 8, value: d.ENTRY, radius: 460, strength: fade(f, entry) * 0.7 }}
        outlines={[{ from: 6, to: 8, color: ACCENT, opacity: 1 }]}
        levels={[
          { price: d.ENTRY, label: `entry ${fmt(d.ENTRY)}`, color: UP, opacity: fade(f, entry + s(0.5)) },
          { price: d.STOP, label: `stop ${fmt(d.STOP)}`, color: DOWN, opacity: fade(f, stop + s(0.5)) },
        ]}
        brackets={[{ index: 8, from: d.STOP, to: d.ENTRY, color: ACCENT, opacity: fade(f, stop + s(2.5)), label: `risk ${fmt(d.RISK)}` }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- lazy

export function LazyCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  return (
    <AbsoluteFill>
      <Headline kicker="The lazy star" at={s(0.3)} accent="var(--color-danger)">
        A medium middle candle is not a star
      </Headline>
      <CinematicChart
        cam={view(d.LAZY_STAR, 2.5, 9.6, 0.16)}
        bars={d.LAZY_STAR}
        lines={[]}
        head={false}
        maxBody={80}
        draw={upto(8, d.LAZY_STAR.length)}
        legend={PRICE}
        spotlight={{ index: 7, value: 98, radius: 420, strength: fade(f, at(0.15)) * 0.75 }}
        outlines={[{ from: 7, to: 7, color: DOWN, opacity: fade(f, at(0.15)) }]}
        notes={[
          { label: 'medium body, overlapping', color: DOWN, opacity: fade(f, at(0.2)) * (1 - fade(f, at(0.6))), index: 7 },
          { label: 'no stall: just a bounce', color: DOWN, opacity: fade(f, at(0.62)), index: 8 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- reliability

export function ReliabilityCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const ranks = useMark('ranks', 10);
  const warn = useMark('warn', 17);
  const L = 760;
  const R = 1520;
  const X = (pct: number) => L + (pct / 100) * (R - L);
  const bar = (label: string, pct: number, color: string, y: number, start: number, rank: number) => {
    const fill = interpolate(f, [start, start + s(1.2)], [0, pct], { ...clamp, easing: Easing.out(Easing.cubic) });
    return (
      <g opacity={fade(f, start)}>
        <text x={L - 30} y={y + 46} textAnchor="end" fontSize={38} fontWeight={700} fill={color} fontFamily="var(--font-sans)">
          {label}
        </text>
        <rect x={L} y={y} width={R - L} height={70} rx={14} fill="var(--color-surface-1)" stroke="var(--color-line)" strokeWidth={2} />
        <rect x={L} y={y} width={X(fill) - L} height={70} rx={14} fill={color} opacity={0.85} />
        <text x={R + 24} y={y + 50} fontSize={46} fontWeight={700} fill={color} fontFamily="var(--font-mono)">
          {Math.round(fill)}%
        </text>
        <text x={R + 150} y={y + 46} fontSize={30} fill={SOFT} fontFamily="var(--font-sans)" opacity={fade(f, ranks + s(0.6))}>
          rank {rank} of {d.PATTERNS}
        </text>
      </g>
    );
  };
  return (
    <AbsoluteFill>
      <Headline kicker="Honest reliability" at={s(0.3)}>
        Among the best candle patterns
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <text x={X(50)} y={292} textAnchor="middle" fontSize={28} fill={SOFT} fontFamily="var(--font-sans)" opacity={fade(f, at(0.03))}>
          coin flip: 50%
        </text>
        {bar('Morning star', d.BULKOWSKI_MORNING, UP, 320, at(0.06), d.RANK_MORNING)}
        {bar('Evening star', d.BULKOWSKI_EVENING, DOWN, 430, at(0.22), d.RANK_EVENING)}
        <line x1={X(50)} x2={X(50)} y1={302} y2={520} stroke="var(--color-ink)" strokeWidth={3} strokeDasharray="10 8" opacity={0.7 * fade(f, at(0.03))} />
      </svg>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 560, fontSize: 26, color: SOFT, opacity: fade(f, at(0.06)) }}>Source: Thomas Bulkowski's published tests, thepatternsite.com. The rank also weighs how far price moved afterwards.</div>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 640, display: 'flex', gap: 40 }}>
        {[
          ['Only with a proper trend', 'a small star and a deep third candle; a sloppy star in a range does not earn these numbers'],
          ['No promise of size', 'no pattern promises a big move'],
        ].map(([title, text], k) => {
          const o = fade(f, warn + s(0.5) + k * s(1.6));
          return (
            <div key={title} style={{ flex: 1, opacity: o, borderLeft: '10px solid var(--color-danger)', background: 'var(--color-danger-soft)', borderRadius: 24, padding: '26px 34px' }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--color-ink)' }}>{title}</div>
              <div style={{ ...body, fontSize: 30, color: 'var(--color-ink)', marginTop: 6 }}>{text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- takeaways

export function TakeawaysCinematic() {
  return (
    <Recap
      items={[
        ['Morning star: a big red candle, a small star below it, a big green close past the middle.', UP],
        ['Evening star: the mirror, after a rise.', DOWN],
        ['The star is the stall; the third candle is the built-in confirmation.', ACCENT],
        ['Smaller stars, real gaps and deep third candles make it stronger.', MID],
        ['Put the stop beyond the star.', 'var(--color-danger)'],
      ]}
      starts={[0.03, 0.42, 0.52, 0.72, 0.9]}
    />
  );
}

// ---------------------------------------------------------------- quiz

export function QuizCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const think = useMark('think', 10);
  const reveal = useMark('reveal', 13);
  const shown = f >= reveal;
  const ring = interpolate(f, [think, reveal], [0, 1], clamp);
  const option = (letter: string, text: string, right: boolean, atF: number) => {
    const o = fade(f, atF, s(0.5));
    return (
      <div style={{ opacity: o * (shown && !right ? 0.45 : 1), borderRadius: 24, border: `3px solid ${shown && right ? UP : 'var(--color-line)'}`, background: 'var(--color-surface-1)', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 26 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 42, fontWeight: 700, color: shown ? (right ? UP : DOWN) : ACCENT }}>{shown ? (right ? '✓' : '✕') : letter}</span>
        <span style={{ ...body, fontSize: 38, color: 'var(--color-ink)' }}>{text}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 140, top: 140, width: 860, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={kicker}>Quick check</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 700, margin: 0, lineHeight: 1.15, opacity: fade(f, s(0.4)) }}>A possible evening star's middle candle has a medium body overlapping the first. What is it?</h2>
          {f >= think && !shown && (
            <svg viewBox="0 0 100 100" style={{ width: 84, flexShrink: 0 }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--color-line)" strokeWidth={10} />
              <circle cx={50} cy={50} r={40} fill="none" stroke={ACCENT} strokeWidth={10} strokeDasharray={`${ring * 251} 251`} transform="rotate(-90 50 50)" />
            </svg>
          )}
        </div>
        {option('A', 'A very strong evening star', false, at(0.45))}
        {option('B', 'Three ordinary candles', true, at(0.55))}
        <div style={{ ...body, fontSize: 34, opacity: fade(f, reveal + s(2)) }}>Without a genuine stall in the middle, the pattern loses its meaning.</div>
      </div>
      {shown && (
        <AbsoluteFill style={{ opacity: fade(f, reveal, s(0.6)) }}>
          <CornerTag label={ILLUSTRATION} />
          <CinematicChart cam={view(d.ES_LAZY, 3.4, 8.7, 0.14)} bars={d.ES_LAZY} lines={[]} head={false} maxBody={50} draw={upto(8, d.ES_LAZY.length)} plot={{ left: 1100, right: 1700, top: 300, bottom: 820 }} outlines={[{ from: 7, to: 7, color: DOWN, opacity: 1 }]} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- end

export function EndCinematic() {
  return <PractiseEnd bars={d.MS} action="Spot them in the pattern trainer." checks={['The trend before?', 'A small star?', 'A deep third candle?']} link="nitoratrading.com/trainer" />;
}
