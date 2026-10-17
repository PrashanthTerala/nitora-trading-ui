# Three White Soldiers and Three Black Crows: English script v2 (approved 2026-10-16)

- **Lesson:** `m02-candlestick-patterns/11-three-soldiers-three-crows` (sha256 `c90eb1c7…` before the approved fix; 98 lines).
- **Languages:** English and Telugu only.
- **Style:** the stars lesson's rules, plus the approved new look (2026-10-16):
  - candles that build from open to close, with a live price tag on the axis;
  - a slow camera push onto the pattern, with the earlier candles softened and dimmed;
  - levels and stops that draw themselves before their label appears on the line;
  - headline words that animate in, with the key phrase in the accent colour;
  - match cuts between scenes on the same figure, and a light sweep at a change of topic;
  - a 3-second brand opening with the Nitora icon, and chapter cards between sections;
  - a moving background haze, a vignette and fine grain;
  - numbers that count up, and bars that fill with a slight overshoot.

  Unchanged: labels on what they name, tags in the corner, the icon on the end card, no overlapping layers, English on-screen text, Remotion only. No sound effects or music.
- **Length:** about 7 minutes of English narration (ESTIMATE).
- **Numbers:** every number is the lesson's own or is computed from the site's figure data as the site draws it, and is checked by `check.mjs`.

## Audit: claims the video will and won't make

Sources: Thomas Bulkowski's pattern pages, read 2026-10-16. All ranks are out of 103 patterns.

| Lesson line | Claim | What the source says | Video |
|---|---|---|---|
| 10–11 | Three tall green candles, each opening inside the prior body, closing near its high, with higher closes | `ThreeWhiteSoldiers.html`: "three tall white candles, each with a close near the high, higher closes"; each "opens within the body of the prior candle" | **Verified** |
| 30–32 | Crows: three tall red candles in an uptrend, each opening inside the prior body, closing near its low | `ThreeBlackCrows.html`: "three tall black candles that appear in an upward price trend"; candles 2 and 3 "open within the body of the prior candle" | **Verified** |
| 77 | Crows reverse ~78%, soldiers ~82% | "Bearish reversal 78% of the time"; "acts as a bullish reversal 82% of the time" | **Verified.** Said with credit |
| 77 | "among the best performers in Bulkowski's stock data" | The **overall** ranks are mixed: soldiers **32nd**, crows **3rd**. The crows' best 10-day results came from *upward* breakouts, and Bulkowski says "Do not trade this if the breakout is downward" | **Corrected** |
| 79 | "Bulkowski himself rates the pattern's performance after the breakout as only moderate" | Soldiers: "price does not trend all that well after the breakout"; "a short move after an upward breakout is typical". Crows: see the row above | **Verified, made specific** |
| 40 | The advance block is "a warning… not a bullish signal" | `AdvanceBlock.html`: in theory a bearish reversal, but tested as a "bullish continuation 64% of the time" (rank 54) | **Corrected.** It's a sign of tiring, not a sell signal |
| 42 | The stalled pattern (deliberation) is "also a warning" | `Deliberation.html`: in theory bearish, but tested as a "bullish continuation 77% of the time" (rank 93) | **Corrected,** as above |
| 44 | Identical three crows is "a stronger, though rarer, version" | `Identical3Crows.html`: reversal 79%, against 78% for the ordinary pattern; overall rank 24, against 3; frequency rank 83 (rare) | **Corrected.** Rarer, not proven stronger |

**Proposed lesson fixes** (site content, so they need your approval):
1. **Line 40 (advance block).** Replace the last sentence with: "Treat it as a sign of tiring, not a sell signal: in Bulkowski's tests price still kept rising about 64% of the time, but each push met more resistance."
2. **Line 42 (stalled pattern).** "Also a warning." becomes "Also a sign of tiring rather than a reversal: Bulkowski found the rise continued about 77% of the time."
3. **Line 44 (identical three crows).** "…is considered a stronger, though rarer, version." becomes "…It is rarer, and in Bulkowski's tests it reversed about as often as ordinary crows (79% against 78%)."
4. **Lines 77–79 (reliability).** Change it to:
   > Three white soldiers and three black crows are good at calling direction in Bulkowski's stock data. Three black crows broke downward, reversing the uptrend, around 78% of the time, and three white soldiers broke upward around 82%. Those are unusually high for candlesticks.
   >
   > But be careful with those numbers. They count which way price left the pattern, not how far it went. Because the pattern takes three strong sessions, some of the move has already happened by the time you can name it. Bulkowski ranks three white soldiers only 32nd of 103 overall and notes that price does not trend all that well after the breakout. Three black crows rank 3rd overall, but his 10-day check found the best moves came when price broke *upward*, against the pattern, and he advises against trading the downward breaks.

   The closing "honest summary" sentence stays.
5. **Takeaway (line 85).** "…are warnings that the move is tiring, not added strength, even though price often keeps going for a while."

## The figures as drawn (rebased by the site)

| Candle | Soldiers (open → close, low/high) | Crows (open → close, high/low) |
|---|---|---|
| 1 | 100.24 → 103.14 (low 99.84) | 100.17 → 97.27 (high 100.57) |
| 2 | 102.44 → 105.94 | 97.97 → 94.47 |
| 3 | 105.24 → 108.84 (low 104.94) | 95.17 → 91.57 |

Each opens inside the previous body and closes beyond the previous close, with 0.30 wicks at the close end. **`Computed`.**

## Scenes

`[mark]` is a timing marker the visuals sync to in each language.

### 1. title
> Three white soldiers and three black crows. Module two, lesson eleven.

*Visual:* the brand opening (the Nitora icon), then the title over the soldiers building one by one.

### 2. intro (lines 1–5)
> One strong candle can be a fluke: one big order, one headline. Two in a row is more interesting. [three] Three strong candles in a row, each starting inside the last and closing near its extreme, is a crowd that has made up its mind and is acting on it, day after day. [names] Three white soldiers march upward after a decline. Three black crows drop lower after a rise. The names come from old Japanese charts, where up candles were drawn white and down candles black. [momentum] These are momentum patterns: no long wicks, no stalls. Easy to read, and tricky to trade, because by the time three tall candles have printed, much of the move has already happened.

*Visual:* one candle, then two, then three building on the soldiers figure. At [names], the crows mirror alongside.

### 3. rules (lines 7–12)
> Here are the soldiers' rules. [trend] They come after a decline. [tall] Three green candles in a row, each with a large body and a small upper wick: each closes near its high. [inside] Each opens inside the previous body, then closes above the previous close: here, one hundred and three point one four, then one hundred and five point nine four, then one hundred and eight point eight four. [similar] And the bodies are roughly the same size. A soldier much smaller than the last, or with a long upper wick, says the advance is tiring.

*Visual:* the figure with a checklist. Each open is marked inside the previous body, and the three closes step up. **`Computed`.**

### 4. psychology (lines 16–20)
> [day1] Day one: buyers step in after the decline and close strong. [day2] Day two opens a little lower, inside yesterday's body. That gives the sellers a chance, and the buyers absorb it and close at a new high. [day3] Day three: the same. Three times, every dip was bought and the session finished near the top. This is what orderly demand looks like. Nobody is panicking in.

*Visual:* the three days, each with its own short note on its candle. The dip at each open is shown by the candle building down a little, then up.

### 5. staircase (the lesson's eli5, lines 22–26)
> Picture three friends carrying a heavy box up a staircase. Each takes a step, pauses to grip, then takes another. No slipping, no dropping it. After three clean steps, everyone watching believes the box is going up.

*Visual:* **Illustration.** Three steps that echo the three candles.

### 6. crows (lines 28–36)
> Three black crows are the mirror. After a rise, three tall red candles, each opening inside the previous body and closing near its low. [bounce] Each day opens with a small bounce, sellers absorb it, and the close is near the low. [drop] Three days of that, from one hundred point one seven down to ninety-one point five seven. The buyers who drove the rally are being replaced by sellers who are not in a hurry, but are not stopping either.

*Visual:* the crows figure; the first open and the last close marked. **`Computed`.**

### 7. variations (lines 38–46, as fixed)
> Three green candles are not automatically soldiers. [block] In an advance block, each body is smaller than the last, and the upper wicks grow. The soldiers are tiring. In Bulkowski's tests price still rose about sixty-four percent of the time, so it is a sign of tiring, not a sell signal. [stall] In a stalled pattern, two strong candles are followed by a small one perched at the top: momentum has paused. [identical] And in identical three crows, each crow opens right at the previous close, with no bounce at all. It is rarer, and it reversed about as often as ordinary crows. [quality] The lesson from all three: judge the quality. Tall bodies, small wicks, strong closes.

*Visual:* three panels: the advance block, the stalled pattern and the identical three crows. **Illustration.**

### 8. valid (lines 48–54)
> Soldiers matter most after a decline or a long sideways stretch that they break out of. Crows matter most after an extended rise that was already tiring. [continuation] Both also confirm a trend: soldiers after a pullback in an uptrend say the trend is healthy. [blowoff] Where they are least useful is at the end of a long move in the same direction. Three giant soldiers after a month-long rally may be the final blow-off, as the last buyers pile in.

*Visual:* the figure with the decline shaded, then a blow-off version at the top of a long rise (illustration).

### 9. confirmation (lines 56–58)
> The pattern already holds three sessions of agreement, so many traders treat the third candle as confirmation. [fourth] A more cautious trader waits for a fourth candle that does not give back much of the third. [volume] Steady or rising volume across the three supports the pattern. Shrinking volume says the move is running out of participants.

*Visual:* the figure with a fourth candle, and volume bars beneath.

### 10. trade (lines 60–67)
> This is where soldiers get awkward. [wide] Buy at the third close, one hundred and eight point eight four, and the natural stop below the first soldier's low, ninety-nine point eight four, is nine points away. [pullback] The lesson's first answer: wait for a pullback. Say price dips to the middle of the third body, one hundred and seven point oh four. With the stop below the third soldier's low, one hundred and four point nine four, the risk is two point one. [smaller] The second answer: keep the wide stop and take a smaller position. [crows] For crows, the mirror: short a bounce into the third crow's body, with the stop above its high.

*Visual:* both trades on the figure, side by side in time: the wide stop (9.00), then the pullback entry and its tight stop (2.10). The pullback is an example, not a forecast. **Entry 108.84, stop 99.84, risk 9.00; pullback 107.04, stop 104.94, risk 2.10: `computed`.**

### 11. chase (the lesson's warning, lines 69–73)
> The urge to buy the third soldier at its close, because it looks so obviously strong, is exactly the fear of missing out. Everyone else sees the same candle and buys the same close. The pattern is a reason to be bullish. The pullback is the entry.

### 12. reliability (lines 75–79, as fixed)
> How reliable are they? At calling direction, very. In Thomas Bulkowski's published tests, three white soldiers broke upward about eighty-two percent of the time, and three black crows broke downward about seventy-eight. [but] But those numbers count which way price left the pattern, not how far it went. [ranks] Bulkowski ranks the soldiers only thirty-second of a hundred and three overall: after them, price does not trend all that well. The crows rank third, but his best results came when price broke upward, against the pattern. [summary] So: very good at telling you which way the market has turned, and only fair at telling you how much further it goes.

*Visual:* two bars (82 and 78) against a coin-flip line, then the two ranks, and the credit.

### 13. takeaways (lines 81–88, as fixed)
> To recap. Three white soldiers: three tall green candles after a decline, each opening inside the last body and closing near its high. Three black crows: the mirror, after a rise. They show orderly control by one side. Shrinking bodies or growing wicks are signs of tiring, not strength. And entering at the third close means a wide stop and a partly finished move: prefer the pullback.

### 14. quiz (lesson quiz question 3, line 93)
> Quick check. Why is buying at the close of the third soldier often a poor entry? Because the pattern is bearish? Or because the stop is far away and part of the move has already happened? [think] Take a second to think. [pause 2.5] [reveal] The stop is far away, and part of the move has already happened. A pullback into the third candle gives a better entry and a tighter stop.

### 15. end (line 98)
> Now practise in the pattern trainer. When you see three same-coloured candles in a row, judge the quality: are the bodies tall and similar, are the wicks small, and does each close beat the last?

*Visual:* the end card with the Nitora icon.

---

**After your approval:**
1. Apply the lesson fixes and rerun the site's checks.
2. Build the new look into the shared chart and kit. Before the full lesson, show you stills and a 30-second test clip.
3. Telugu translation.
4. Data module, a soldiers/crows detector with tests, and the scenes.
5. Review stills in both languages, then the renders. Package to `out/publish/m02-candlestick-patterns/11-three-soldiers-three-crows/v3/`.
