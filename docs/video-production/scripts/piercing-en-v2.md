# Piercing Line and Dark Cloud Cover: English script v2 (approved 2026-10-16)

- **Lesson:** `m02-candlestick-patterns/08-piercing-dark-cloud` (sha256 `20aff68a…` after the approved fixes; it was `aa861138…`; 100 lines).
- **Languages:** English and Telugu only.
- **Style:** cinematic, as for the engulfing and harami lessons:
  - candles, a camera and a spotlight;
  - no overlapping layers;
  - English on-screen text;
  - disclaimer tags in the corner and the Nitora icon on the end card;
  - plain words.
- **Length:** about 7 minutes of English narration (ESTIMATE).
- **Numbers:** every number is the lesson's own or is computed from the site's figure data *as the site draws it*. Computed numbers are marked `computed` and checked by `check.mjs`.

## Audit: claims the video will and won't make

Sources: Thomas Bulkowski's pattern pages, read 2026-10-16. All ranks are out of 103 candlestick patterns.

| Lesson line | Claim | What the source says | Video |
|---|---|---|---|
| 11–12 | Piercing: opens below the first low, closes above the midpoint and below the open | `Piercing.html`: "opens below the black candle's low", "closes between the midpoint of the black body and opening price" | **Verified** |
| 32–33 | Dark cloud: opens above the first high, closes below the midpoint | `DarkCloudCover.html`, same rule mirrored | **Verified** |
| 79 | Piercing line reverses ~64% | "Bullish reversal 64% of the time" | **Verified.** Said with credit |
| 79 | Dark cloud cover ~60% | "Bearish reversal 60% of the time" | **Verified.** Said with credit |
| 79 | "some studies put it barely above a coin flip" | No source | **Not said** |
| 79 | "Both are less reliable than their engulfing cousins" | Dark cloud 60% vs bearish engulfing 79%: true. Piercing 64% vs bullish engulfing 63%: **not true** | Said only for dark cloud. The piercing line tested about the same as the bullish engulfing |
| 41, 45–51, 86 | Thrusting and in-neck are "continuation patterns more often than not" | `InNeck.html`: continuation 53%. `OnNeck.html`: continuation 56%. `Thrusting.html`: "Bullish **reversal** 57%" | **Corrected.** The scale is shown as the *classic* reading, and the video says plainly that in Bulkowski's tests the thrusting line reversed more often than not |
| 53 | "a close at 80% of the body is far better than one at 51%" | No source | Said as reasoning only: a deeper close is a stronger counterattack |
| 73 | "That small difference flips the pattern from reversal to continuation" | Contradicted for the thrusting line | Said as "changes the pattern's name" |

**Site figure bug found (separate from the wording).** In `src/content/figures/candlePatterns.ts`, the "50% of body" lines are hard-coded prices. The site moves each pattern onto the end of its trend before drawing it, so the lines no longer sit on the real midpoint:

| Figure | Line drawn at | Real midpoint |
|---|---|---|
| piercing line | 100.50 | 100.74 |
| dark cloud cover | 99.50 | 99.63 |
| thrusting line | 100.45 | 100.01 |

Every pattern still qualifies, but on a lesson that says "measure, do not guess" the line should be exact.

**Fixed (approved 2026-10-16).**
- Six figures now place their line from their own candles (`withBars` in `candlePatterns.ts`): the piercing, dark cloud and thrusting midpoints, the tweezer bottom's "same low" (it was off by 0.64), the tweezer top's "same high" (off by 1.11), and the counterattack's "closes match".
- "Hammer at support" keeps its fixed level: those candles are not rebased, and the level is a judgment, not a measurement.
- `tools/test-figures.mjs` now fails any measurement line that is off its candles by more than a cent.

**Lesson fixes** (approved and applied 2026-10-16):
1. **Line 41.** "That weaker version has its own names, thrusting line and in-neck line, and the classic reading treats them as continuation patterns. The tests are mixed: in Bulkowski's data the in-neck continued the trend 53% of the time, but the thrusting line actually reversed 57% of the time. You will meet them in lesson 15."
2. **Table header (line 45).** "Usual meaning" becomes "Classic reading".
3. **Line 53.** "The 50% line is where the classic definitions draw the change. The deeper the piercing, the stronger the counterattack: a close at 80% of the body shows far more buying than one at 51%."
4. **Line 73.** "That small difference changes the pattern's name, and in the classic reading its meaning."
5. **Line 79.** "Bulkowski's numbers are modest. The piercing line reversed the downtrend about 64% of the time in his tests, about the same as the bullish engulfing (63%). Dark cloud cover reversed the uptrend about 60% of the time, well below the bearish engulfing's 79%."
6. **Takeaway lines 86 and 89.**
   - Line 86: "…less than halfway is traditionally read as a weak bounce (thrusting, in-neck)."
   - Line 89: "In Bulkowski's tests the piercing line reversed about 64% of the time and dark cloud cover about 60%."
7. **Quiz question 2 (line 94).**
   - Option B becomes "A thrusting line, traditionally read as a continuation".
   - Explanation: "Recovering less than half leaves sellers in control of most of the range, which is the classic reading. Tests are mixed, so measure the close and wait for confirmation."

## Scenes

`[mark]` is a timing marker the visuals sync to in each language.

### 1. title
> Piercing line and dark cloud cover. Module two, lesson eight.

*Visual:* kinetic title over the piercing-line figure, out of focus.

### 2. intro (lines 1–5)
> Think of a tug of war. The rope has a mark in the middle. If your team has been dragged five steps back and pulls three steps forward, the crowd cheers, but the mark is still on the other side. Pull six steps, past the middle, and the mood of the whole field changes. [define] Candlesticks have a halfway rule too. The piercing line and the dark cloud cover are two-candle reversal patterns where the second candle wins back more than half of the first candle's body, but does not swallow all of it. [half] Halfway is the line that matters.

*Visual:*
- A rope with a centre mark, pulled back and then past the middle (illustration).
- At [define], the first red body appears with its midpoint line, and the second candle's close goes past it.

### 3. rules (lines 7–12)
> Here are the piercing line's rules. [trend] It comes after a decline. Candle one is a big red candle. [gap] Candle two opens below candle one's low: a gap down. [mid] Then it closes above the middle of candle one's body, [open] but below candle one's open. If it closed above the open, it would be a bullish engulfing instead.

*Visual:* the figure's two candles with their prices as drawn, a four-item checklist lighting up. The numbers on screen:
- candle one: open 103.24, low 98.04, close 98.24;
- candle two: opens 97.14, closes 101.54;
- midpoint 100.74.

**All `computed`.**

### 4. psychology (lines 16–20)
> [day1] Day one is a solid win for the sellers. [day2] Day two opens even lower: the sellers' dream. Then buyers step in and push, all session long. By the close, more than half of yesterday's drop is won back. [hurt] Think about who is hurt now. Everyone who sold at today's open is losing. So is everyone who sold in the bottom half of yesterday's candle. The sellers had a gift, a gap down, and they wasted it.

*Visual:*
- The site's figure as candles. Day two grows from its gap-down open.
- At [hurt], the "losing sellers" zone is shaded between the open and the close.

### 5. snowball (the lesson's eli5, lines 22–26)
> Imagine a snowball fight. One team has been winning all afternoon. Then the other team lands one big throw that knocks them back more than halfway to the starting line. It is not a total rout. But the confident team is suddenly not so confident.

*Visual:* **Illustration** (corner tag).

### 6. darkcloud (lines 28–37)
> Dark cloud cover is the mirror, at the top of a rise. A big green candle. [gap] Then a red candle that opens above the green candle's high, pulling in the last excited buyers, [mid] and then closes below the middle of the green body. A dark cloud rolling over a sunny rally. The late buyers are trapped above the close.

*Visual:* the bearish figure. The numbers on screen:
- the gap-up open, 103.23, above the high, 102.43;
- the close, 99.03, below the midpoint, 99.63.

**`Computed`.**

### 7. scale (lines 39–53, corrected)
> Why the middle? The same two-candle shape sits on a scale. [scale] If the second candle only reaches the first candle's low, or just inside the body, or into the body but short of the middle, the classic names are on-neck, in-neck and thrusting, read as weak bounces, with the trend continuing. Past the middle, it is a piercing line. Past the open, an engulfing. [test] But be honest about it: in Bulkowski's tests, the thrusting line actually reversed more often than not. The midpoint is where the classic definitions draw the line, not a law of nature. What does hold: the deeper the second candle reaches, the stronger the counterattack.

*Visual:*
- One red body with five second candles closing at the five levels (illustration), each named as it is said.
- At [test], the thrusting candle is marked with Bulkowski's 57% reversal and credited.

### 8. valid (lines 55–59)
> Both are reversal patterns, so they need a clear trend to reverse. The piercing line is most reliable after a long decline into support. Dark cloud cover, after a long rise into resistance. [markets] One practical note. The gap at the open happens in stock markets, which close overnight. In twenty-four-hour markets like crypto, the next candle opens where the last one closed. There, use the relaxed rule: candle two opens at or below the prior close, and still has to win back the middle.

*Visual:* the piercing figure at a support level. At [markets], two mini panels: "stock: gap" and "24-hour: no gap". **Illustration** (corner tag).

### 9. confirm (lines 61–63)
> [third] Confirmation is a third candle closing above the first candle's open: here, above one hundred and three point two four. That is also where the pattern would have become an engulfing. [volume] Higher volume on the second candle adds weight: a lot of shares changed hands at the low.

*Visual:* the figure's third candle closes at 103.84, above 103.24. **`Computed`.**

### 10. trade (lines 65–69)
> A trade idea to practise, on this example. [entry] Enter when the confirmation candle closes above the first candle's open: here, at one hundred and three point eight four. [stop] Put the stop below the second candle's low, the level buyers defended: ninety-six point eight four. That is seven points of risk. Aim for the next resistance.

*Visual:* entry, stop and risk on the figure. **Entry 103.84, stop 96.84 and risk 7.00 are `computed`.**

### 11. measure (the lesson's warning, lines 71–75)
> Measure, do not guess. The difference between a piercing line and a thrusting line can be a few cents around the middle. So look at the numbers. Here, the first body runs from one hundred and three point two four down to ninety-eight point two four, so the middle is one hundred point seven four. The second candle closes at one hundred and one point five four: about sixty-six percent of the way back. That is a piercing line.

*Visual:*
- The two bodies with a ruler: open, close and midpoint, then "66% of the body won back".
- The small note that the site's own figure draws its line at 100.5 is **not** made in the video. It is fixed on the site instead (see the proposed fix above).

**Midpoint 100.74, close 101.54 and 66% are `computed`.**

### 12. reliability (lines 77–81, corrected)
> How reliable are they? In Thomas Bulkowski's published tests, the piercing line reversed the downtrend about sixty-four percent of the time, about the same as the bullish engulfing. [dark] Dark cloud cover reversed the uptrend about sixty percent of the time, well below the bearish engulfing's seventy-nine. [use] So treat a confirmed piercing line at support as a decent signal, dark cloud cover at resistance as a moderate one, and either one in open space, unconfirmed, as noise.

*Visual:* four bars (64 against 63; 60 against 79) with a coin-flip line and the credit.

### 13. takeaways (lines 83–90, as fixed)
> To recap. A piercing line: after a decline, a big red candle, then a green candle that opens below its low and closes past its middle, but below its open. Dark cloud cover is the mirror, after a rise. The middle is where the classic definitions draw the line, and the deeper the close, the stronger the counterattack. Confirm with a third candle beyond the first candle's open. And measure: open, close, middle.

### 14. quiz (lesson quiz question 1, line 93)
> Quick check. For a piercing line, where must the second candle close? Above the first candle's open? Or above the middle of its body, but below its open? [think] Take a second to think. [pause 2.5] [reveal] Above the middle, but below the open. Above the open, it would be an engulfing.

### 15. end (line 100)
> Now practise in the pattern trainer. Whenever a red candle is followed by a green one, find the middle of the red body, and decide: piercing line, thrusting line, or engulfing.

---

**After your approval:**
1. Apply the lesson fixes and (if approved) the figure midpoint fix, then rerun the site's checks.
2. Telugu translation.
3. Data module, detector with tests, and the scenes, using the shared pieces.
4. Review stills in both languages, then the full renders. Package to `out/publish/m02-candlestick-patterns/08-piercing-dark-cloud/v3/`.
