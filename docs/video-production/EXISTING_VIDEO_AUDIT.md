# Existing video audit (directive V2.0, Phase 0)

Date: 2026-10-15. Branch: `video-production`, created from `master` at e819297. All the video
work is still uncommitted. Nothing is published, and the website references no video: a search
of `src/` for `.mp4`, `<video`, YouTube and Vimeo found nothing.

Status words follow the directive: PRESERVE, IMPROVE, REFACTOR, REBUILD, BLOCKED.

Evidence comes from three sources:
- **Measured:** `video/scripts/qa.py`, which writes JSON to `video/out/qa/`.
- **Inspected:** contact sheets and stills that I looked at.
- **Read:** source files.

I cannot listen to audio. Every judgement about how something sounds is marked **needs a human ear**.

## 1. What exists

| Area | Location | Notes |
|---|---|---|
| Video package | `video/` (own `package.json`) | Remotion **4.0.535**, React 19.3. Not part of the site build |
| Shared kit | `video/src/kit.tsx`, `theme.tsx`, `tokens-source.ts`, `remotion.config.ts` | Per-language timing, scene frame, house style; site tokens via the site's own parser; `@/` aliases the site's `src/` |
| Compositions | `video/src/MaCrossovers.tsx` (+ `ma-crossovers/data.ts`), `video/src/Engulfing.tsx`, `video/src/Root.tsx` | `ma-crossovers-{en,te,es}`, `engulfing-{en,te}` |
| Scripts | `video/narration/ma-crossovers.json`, `video/narration/engulfing.json` | Per-scene narration per language. The pilot's script records its source lesson's sha256 and the lines each scene cites |
| Tools | `video/scripts/narrate.py` (Piper), `google_tts.py` (Google Cloud TTS, with a usage cap), `check.mjs` (script against lesson and engine), `inventory.mjs`, `qa.py` (new) | |
| Rendered videos | `video/out/*.mp4` | 5 files, git-ignored |
| Voice samples | `video/out/telugu-samples/`, `telugu-natural/`, `spanish-samples/` | |
| Subtitles | none | No `.vtt` or `.srt` anywhere |
| Thumbnails | none | |
| Fonts | site `public/fonts/` | Inter, Geist and JetBrains Mono, **Latin only** |
| Docs | `docs/video-production/` | `PHASE0_REPORT.md`, `CURRICULUM_INVENTORY.md`, `PILOT_REVIEW.md` |
| Blender | none before this audit | Blender 5.2.2 LTS portable is now in `video/.blender/` (git-ignored), installed with your approval |

Hardware, measured:
- **CPU:** Intel i5-12500H (16 threads).
- **Memory:** 15.6 GB RAM.
- **GPU:** Intel Iris Xe, with **no dedicated GPU**.
- **Disk:** 15.2 GB free on C: before Blender; Blender takes 0.9 GB. Disk space is the tightest resource for 3D frame sequences.

## 2. Every rendered video

All of them measure 1920×1080, 30 fps and H.264, with **no black frames**, **no clipping** and **no silence over 2.5 s**.

| Video | Duration | Size | Audio | Loudness / true peak | Language tag | Subtitles |
|---|---|---|---|---|---|---|
| `engulfing.mp4` | 81.0 s | 3.5 MB | **none** (silent first prototype) | – | – | none |
| `engulfing-narrated.mp4` | 131.2 s | 9.3 MB | AAC 48 kHz stereo, en, Piper **lessac** | −16.7 LUFS / −3.0 dBTP | **und** | none |
| `ma-crossovers-en.mp4` | 229.0 s | 20.0 MB | en, Piper ljspeech | −17.5 / −2.7 | **und** | none |
| `ma-crossovers-te.mp4` | 289.2 s | 24.1 MB | te, Piper venkatesh (friendly script, v2) | −17.0 / −3.0 | **und** | none |
| `ma-crossovers-es.mp4` | 261.6 s | 22.4 MB | es, Piper es_MX ald | −15.2 / −3.0 | **und** | none |

### Per-video records

**m05-indicators/03-ma-crossovers: Moving Average Crossovers** (en, te, es)

- **Source:** `video/src/MaCrossovers.tsx`, `video/src/ma-crossovers/data.ts`, `video/narration/ma-crossovers.json`. Rendered with Remotion 2D only.
- **Chart accuracy: good.**
  - Every number on screen is computed by `src/engine/market/indicators.ts`, on a deterministic synthetic series.
  - The one spoken number, "only twice", is checked against the engine by `check.mjs`. I confirmed the check fails when the number is wrong.
  - The 50/200 pair is **SMA**, matching the lesson after its wording fix.
  - The 9/21 EMA appears only as the "fast pair" contrast and in the lesson's own whipsaw figure.
- **Educational completeness: good, with one gap.** The video has hook, intuition, construction (sign change), example (golden and death cross on the chart), lag, trade-off, uses, whipsaw (the lesson's danger callout), structure, recap and call to action. It has **no worked risk example with numbers** (directive §12 scene 6), because the lesson itself has none: it points to the risk-management module. Adding numbers means taking them from that module, not inventing them.
- **Animation quality: competent but plain.** Clip-path chart reveals, rising text and counters. Several scenes leave half the frame empty, and the look is closer to well-made slides than to a documentary.
- **Text readability: fails on phones.**
  - Titles (52–72 px) and body text (34–46 px) are fine on desktop.
  - Chart labels, legends and axis numbers render at about **20 px** in the 1080p frame (CandleSvg's 11-unit text, scaled about 2×).
  - Tags and the disclaimer are 26 px.
  - On a phone in portrait, where the video is about 390 px wide, 20 px becomes about 4 px, which is unreadable. Even full-screen in landscape it is about 8 px.
- **Brand consistency: good.** The site's own tokens, fonts and chart palette, with an end card carrying the "synthetic data, not financial advice" line.
- **Audio.** Loudness is within the −20 to −13 LUFS speech range, and true peak is at most −2.7 dBTP. The three languages differ by up to 2.3 LU (es −15.2, en −17.5), so they should be normalised to one target. How natural the voices sound **needs a human ear**:
  - **English:** approved by you on 2026-10-15.
  - **Telugu:** v2 friendly script. You're still comparing Piper and Google voices.
  - **Spanish:** not yet reviewed.
- **Localization.** te and es are machine-written translations, **awaiting native review**. On-screen text stays English in every language, by your choice.
- **Reusability: high.** The kit, `RevealChart`, `BlenderSequence`, the data module and the narration and check pipeline.
- **Status:** en **IMPROVE**; te **IMPROVE**, pending a voice decision and native review; es **IMPROVE**, pending native review.

**m02-candlestick-patterns/06-engulfing: Bullish and Bearish Engulfing** (prototype)

- **Source:** `video/src/Engulfing.tsx`, `video/narration/engulfing.json`. Remotion 2D only.
- **Chart accuracy:** the lesson's own pattern data, drawn by the site's `CandleSvg`.
- **`engulfing.mp4`:** silent, made before narration existed. **Superseded**: never publish.
- **`engulfing-narrated.mp4`: REBUILD the render.**
  - It is narrated with Piper **en_US-lessac**, whose dataset licence is **research only**. It is not usable for a public academy.
  - It was rendered on the old shared timeline.

  The source has already been fixed. The composition now uses the per-language kit, and the script is now set to ljspeech, but a new MP4 hasn't been rendered yet. So rebuilding is a cheap re-render of good source, not rework.
- **Readability:** the same phone problem as above. Chart labels are tiny, and the pattern panels use about a third of the frame.
- **Telugu:** narration exists (venkatesh, formal script); no Telugu video has been rendered.
- **Status:** composition **IMPROVE**; existing MP4s **REBUILD** (re-render).

## 3. Components

| Component | Status | Reason |
|---|---|---|
| `kit.tsx` per-language timing (`timeline`, `usePace`, `LessonVideo`) | **PRESERVE** | Meets directive §9.4: each language is timed to its own narration, scenes stretch instead of truncating, and the order of events is kept. Measured: no silence over 2.5 s in any language |
| `kit.tsx` house style (`Rise`, `TitleCard`, `Takeaways`, `Danger`, `EndCard`) | **IMPROVE** | Needs a phone type scale, captions and more varied layouts |
| `theme.tsx` + tokens loader | **PRESERVE** | One source of colour truth with the site |
| `CandleSvg` (site component) used in video | **IMPROVE** | Needs a text-scale option for video. That's a small, backward-compatible change to a site file, so it needs your approval |
| `ma-crossovers/data.ts` | **PRESERVE** | Engine-computed values, used by both Remotion and Blender (via `scripts/scene-data.ts`) |
| `narrate.py` | **IMPROVE** | Works for Piper (with sentence pauses). Needs a provider adapter for Google, since `google_tts.py` exists but isn't wired in, and a per-language pronunciation lexicon |
| `check.mjs` | **PRESERVE / IMPROVE** | Checks source drift, cited lines, scene coverage and computed numbers. It can't yet check numbers spoken in te or es |
| `inventory.mjs`, `CURRICULUM_INVENTORY.md`, `manifests/curriculum.json` | **PRESERVE** | |
| `qa.py` (new) | new | Technical QA for directive §16. Built for Remotion's minimal ffmpeg, which has no fps or rawvideo support. Fails loudly when it gets no frames |
| Remotion public dir | **REFACTOR (done)** | It was the site's `public/`, which generated media can't be written into. It's now `video/public/`, synced from the site by `scripts/sync-public.mjs` |

## 4. Defects, ranked

1. **No subtitles** for any video. This is a release blocker under directive §16 and §17.
2. **Chart text unreadable on phones.** About 20 px chart labels in the 1080p frame. A release blocker under "mobile readability is mandatory".
3. **The English engulfing MP4 uses a research-only voice.** Licence blocker. Re-render it; never publish the old file.
4. **Audio language tag is `und`** on every file.
5. **Loudness differs between languages** by up to 2.3 LU. Normalise to −16 LUFS.
6. **No Telugu or Devanagari font.** Not a problem while on-screen text is English, but it blocks Hindi or Telugu captions.
7. **Localization not reviewed** by native speakers (te, es). Hindi doesn't exist yet: no usable free voice, see `PHASE0_REPORT.md` §6.
8. **Visual craft:** empty half-frames and slide-like scenes; the opening has no establishing shot.
9. **Engine tests** cover only SMA, EMA, RSI and Bollinger (`tools/test-engine.mjs`). MACD, ATR, VWAP and others need tests before any video uses them.

## 5. Preservation plan

- **No file is overwritten.** The current MP4s stay as they are. New renders go to new names, e.g. `out/v2/ma-crossovers-en.mp4`.
- **What stays unchanged:** the per-language timing, theme pipeline, data module, check, inventory and the approved English script.
- **The lesson text** (`03-ma-crossovers.mdx`) keeps the wording fixes you approved. No further curriculum edits without approval.
- **The website:** no change, and no deploy.

## 6. Where Blender helps, and where it doesn't

Measured on the proof of concept in `HYBRID_VIDEO_ARCHITECTURE.md`:
- **Use Blender for:** a short establishing shot per lesson or module, chapter transitions, and abstract concepts where depth adds meaning (e.g. liquidity depth, a portfolio's parts). These are language-independent, so render once and reuse in all four languages.
- **Keep in Remotion:** every exact chart, formula, number, annotation, caption and recap. That is most of each lesson.
