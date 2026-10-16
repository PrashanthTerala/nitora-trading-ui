# Pilot review: Moving Average Crossovers (English, Telugu, Spanish)

Status: English **approved** (2026-10-15). Telugu and Spanish **drafts, awaiting review**, each including a native speaker's. Not published. Nothing on the site links to it.

| | |
|---|---|
| Lesson | `m05-indicators/03-ma-crossovers` (sha256 `ee3bb999…96d5`, after the wording fixes below) |
| Video | `video/out/ma-crossovers-en.mp4` (not committed): 3 min 49 s, 1920×1080 H.264 + AAC, 20 MB, rendered in 11 min 55 s on this PC |
| Soundtrack | 213.6 s of narration. The only silences over 1.2 s are the ten ~1.5 s gaps between scenes (measured with ffmpeg silencedetect), so the per-language timing leaves no dead air |
| Script | `video/narration/ma-crossovers.json`: 11 scenes, each citing its lesson lines |
| Voice | Piper `en_US-ljspeech-high` (LJ Speech, public domain), local, no cost |
| Charts | Synthetic only. Every chart value comes from `src/engine/market/indicators.ts`, via `video/src/ma-crossovers/data.ts` |
| Famous pair | 50/200 **SMA**, as the lesson defines it (your decision) |

## Lesson changes made before scripting

These are in `src/content/`. They are uncommitted, and nothing has been deployed.

1. "Tested more than any other idea in trading" was unsourced. It now says the rule is simple, "so it is easy to test", and "The mechanics tell a clear story" replaces "That testing tells a clear story".
2. "A handful of times per decade" contradicted "roughly one or two" a year. Both now say the 50/200 cross "fires far less often than any faster pair, sometimes with years between one cross and the next". The table column is now "How often it signals": Most often, Less often, Least often.
3. "Win rate, sometimes under 40%" was unsourced. It is replaced by "Expect more losing trades than winning ones, with a few large winners doing all the work". "Tested over long periods ... often makes money" is replaced by "On a market that trends, this crude rule can make money ... On a market that ranges, it bleeds."
4. "Most people abandon it" now reads "many people abandon it, sometimes right before the big trade".
5. `prerequisites: ['m05-indicators/02-moving-averages']` is added in `curriculum.ts`.

Site checks after the change:
- `lint:content`: all 128 lessons valid.
- `tsc -b`: clean.
- `test-decks`: every deck builds.
- `test-engine`: 210 passed.
- `lint-tokens`: OK.

## Numbers on screen, all computed

| Shown | Value | From |
|---|---|---|
| Golden cross | bar 331 | `crosses(sma50, sma200)` |
| Death cross | bar 602 | same |
| Bars after the low | 60 (low 80.27, cross close 91.18) | lowest close before the golden cross |
| Bars after the high | 53 (high 128.92, cross close 108.75) | highest close between the crosses |
| Fast pair crosses | 12 (9/21 EMA, on the shown window) | `crosses(ema9, ema21)` |
| Slow pair crosses | 2 (also spoken: "only twice") | checked by `scripts/check.mjs` |
| Whipsaw crosses | 8 (9/21 EMA on the site's `range` regime) | the same logic as the lesson's own figure |

The worked example (100.4 − 100.9 = −0.5, then 101.3 − 101.0 = +0.3) is the lesson's own, taken from its math callout.

## What to check when you watch it

- [ ] **Accuracy:** does every sentence match the lesson? The script cites its line numbers.
- [ ] **Pronunciation:** "minus zero point five", "two-hundred-day", "exponential averages", "whipsaw".
- [ ] **Pace:** a scene whose visuals run ahead of or behind the voice.
- [ ] **Readability:** chart labels at phone size.
- [ ] **Risk:** the whipsaw warning and the closing "not financial advice" card are both present.
- [ ] **Overall:** is the style right for the academy before it is repeated for 127 more lessons?

## Telugu

| | |
|---|---|
| Video | `video/out/ma-crossovers-te.mp4` (not committed): 4 min 49 s, 1920×1080, 24 MB. Second version: the friendly, conversational script |
| Voice | Piper `te_IN-venkatesh-medium` (IndicVoices-R, CC BY 4.0: credit the dataset) |
| Script | `te` in `video/narration/ma-crossovers.json`: spoken, conversational Telugu, as a friend would explain it, with the English trading terms in Telugu script. On-screen text stays English. The first, formal version was replaced on request |
| Delivery | Each sentence is spoken separately, with 0.32 s after '.' and 0.5 s after '?'. Piper's variation settings are raised slightly (noiseScale 0.75, noiseW 0.9). The four versions compared are in `video/out/telugu-natural/` |
| Timing | Its own: 273.8 s of narration (en: 213.6 s). The only pauses over 1.2 s are the ten scene gaps, and none is over 2.5 s |

What a native reviewer should check:
- Is the translation faithful to the English script, scene by scene? Nothing should be added or dropped.
- Are the terms right? For example ఫాస్ట్ యావరేజ్, గోల్డెన్ క్రాస్, విప్‌సా, ఎక్స్‌పోనెన్షియల్ యావరేజెస్, చాప్ మార్కెట్.
- Are the numbers read correctly? "మైనస్ సున్నా పాయింట్ ఐదు", "ప్లస్ సున్నా పాయింట్ మూడు", "యాభై", "రెండు వందల", "రెండుసార్లు".
- Does the voice sound natural, and is the pace right?

`scripts/check.mjs` confirms the Telugu script has every scene. It cannot check that the Telugu wording says the computed number ("రెండుసార్లు" = 2). That is for the reviewer.

## Spanish (es-419)

| | |
|---|---|
| Video | `video/out/ma-crossovers-es.mp4` (not committed): 4 min 22 s, 1920×1080, 22 MB, rendered in 13 min 29 s |
| Voice | Piper `es_MX-ald-medium`: an Unlicense dataset, fine-tuned from the CC0 `es_ES-davefx` voice. `es_MX-claude-high` was rejected because its card names no dataset |
| Script | `es` in `video/narration/ma-crossovers.json`: Latin American Spanish, informal "tú", standard terms (cruce dorado, cruce de la muerte, media móvil simple); "whipsaw" and "stop" kept in English; decimals read with "punto". On-screen text stays in English |
| Timing | Its own: 246.2 s of narration. The only pauses over 1.2 s are the ten scene gaps, and none is over 2.5 s |
| Comparison | `video/out/spanish-samples/`: the whipsaw scene in both voices (ald 29.4 s, claude 30.9 s) |

What a native reviewer should check:
- Is the translation faithful, and natural for a Latin American audience rather than Spain?
- How is "whipsaw" pronounced? A Spanish voice reads English words its own way.
- Are the numbers read correctly? "menos cero punto cinco", "veintiún períodos", "solo dos veces".

## Not done yet (by design: stop here for review)

- Hindi script and render: needs a paid voice, so an Azure or Google account from you.
- Native-speaker review for Telugu and Spanish.
- Any paid TTS trial: this needs accounts you create.
- The Remotion licence tier: still needs your answer on ownership and headcount.
- Website integration: needs a separate authorisation.
