# Cinematic upgrade V3: proof of concept

Date: 2026-10-16. Branch: `video-production`, uncommitted.

- **Lesson:** `m05-indicators/03-ma-crossovers`, the same lesson, script v2, narration and data as the v2 videos.
- **Scope:** the first four scenes, in four languages. This is not a full lesson.
- **Not touched:** the website. Nothing has been published.

## 1. Audit: what was kept, what changed

| Existing part | Decision | Why |
|---|---|---|
| `kit.tsx` per-language timing, `useMark` markers, `LessonVideo` | **Kept, extended** | Already meets "align animation to each language's measured narration". Added per-scene `fadeIn`/`fadeOut`/`bleed` options, so one camera move can run across a cut, and an on-screen-text language that defaults to English |
| `narration/ma-crossovers.json` (v2 script, 4 languages) | **Kept** | Added three markers (`golden`, `death`, `missed`) so the camera lands on each cross as it's spoken. Only those two scenes were re-spoken |
| `narrate.py`, `google_tts.py`, `check.mjs`, `package.py`, `qa.py` | **Kept** | `package.py` gained `--cut` to publish a subset of scenes with correctly timed captions |
| `ma-crossovers/data.ts` (engine-computed values) | **Kept** | The single source for every number in both versions |
| `Average` (worked example) and `Ship` | **Kept** | Reused unchanged in the POC |
| `CandleSvg` chart, in boxed panels | **Replaced in the POC by `CinematicChart`** | The boxed site chart can't do camera moves or 30 px+ labels at full frame. Incremental changes to a site component wouldn't get there |
| Blender tooling | **Retired from production** | By your decision. The files remain, unused |
| v2 videos (all 4 languages) | **Kept, unchanged** | `out/publish/…/v2/` |

## 2. Tools: evaluated, used, rejected

| Tool | Status | Evidence and reason |
|---|---|---|
| **Remotion 4.0.535** | **Used**: master timeline | Already in place. Every frame is a function of the frame number |
| **`@remotion/gsap` + GSAP 3.15.0** | **Used**: intro typography only | `useGsapTimeline` builds a paused timeline and seeks it to the frame (Remotion docs). **Tested:** frame 75 rendered twice in separate runs is pixel-identical (maximum difference 0). Gives word-staggered blur-up type with overlapping eases in about 6 lines. Words are split by hand, not with SplitText, which would break Telugu and Devanagari letter clusters. Licence: GSAP Standard "no charge" |
| **`@remotion/three` / React Three Fiber** | Not used | You rejected the 3D look. A 2D camera over the exact chart teaches better and stays accurate. Keep it for genuinely spatial topics (order-book depth, portfolio structure), each by separate proposal |
| **Motion Canvas** | Not used | npm has no `@remotion/motion-canvas`, so it would be a separate renderer. Remotion SVG already draws these illustrations precisely |
| **Rive** (`@remotion/rive` exists) | Not used | No designed Rive assets exist yet, and authoring needs the Rive editor. Revisit for a mascot or icon set |
| **Anime.js** | Not used | Nothing it adds over Remotion with GSAP |
| **Satori** | Not used | Remotion renders still frames (posters, thumbnails) itself, so it would be a redundant dependency |
| **`@remotion/transitions`** | Not used | `TransitionSeries` overlaps scenes, which shortens the timeline and would break the caption timing. Continuous camera moves between scenes do the job better here |
| **Noto Sans Telugu / Devanagari** (`@fontsource`, SIL OFL) | Installed, loaded | On-screen text is **English in every language, by your decision (2026-10-16)**. The fonts and a localised label catalogue (`cinematic/strings.ts`) are ready but switched off |
| **FFmpeg** (Remotion's build) | **Used** | Loudness, packaging and QA (`qa.py`, `package.py`) |

## 3. Each scene: technology and reason

| Scene | Built with | What it teaches, and why this way |
|---|---|---|
| **title** (`CinematicIntro`) | GSAP via `@remotion/gsap`, plus `CinematicChart` defocused behind | The lesson's own chart draws itself out of focus while the title lands word by word. It sets the subject without inventing imagery |
| **average** (`Average`) | Remotion springs and SVG, unchanged from v2 | The checked sum (6+8+7+9+10 = 40, ÷5 = 8) and the sliding window |
| **golden** (`GoldenCinematic`) | Remotion + `CinematicChart` camera | The full series draws itself, then the camera finds the golden cross *as the voice says "golden cross"*, then the death cross, then pulls back. Markers sit on the engine's crossing bars |
| **lag** (`LagCinematic`) | Same chart, no cut from the previous scene | The waiting is shaded (60 bars after the low), and the price missed (80.27 → 91.18) and given back (128.92 → 108.75) are drawn as arrows on the chart. All values computed |

**Accuracy measures in `CinematicChart`:**
- The camera only selects which part of the data is shown.
- Axis ticks are recomputed for every frame's view.
- Every plotted value comes from `src/engine/market/indicators.ts`, via `data.ts`.
- `scripts/check.mjs` still passes, including the 3 computed numbers.

## 3a. Changes after your review (2026-10-16)

- **On-screen text is English in every language.** Narration and captions stay localised.
- **Candlesticks, not a price line.** `CinematicChart` draws OHLC candles from the engine's bars. The 50/200 SMAs stay as lines over them.
- **No layer hides another.**
  - The plot holds only data: candles, averages, cross markers and arrows.
  - Every text label sits in a band under the plot, laid out by `placeLabels()`. It uses up to two rows, keeps the "synthetic data" tag's space free, and centres each label on its point where it can.
  - A label that fits nowhere **stops the render with an error**, instead of being drawn over other text. This caught a real case in Telugu at the ship shot, which is now fixed.
  - Marker pills sit above the local candle highs, with a leader line.
  - The ship card no longer covers the chart: the plot shrinks upward to make room.
- **Zoom and highlights.**
  - Labels follow the camera: each one shows while its part of the chart is in focus, and the two price changes return for the summary shot.
  - A spotlight dims the plot away from the cross or arrow being discussed. It dims only the plot, never the text.
  - Headline key terms ("Golden cross", "Death cross") are coloured, with a sweeping underline.
  - New labels pop in.
- **Checked:** review stills at every timing marker in **all four languages** (`video/out/qa/cine-{en,te,hi,es}/sheet.jpg`). No overlaps.

## 4. Results (measured)

| Language | Length | Render time | Loudness | Captions | QA |
|---|---|---|---|---|---|
| English | 1:55 | 6 min 6 s | −16.0 LUFS | ✓ | passes every check (narration slowed with sentence breaths, owner's review) |
| Telugu | 2:27 | 8 min 25 s | −16.1 LUFS | ✓ | passes every check |
| Hindi | 1:48 | 5 min 36 s | −16.1 LUFS | ✓ | 1 flag: the intentional 3.3 s silent title hold |
| Spanish | 1:54 | 5 min 56 s | −16.0 LUFS | ✓ | 1 flag: the intentional 2.8 s silent title hold |

- **Before and after:** `video/out/qa/before-after-v2-v3.jpg`, the same three moments in v2 and v3.
- **Determinism:** the GSAP intro rendered twice is pixel-identical (see §2).
- **Cost:**
  - no paid services;
  - Google TTS for the re-spoken scenes is within the free tier: 25,140 of the free 1,000,000 characters this month, for all Telugu and Hindi work so far;
  - render time is the only cost.

## 5. Known defects and limits

1. **Silence under the title (Hindi, Spanish):** about 3 s with no voice while the type completes. The QA silence check flags it. A licensed, subtle music bed would fill it, but that is not sourced yet.
2. **Localisation not reviewed:** the te/hi/es narration still needs native review. On-screen text is English everywhere, by decision.
3. **Proof of concept only:** 4 of 14 scenes. The other scenes still use the v2 boxed charts.
4. **Phone sizes not checked in a real player:** chart labels are 30–32 px at 1080p, but they haven't been checked at actual phone size.

## 6. Decision

**AWAITING_HUMAN_APPROVAL.** The proof of concept works technically: it is deterministic, synced per language, accurate and passes QA apart from the intended title hold. Whether the look meets the "world-class" bar is your call. If approved, the next step is to give the remaining 10 scenes the same treatment, then re-render all four languages and compare them against v2.
