# Hybrid Blender + Remotion architecture (directive V2.0, Phases 0–1)

> **Decision, 2026-10-15 (owner):** the opening's look was rejected, so production continues in
> **Remotion only**. Blender is now **opt-in, per scene**:
> - I propose it only where a scene genuinely benefits (§2's four tests).
> - Each proposal comes with rendered design stills.
> - Nothing is built until the owner approves it.
>
> The Blender tooling (`video/blender/render.py`, `scene-data.*`, `BlenderSequence`) stays in
> place, unused by any lesson, so an approved proposal costs no rework. The POC
> (`poc-hybrid-intro`) is kept for reference only.
>
> **Narration:**
> - **Telugu and Hindi:** Google Cloud TTS Chirp 3 HD **Achird**, chosen by ear.
> - **English:** Piper LJSpeech.
> - **Spanish:** Piper ald.
>
> **Captions** are separate tracks (`.vtt` and `.srt`), off by default, so viewers can turn them on and off in the web player.

Status: **proof of concept rendered and inspected**; the architecture is a proposal for approval.
Read `EXISTING_VIDEO_AUDIT.md` first.

Labels:
- **MEASURED:** run on this PC (i5-12500H, Iris Xe, no dedicated GPU).
- **ESTIMATE:** a formula from the measurements.

## 1. The shape of it

```
src/content/**.mdx  (authoritative lesson, sha256-pinned)
      │
      ├─ narration/<video>.json      script per language: scene → passage, cited lesson lines,
      │                              computed numbers                (check.mjs gates drift)
      ├─ src/<video>/data.ts         every chart value, from src/engine/market/indicators.ts
      │        │
      │        └─ scripts/scene-data.mjs → build/<video>.json + build/brand.json
      │                                     (same numbers, site colours in linear RGB)
      │                                              │
      │                                              ▼
      │                           blender/render.py  (script-only scenes, deterministic)
      │                                     → public/blender/<scene>/<take>/0001.png…
      │                                       + render-log.json (per-frame seconds)
      ▼                                              │
Remotion master timeline (src/kit.tsx: per-language scene timing from each language's audio)
      │  REMOTION_2D scenes: exact charts, formulas, callouts, captions
      │  BLENDER_3D / HYBRID scenes: <BlenderSequence dir=…> plays the PNG sequence frame-for-frame
      ▼
out/v2/<video>-<lang>.mp4  →  scripts/qa.py (probe, loudness, clipping, silence, black frames,
                                             subtitles; JSON + contact sheet)  →  human review
```

Decisions:
- **Remotion owns the master timeline.** It already does per-language timing well; the audit marks it PRESERVE.
- **Blender only renders.** It never decides timing. A Blender shot has a fixed length and is the same in every language, so render it once and reuse it in all four.
- **One source of numbers and colours.** `data.ts` and `tokens.css` feed both engines. Blender reads the engine's values through `scene-data.mjs` and never computes its own.
- **Generated media lives in `video/public/`**, which is git-ignored. Site assets are copied there by `sync-public.mjs`, so the site's `public/` is never written to.

## 2. Choosing an engine per scene

Blender is used for a scene only if all four hold:
1. Depth or camera movement adds meaning or context, not just decoration.
2. No exact value has to be read from the 3D image.
3. The shot is the same in every language: text goes on top in Remotion.
4. It can be reused, for example per module or as a recurring transition.

Otherwise the scene is `REMOTION_2D`. If both are needed, it's `HYBRID_COMPOSITE`: Blender sets the context, then the Remotion chart takes over with the same data.

### Pilot (m05-indicators/03-ma-crossovers), per scene

| Scene | Mode | Why |
|---|---|---|
| title | **HYBRID_COMPOSITE** (built as the POC) | The data landscape sets the context. The question is Remotion text. It hands over to the exact 2D chart |
| race (runners analogy) | REMOTION_2D | A simple metaphor; 3D adds nothing |
| signchange (worked example) | REMOTION_2D | Numbers must be exact and readable |
| golden (50/200 SMA chart) | REMOTION_2D | The exact chart; target of the Blender handover |
| lag | REMOTION_2D | Measured brackets on the chart |
| tradeoff | REMOTION_2D | Counts computed by the engine |
| uses | REMOTION_2D | Text cards; needs a layout rethink (see audit §4.8) |
| whipsaw (danger) | REMOTION_2D | The lesson's own figure |
| structure | REMOTION_2D | Checklist |
| takeaways | REMOTION_2D (optional reusable Blender backdrop) | Low value; do last |
| end / comprehension question | REMOTION_2D | Should use one of the lesson's existing quiz questions (directive §11 G) |
| risk example with numbers (directive §12 scene 6) | **BLOCKED on content** | The lesson has no position-sizing numbers; it points to module 7. They must come from that module's verified examples, not be invented |

Blender is a good fit beyond this pilot for:
- **One establishing shot per module.** 13 shots, reused by every lesson and language.
- **One branded chapter transition**, reused across the curriculum.
- **Concepts with real spatial structure,** such as order-book depth (liquidity), portfolio parts and a volatility surface.

Not candidates: indicator construction, formulas, risk arithmetic, tables, quizzes.

## 3. Proof of concept: what was built and measured

| File | What it is |
|---|---|
| `video/blender/render.py` | Script-driven Blender renderer. The `data_landscape` scene builds the pilot's 441-bar synthetic series as columns, the 50/200 SMA as emissive lines in the chart's colours, a ring at the golden cross, a two-light rig and an eased camera move with depth of field. Takes resolution, frames, fps, samples, engine (eevee or cycles), `--transparent` and `--only` (single still). Writes a per-frame log |
| `video/scripts/scene-data.ts` / `.mjs` | Exports `build/brand.json` (12 site colours: oklch to linear sRGB via OKLab) and `build/ma-crossovers.json` (closes, sma50, sma200 and cross indices from the engine) |
| `video/scripts/sync-public.mjs`, `remotion.config.ts` | `video/public/` as the public dir |
| `video/src/HybridIntro.tsx` (`poc-hybrid-intro`) | `BlenderSequence` plus the question overlay, a scrim, then a crossfade to the existing `RevealChart`. 8 s, silent |
| `video/scripts/qa.py` | Technical QA |
| `video/out/v2/poc-hybrid-intro.mp4` | The render: 1920×1080, 30 fps, 8.0 s, 4.0 MB, no black frames. It's silent, so the audio and subtitle checks fail by design |

**MEASURED results:**
- **Frame accuracy.** Remotion frame 30 matches Blender frame 31 (`0031.png`), exactly as designed: mean absolute difference 2.6 against 26–30 for the neighbouring frames, in an exact Remotion still. The **encoded MP4** also matches, decoded from the start without seeking: 3.1 against 27–30.
  - Note: seeking with `-ss` in Remotion's minimal ffmpeg lands **one frame late**. Exact checks must decode from the start.
- **Colour match.** Blender uses the site's `chart-2` orange (SMA 50), `chart-1` blue (SMA 200) and `up` green, in the "Standard" view transform. Inspected: they match the 2D chart. The first take used strong emission, which washed the lines to near-white. That is corrected, and the emission is now kept low by design.
- **Readability over 3D.** A top scrim (92% to 70% page colour) under the question, and a filled pill for the "Synthetic data, for teaching" label. Inspected at 1080p: readable. In the first take, the two headings overlapped during the crossfade; now the question fades out before the crossfade starts.
- **Transparency.** `--transparent` writes RGBA PNGs: 27.2% fully transparent, 72.1% opaque, 0.7% partial (anti-aliased edges). Chrome composites PNG alpha natively, so no video codec is needed for alpha. Compositing a transparent sequence in Remotion is **not yet tested end to end**.
- **Render time:**

  | Engine, size, samples | Per frame | 150 frames (5 s) |
  |---|---|---|
  | Eevee 960×540, 8 | 0.68 s median, 1.45 s first (shader compile) | 104 s, MEASURED |
  | Eevee 1920×1080, 16 | 3.0–3.4 s (single-frame runs, compile included) | ESTIMATE 6–8 min |
  | Cycles CPU 960×540, 32 | 18.3 s | ESTIMATE ~46 min at 540p; about 3 h at 1080p |

  **Decision: Eevee.** Cycles on this CPU costs about 27× more for this kind of scene, with no teaching benefit.
- **Disk.** About 0.54 MB per 540p frame and 2.0 MB per 1080p frame (PNG). A 5 s 1080p shot is about 300 MB.
  - With 13 module shots that's about 4 GB, against **about 14 GB free**.
  - So keep only approved takes, and delete PNGs once encoded to a lossless intermediate. Choosing that intermediate needs a test: Remotion's ffmpeg has no ProRes, so the candidates are FFV1 in Matroska, or keeping the PNGs.
- **Remotion render.** The 8 s POC took 36 s.

**Remaining defects in the POC:**
- **Preview quality.** The Blender frames are 960×540 scaled up, so they look soft. Final takes should render at 1080p only after you approve the look.
- **No match cut.** The 3D camera ends with the cross centred, while the 2D chart has it at the left third. The final camera move should end on the 2D chart's framing.
- **Line behind the title.** In the first second the blue line passes behind the title. It's readable with the scrim, but the camera start can be lowered.
- **Silent.** The POC has no narration; it reuses no audio.

## 4. Cost

- **Blender and Remotion:** $0. Render time ESTIMATE:
  - per language-independent 5 s Blender shot: about 7 min at 1080p;
  - per Remotion lesson video: about 3.2× real time (MEASURED 229 s → 11 min 55 s).
- **Narration:**
  - Piper: $0.
  - Google Chirp 3 HD: within the 1 million free characters a month, enforced by `google_tts.py`.
  - Gemini TTS: needs the Vertex AI API enabled, which you haven't authorised, and would come from the trial credit.

  Detail and prices: `PHASE0_REPORT.md` §8 and this session's notes.
- **The real cost is review:** native speakers for te, hi and es, and a financial reviewer.

## 5. Quality gate (directive §17)

These are **provisional scores from the production agent, not an independent review**. They exist to show where the gaps are.

| Video | Accuracy /25 | Clarity /20 | Craft /20 | Audio /15 | Localization /10 | Technical /10 | Blockers |
|---|---|---|---|---|---|---|---|
| ma-crossovers-en | 22 | 16 | 12 | 11 (approved by ear) | n/a: 10 | 5 | no subtitles; phone readability |
| ma-crossovers-te | 22 | 16 | 12 | needs a human ear | awaiting native review | 5 | the above, plus voice not chosen and native review |
| ma-crossovers-es | 22 | 16 | 12 | needs a human ear | awaiting native review | 5 | the above, plus native review |

None reaches 90, and all have release blockers. **Decision: NEEDS_CORRECTION** (pilot); localization **AWAITING_HUMAN_APPROVAL**.

## 6. Next task: Pilot v2, English, with acceptance criteria

1. **Captions.** Generate `ma-crossovers-en.vtt` and `.srt` from the script, timed from the per-sentence synthesis that `narrate.py` already does. Accept when `qa.py` finds them and every cue sits within its scene.
2. **Phone readability.** Chart text in video must be at least 40 px at 1080p, so at least about 8 px at 390 px phone width. That needs either a `textScale` option on the site's `CandleSvg` (a small, backward-compatible site change, **needs your approval**) or chart labels drawn by Remotion. Accept when checked at phone width.
3. **Blender intro, final.** Camera move ending on the 2D framing (match cut), 1080p at 16 samples, then QA.
4. **Audio.** Normalise to −16 LUFS ±1. Tag the audio language (`eng`, `tel`, `spa`) with a stream-copy remux. Accept when `qa.py` passes every check.
5. **Comprehension question.** One of the lesson's 5 existing quiz questions as the end scene.
6. Re-render to `out/v2/ma-crossovers-en.mp4`, a new path that leaves the approved v1 untouched. Run `qa.py` and `check.mjs`, compare v1 and v2 side by side (contact sheets), then stop for your review.

Te, es, hi and batch production come after that, each on its own approval.
