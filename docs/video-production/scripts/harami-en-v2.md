# Harami and Harami Cross: English script v2 (approved 2026-10-16)

- **Lesson:** `m02-candlestick-patterns/07-harami-and-harami-cross` (sha256 `152c3ba0…` after the approved fixes; it was `b618c492…`; 95 lines).
- **Languages:** English and Telugu only, by the owner's decision (2026-10-16).
- **Style:** cinematic, as for the engulfing lesson:
  - candlesticks, a camera and a spotlight;
  - no overlapping layers;
  - English on-screen text;
  - disclaimer tags in the corner and the Nitora icon on the end card;
  - plain words a 10-year-old could follow.
- **Length:** about 6½ minutes of English narration (ESTIMATE).
- **Numbers:** every number is the lesson's own or is computed from the site's figure data as the site draws it. Computed numbers are marked `computed` and checked by `check.mjs`.

## Audit: claims the video will and won't make

Sources: Thomas Bulkowski's pattern pages, read 2026-10-16. All ranks are out of 103 candlestick patterns.

| Lesson line | Claim | What the source says | Video |
|---|---|---|---|
| 74 | Bullish harami reverses ~53% | `HaramiBull.html`: "Bullish reversal 53% of the time" | **Verified.** Said with credit |
| 74 | Bearish harami reverses ~53% | `HaramiBear.html`: "Bullish **continuation** 53% of the time", so it reversed about 47% | **Wrong in the lesson.** The video says it reversed slightly less than half the time |
| 74 | Harami cross "fares a little better, around 55% to 57%" | `HaramiCrossBull.html`: "Bearish **continuation** 55%". `HaramiCrossBear.html`: "Bullish **continuation** 57%". So it reversed about 45% and 43% | **Wrong in the lesson.** These are continuation rates: in these tests the cross reversed *less* often than a plain harami |
| 36, 40, 81, 84 | The harami cross is a "stronger version" | Traditional reading; Bulkowski's tests don't support it | Said only as tradition ("traditionally read as stronger"), then the test result |
| 68 | "About half the time, the trend simply resumes **on the next candle**" | Bulkowski measures breakout direction, not the next candle | Said without "on the next candle" |
| 64 | Harami risk is "often larger than on an engulfing trade" | Reasonable, but unsourced. On the site's own figures it is smaller: 5.90 here against 6.70 for the engulfing | **Not compared.** The video only says the stop sits beyond the big candle, so size for it |

**Lesson fixes** (approved and applied 2026-10-16):
1. **Line 74.** "Bulkowski's tests are blunt: the bullish harami reversed the downtrend about 53% of the time, while the bearish harami reversed the uptrend only about 47% (the uptrend continued 53% of the time). The harami cross did no better: the bullish cross reversed about 45% of the time and the bearish about 43%. All of them are close to a coin flip."
2. **Line 76.** Keep, but drop "consistent with the idea that a doji is a deeper stall" from line 74.
3. **Lines 36 and 40.** "…is traditionally read as a stronger version of the same signal. In Bulkowski's tests, though, it did not reverse more often than a plain harami." Line 40: "It is still a stall, not a reversal, until the next candle proves it."
4. **Line 68.** Drop "on the next candle".
5. **Takeaways 3 and 6 (lines 81 and 84).**
   - Takeaway 3: "The harami cross, where the inside candle is a doji, is traditionally read as a deeper stall."
   - Takeaway 6: "In Bulkowski's tests haramis are close to a coin flip (bullish about 53%, bearish about 47%), and the harami cross did no better."
6. **Quiz question 5 (line 92).**
   - Question: "In Bulkowski's tests, how often did a bullish harami reverse the downtrend?"
   - Options and answer unchanged ("About 53%, near a coin flip").

## Scenes

`[mark]` is a timing marker the visuals sync to in each language.

### 1. title
> Harami and harami cross. Module two, lesson seven.

*Visual:*
- Kinetic title over the bullish-harami figure, out of focus.
- The small candle appears inside the big one.

### 2. intro (lines 1–5)
> Picture a runner sprinting down a track, stride after stride, each one as long as the last. Then one stride is tiny. She has not turned around. She has not stopped. But the effort went out of it. [define] That tiny stride is a harami. The word is Japanese for pregnant, because the picture is a big candle with a small candle tucked inside its body. It is the engulfing pattern in reverse: instead of a big candle swallowing a small one, a small one hides inside a big one. [stall] And that tells you what it means: a harami shows momentum stalling, not reversing.

*Visual:*
- A row of long stride marks, then a tiny one (illustration).
- At [define], the big red candle, then the small candle inside it, its body outlined inside the big body.
- At [stall], "stall ≠ turn".

### 3. rules (lines 9–12)
> Here are the rules. Candle one is big, and it goes with the trend: a big red candle in a downtrend, or a big green candle in an uptrend. [inside] Candle two has a small body that sits completely inside candle one's body: its open and its close are both between candle one's open and close. [colour] Candle two is usually the opposite colour, but it does not have to be. What matters is that it is small, and inside. [wicks] Its wicks may poke outside. Stricter traders want the whole second candle inside the first, and call that an inside bar.

*Visual:*
- The figure's two candles, large, with their prices as drawn (candle one 101.45 / 96.25, candle two 97.65 / 99.05).
- Each rule lights its part, with a checklist.
- At [wicks], the strict "inside bar" version is shown beside it.

### 4. bullish (lines 16–20)
> Here is a bullish harami after a decline. [day1] On day one, sellers post their biggest win in a while: a long red candle. On its own, it says the decline is healthy. [day2] On day two, price opens inside yesterday's body, above yesterday's close, and then goes almost nowhere. Sellers could not make a new low. Buyers could not do much either. [stall] Momentum that was racing has gone flat in one session. That is the difference from an engulfing: there, the other side takes control. Here, the winning side only loses its grip. Nobody has taken over yet.

*Visual:*
- The site's bullish-harami figure as candles.
- The camera moves in. Day two's candle grows inside day one's body, which is outlined.
- At [stall], a side-by-side reminder of the engulfing: "other side took control" against "winning side lost its grip".

### 5. trolley (the lesson's eli5, lines 22–26)
> Think of a shopping trolley rolling fast down a slope. An engulfing pattern is someone grabbing it and shoving it back up the hill. A harami is the trolley hitting a patch of thick grass and slowing to a crawl. It has not gone back up. But it is no longer racing down, and a small push could turn it.

*Visual:* trolley, slope and grass. **Illustration** (corner tag).

### 6. bearish (lines 28–32)
> The bearish harami is the mirror, at the top of a rise. A big green candle, then a small candle inside its body. [turn] Buyers who were charging ahead yesterday could not push price to a new high today. The rally has stalled.

*Visual:* the bearish figure, with the same choreography mirrored.

### 7. cross (lines 34–40)
> When the second candle is a doji, the pattern is called a harami cross. [doji] The second session ended in a perfect draw: open and close in the same place. Traditionally, that is read as a stronger stall than a plain harami. But it is still a stall, not a reversal, until the next candle proves it.

*Visual:*
- The site's harami-cross figure. The doji appears inside the big red body.
- Its open and close are labelled as drawn (100.18 / 100.23).

### 8. valid (lines 42–44)
> Like every reversal pattern, the harami needs a trend: a decline before a bullish harami, a rise before a bearish one. In a sideways range, small candles inside big ones happen all the time. [range] On this sideways chart, there are three of them, and none of them means anything.

*Visual:*
- The site's range regime as candles.
- Every inside-body pair is outlined (bars 17, 52 and 61, by the lesson's rule), and the count rises to 3.
- **The 3 is `computed`.**

### 9. locations (lines 46–50)
> The strongest haramis form in three places. [sprint] First, after a long trend where the first candle is unusually big: the bigger the sprint, the more the tiny step means. [level] Second, at a support level for a bullish harami, or resistance for a bearish one. [cross] And third, when the second candle is a doji.

*Visual:* three illustrated panels on candles, each lit as it is named. **Illustration** (corner tag).

### 10. confirm (lines 52–56)
> Because a harami only shows a stall, confirmation matters more here than for almost any other two-candle pattern. [high] For a bullish harami, you want a third candle that closes above the small candle's high. [mid] Even better, above the middle of the big red candle. [promote] And when the third candle closes above the big candle's open, as it does here, the pattern has a new name: three inside up. That is lesson twelve.

*Visual:* the figure's third candle, with three levels drawn:
- the small candle's high, 99.55;
- the big candle's midpoint, 98.85;
- the big candle's open, 101.45.

The third candle closes at 101.85, above all three. **All four numbers are `computed`.**

### 11. trade (lines 58–64)
> A trade idea to practise, on this example. [entry] Enter when the confirmation candle closes above the harami's high: here, at one hundred and one point eight five. [stop] Put the stop below the low of the big red candle, where sellers had their last real win: ninety-five point nine five. That is five point nine of risk. Aim for the next resistance, or a multiple of that risk. [size] Because the stop sits beyond the big first candle, the risk can be large. Size your position for it.

*Visual:* entry, stop and risk on the figure's candles. **Entry 101.85, stop 95.95 and risk 5.90 are `computed`.**

### 12. trap (the lesson's warning, lines 66–70)
> The most common harami mistake: buying at the close of the small candle, as if it were the turn. At that moment, nothing has turned. The trolley has only slowed down. About half the time, the trend simply carries on, and you are stopped out. The harami is a reason to watch closely. The confirmation candle is the reason to act.

*Visual:*
- Two outcomes from the same harami: the trend resumes (stopped out) and the confirmation arrives.
- **Illustration** (corner tag).

### 13. reliability (lines 72–76, corrected)
> How reliable is it? In Thomas Bulkowski's published tests, the bullish harami reversed the downtrend about fifty-three percent of the time. The bearish harami did worse: it reversed the uptrend only about forty-seven percent of the time. [cross] And the harami cross did not do better. In those tests it reversed less often than a plain harami: about forty-five percent for the bullish cross, and forty-three for the bearish. [lesson] All of them are close to a coin flip. A stall can go either way. So the harami tells you what to watch, not what to do. Add a level, wait for the third candle, and the odds become workable.

*Visual:*
- Four bars against a 50% coin-flip line: 53, 47, 45 and 43.
- Credit on screen: "Source: T. Bulkowski, thepatternsite.com".
- **The percentages are in `data.ts` with their source**, and checked.

### 14. takeaways (lines 78–85, as fixed)
> To recap. A harami is a big candle, then a small candle whose body sits inside the big one's body. It shows momentum stalling, not reversing. The harami cross, with a doji inside, is traditionally read as a deeper stall. It needs a trend before it. Wait for a third candle to close beyond the small candle. And in testing, haramis are close to a coin flip, so the level and the confirmation do the work.

### 15. quiz (lesson quiz question 4, line 91)
> Quick check. A bullish harami forms after a decline. What is the most sensible thing to do? Buy at the close of the small candle? Or wait for a third candle to close above the harami's high? [think] Take a second to think. [pause 2.5] [reveal] Wait for the third candle. The small candle only shows a stall. The third candle tells you which way it went.

### 16. end (line 95)
> Now practise in the pattern trainer. Whenever a big candle is followed by a small one, check whether the small body is fully inside, and then look at the trend before it.

*Visual:* end card with the Nitora icon, the two checks and the disclaimer.

---

**After your approval:**
1. Apply the lesson fixes and rerun the site's checks.
2. Telugu translation (Google Achird, flow mode, friendly).
3. Build the data module, an inside-body detector with tests, and the scenes. The engulfing scenes are the base.
4. Review stills in both languages, then the full renders.
5. Package to `out/publish/m02-candlestick-patterns/07-harami-and-harami-cross/v3/`.
