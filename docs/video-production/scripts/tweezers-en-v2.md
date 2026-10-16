# Tweezers and Counterattack Lines: English script v2 (approved 2026-10-16)

- **Lesson:** `m02-candlestick-patterns/09-tweezers-and-counterattack` (sha256 `3a11a07a…` before the approved fix; 107 lines).
- **Languages:** English and Telugu only.
- **Style:** as for the piercing lesson:
  - candles, a camera and a spotlight;
  - labels sit on what they name, with no pointer lines;
  - disclaimer tags in the corner and the Nitora icon on the end card;
  - English on-screen text and plain words.
- **Length:** about 7 minutes of English narration (ESTIMATE).
- **Numbers:** every number is the lesson's own or is computed from the site's figure data as the site draws it, and is checked by `check.mjs`.

## Audit: claims the video will and won't make

Sources: Thomas Bulkowski's pattern pages, read 2026-10-16. All ranks are out of 103 patterns.

| Lesson line | Claim | What the source says | Video |
|---|---|---|---|
| 86 | After a tweezer bottom the decline continued ~52% | `TweezersBottom.html`: "Bearish continuation 52% of the time" | **Verified.** Said with credit |
| 86 | After a tweezer top the rise continued ~56% | `TweezersTop.html`: "Bullish continuation 56% of the time" | **Verified.** Said with credit |
| 86 | Counterattack lines "roughly 55% to 63% depending on the sample" | Bulkowski tests them as **meeting lines** (the other common name). `MeetingLinesBull.html`: "Bullish reversal 56%". `MeetingLinesBear.html`: "Bullish **continuation** 51%", so it reversed about 49%. Both "somewhat rare" | **Corrected.** The video says 56% and 49%, credited, and that they are rare. The "63%" has no source |
| 86 | "rare enough that the statistics are shaky" | The pages say the numbers rest on "hundreds of perfect trades" and call the patterns "somewhat rare" | Said as "rare" only |
| 10 | Lows "within a tiny fraction of each other (a few ticks, or a few hundredths of a percent)" | Bulkowski requires "the same low price" | Said as the lesson says. The video's detector uses 0.05% of price |

**Lesson fix** (approved and applied 2026-10-16):
- **Line 86, the counterattack sentence.** "Counterattack lines, which Bulkowski tests under their other name, meeting lines, are rare. In his data the bullish version reversed about 56% of the time and the bearish one about 49%."
- **Line 38.** Add the other name for readers who look it up: "Counterattack lines (also called meeting lines)…".

## Scenes

`[mark]` is a timing marker the visuals sync to in each language.

### 1. title
> Tweezers and counterattack lines. Module two, lesson nine.

### 2. intro (lines 1–5)
> Imagine pushing a door open. It stops at a certain point. You back off, take a run at it, and it stops at exactly the same point. Now you know something: there is something solid behind that door. [define] That is a tweezer: two candles side by side with matching lows, a tweezer bottom, or matching highs, a tweezer top. The market tested a price twice and was stopped at the same place both times. [counter] This lesson also covers the counterattack line: a sharp gap against the first candle, then a fight all the way back to close at the same price. Same lesson, different picture: a level was defended, and the attackers gained nothing.

*Visual:*
- The door stopping twice at the same mark (illustration).
- At [define], the tweezer-bottom figure with its shared low.

### 3. rules (lines 7–12)
> The tweezer bottom's rules. [trend] It comes after a decline. [lows] Two candles in a row have the same low, or lows within a tiny fraction of each other. [colour] The first is usually red; the second is often green. But the colour matters less than the matching low. And the second candle is often a reversal shape of its own, which makes the signal stronger.

*Visual:*
- The figure's two candles. Their shared low is drawn and labelled "same low 95.86".
- A checklist lights up as each rule is said. **`Computed`.**

### 4. psychology (lines 16–20)
> [day1] On day one, sellers push price down to a level, and are stopped. [day2] On day two, they try again, reach the same price to the cent, and are stopped again. [floor] That is not a coincidence. It is a floor: somebody with size is buying at that price, again and again. Sellers who hoped for a breakdown start to cover, and buyers who saw the level hold step in. That level has just become support.

*Visual:* day one's low is marked, day two grows down to the same low, and at [floor] the level becomes "support".

### 5. bouncy castle (the lesson's eli5, lines 22–26)
> Picture a bouncy castle. You jump twice, and both times your feet stop at exactly the same height, because the floor underneath is solid. Two identical bounces tell you where the floor is. A tweezer bottom is the market finding its floor.

*Visual:* **Illustration.**

### 6. top (lines 28–36)
> The tweezer top is the mirror, after a rise. [high] Two candles reach the same high. Buyers pushed to a level twice, and were sold into both times. The ceiling has been found, and it will be called resistance.

*Visual:* the tweezer-top figure, "same high 104.61". **`Computed`.**

### 7. counterattack (lines 38–46)
> The counterattack line draws a different picture. After a decline, a big red candle. [gap] Then the next candle gaps down sharply at the open, well below the close. [close] And then it rallies all the way back, to close at, or very near, the first candle's close. The sellers' big head start at the open gained them nothing.

*Visual:*
- The bullish counterattack figure: a gap of 3.30 below the close (97.86 to 94.56).
- The rally back to 97.96, within 0.10 of the first close.

**`Computed`.**

### 8. compare (lines 48–54)
> Compare it with the piercing line from the last lesson. The piercing line wins back past the middle of the first body. [weaker] The counterattack only gets back to the first candle's close, not into the body at all. So on paper, it is weaker. [gap] What gives it its punch is the size of the gap: the sellers had a huge head start, and the buyers erased every bit of it. The bearish counterattack is the mirror, at the top of a rise.

*Visual:* the counterattack and the piercing line side by side, with the close-to-close match against the midpoint. Then the bearish counterattack figure.

### 9. valid (lines 56–62)
> All four are reversal patterns, so they need a trend before them. Tweezers are especially easy to find by mistake, because matching highs and lows happen all the time in a sideways market. [range] On this sideways chart there are six pairs of matching lows or highs, and none of them is a signal. The best tweezers come after a long trend, at a level that mattered before, with a second candle that is a reversal shape itself.

*Visual:*
- The site's range chart with every matching pair outlined: 3 lows and 3 highs, using the lesson's "few hundredths of a percent" (0.05% of price).
- **The 6 is `computed`.** The draft said eight; that count used a fixed 0.05-point tolerance. At 0.05% of price, the approved rule, it is six.

### 10. confirm (lines 64–68)
> [third] Confirmation, for a tweezer bottom: the next candle closes above the high of the pattern: here, above one hundred and one point seven six. It should not go back down and break the shared low. If it tests it again and holds, the level is even stronger. If it breaks, the pattern has failed.

*Visual:* the third candle closes at 102.86, above the pattern high of 101.76. **`Computed`.**

### 11. trade (lines 70–76)
> A trade idea to practise. [entry] Enter when the confirmation candle closes above the pattern's high: here, at one hundred and two point eight six. [stop] Put the stop a small buffer below the shared low: here, ten cents below, at ninety-five point seven six. That is seven point one of risk. It is one of the cleanest stops there is: the shared low is a defended level, and if it breaks, there is no reason left to hold.

*Visual:* entry, stop and risk. **Entry 102.86, stop 95.76 (the shared low minus a 0.10 buffer) and risk 7.10 are `computed`.**

### 12. warning (the lesson's callout, lines 78–82)
> Tweezers are the easiest pattern to over-find. Before you count one, ask three questions. Was there a trend to reverse? Does the level line up with something that mattered before? And is the second candle a reversal shape on its own? If the answer to all three is no, you are looking at two candles, not a tweezer.

*Visual:* the three questions as a checklist over the figure.

### 13. reliability (lines 84–88, corrected)
> How reliable are they? Bulkowski's data is unkind. After a tweezer bottom, the decline simply carried on about fifty-two percent of the time. After a tweezer top, the rise carried on about fifty-six percent. [counter] Counterattack lines, which he tests under their other name, meeting lines, are rare: the bullish one reversed about fifty-six percent of the time, and the bearish one about forty-nine. [use] So a tweezer's real value is in marking a level the market defended. Add a trend, a prior level and a reversal candle, and it becomes a trade. Alone, it is just a mark on the chart.

*Visual:* four bars against the coin-flip line, each showing the share that *reversed*: 48, 44, 56 and 49. The credit is on screen.

### 14. takeaways (lines 90–97)
> To recap. A tweezer is two candles in a row with matching lows after a decline, or matching highs after a rise. It shows a level tested twice and defended. A counterattack line gaps hard against the trend and closes back at the previous close. All of them need a trend before them. Confirm with a close beyond the second candle, and put the stop just beyond the shared extreme. On their own, they are close to a coin flip: use them to find levels.

### 15. quiz (lesson quiz question 3, line 102)
> Quick check. You see two candles with the same low, in the middle of a sideways range. What is it? A strong tweezer bottom? Or noise? [think] Take a second to think. [pause 2.5] [reveal] Noise. There is no trend to reverse, and ranges produce matching lows all the time.

### 16. end (line 107)
> Now practise in the trainer. Look for neighbouring candles with matching wicks, check the trend before them, and ask whether the second candle is a reversal shape on its own.

---

**After your approval:**
1. Apply the lesson fix and rerun the site's checks.
2. Telugu translation.
3. Data module, detectors (tweezers with the 0.05% tolerance, counterattack) with tests, and the scenes.
4. Review stills in both languages, then the renders. Package to `out/publish/m02-candlestick-patterns/09-tweezers-and-counterattack/v3/`.
