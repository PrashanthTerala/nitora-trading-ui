# The Abandoned Baby and Doji Stars: English script v2 (approved 2026-10-17)

- **Lesson:** `m02-candlestick-patterns/13-abandoned-baby-and-stars` (sha256 `8c4cc01b…` before the approved fix; 90 lines).
- **Languages:** English and Telugu only.
- **Style:** the studio look, as in the soldiers and three inside/outside lessons.
- **Length:** about 6½ minutes of English narration (ESTIMATE).
- **Numbers:** every number is the lesson's own or is computed from the site's figure data as the site draws it, and is checked by `check.mjs`.

## Audit: claims the video will and won't make

Sources: Thomas Bulkowski's pattern pages, read 2026-10-17. All ranks are out of 103 patterns.

| Lesson line | Claim | What the source says | Video |
|---|---|---|---|
| 3 | They "show up perhaps a handful of times a year on any single daily chart" | `AbandonBabyBull.html`: "I located just 293 examples out of 4.7 million candle lines" (frequency rank 92). `MorningDojiStar.html`: 932 examples (frequency rank 78) | **Corrected.** That is far rarer than a handful a year |
| 11, 18 | The doji star's doji sits below candle one's body, classically after a gap; the evening doji star mirrors it | `MorningDojiStar.html`: "a doji appears and its body gaps below the prior candle's body". `EveningDojiStar.html`: "a doji whose body gaps above the two surrounding days" | **Verified** |
| 14, 16, 74 | The doji makes the pattern stronger ("considered stronger"; "a deeper stall makes a stronger pattern") | Tested: morning doji star 76% (rank 25) vs morning star 78% (rank 12); evening doji star 71% (rank 30) vs evening star 72% (rank 4) | **Corrected.** Stronger in theory; about the same in his tests |
| 28, 32 | Abandoned baby: the doji's whole range gapped from both neighbours | "a doji should appear that gaps below the two adjacent candle shadows"; bearish: the doji's lower shadow "above the prior candle's high", the third's upper shadow "below the doji's low" | **Verified** |
| 51 | A gapped star at a level is "the top of the candlestick hierarchy" | Overall ranks: bullish abandoned baby 9th, morning doji star 25th, evening doji star 30th, bearish abandoned baby 64th ("poor") | **Softened** |
| 69 | 76%, 71%, 70%, 69%; "close to the plain stars" | All four verified | **Verified.** Said with credit |
| 71 | "among the most trustworthy candle signals you will find" | As line 51: the bearish abandoned baby ranks 64th overall | **Narrowed** |

**Proposed lesson fixes** (site content, so they need your approval):
1. **Line 3.** "…and they are rare: in 4.7 million daily candles, Bulkowski found just 293 bullish abandoned babies."
2. **Line 14 (caption).** "…Rarer than the plain morning star, and stronger in theory, though not in Bulkowski's tests."
3. **Line 16.** Keep the reasoning, and add: "That is the theory. In Bulkowski's tests the doji versions did about as well as the plain stars, not better (see the reliability section)."
4. **Line 51.** "A gapped star that forms at a support level (bullish) or resistance level (bearish) is a rare and striking sight. When you see one, it deserves your full attention…" (dropping "the top of the candlestick hierarchy").
5. **Line 71.** "The honest summary: gapped doji stars test well at calling the turn (though Bulkowski ranks the bearish abandoned baby's overall performance only 64th of 103), and you will find very few of them."
6. **Takeaway (line 74).** "…the stall was total: stronger in theory, though in Bulkowski's tests about as reliable as the plain stars."
7. **Quiz question 1's explanation (line 83).** "The doji shows a total stall. In Bulkowski's tests that added little: about 76%, against the plain morning star's 78%."

## The figures as drawn (rebased by the site)

| | Candle 1 | The doji (high / low) | Candle 3 | The gaps |
|---|---|---|---|---|
| Morning doji star | 102.88 → 97.78 | 96.88 → 96.93 (97.98 / 95.78) | 97.88 → 102.58 | the bodies gap |
| Bullish abandoned baby | 103.36 → 99.26 (low 98.96) | 97.66 → 97.71 (98.26 / 96.86) | 99.56 → 103.46 (low 99.26) | the doji's high, 98.26, is below both lows: 98.96 and 99.26 |
| Bearish abandoned baby | 97.49 → 102.19 (high 102.49) | 103.69 → 103.74 (104.49 / 103.09) | 101.89 → 97.99 (high 102.19) | the doji's low, 103.09, is above both highs |

**Trade (bullish abandoned baby):** entry at the third close, 103.46; stop just under the doji's low, 96.86; risk 6.60. **`Computed`.**

## Scenes

### 1. title
> The abandoned baby and the doji stars. Module two, lesson thirteen.

### 2. intro (lines 1–5)
> Sometimes the market does not just pause; it jumps. Price closes at one level, and the next session opens somewhere else, leaving an empty space on the chart: a gap. [stars] When gaps surround the middle candle of a star, the pattern becomes something rarer. [names] The morning and evening doji stars, where the middle candle is a doji. And the abandoned baby, where the doji is cut off by a gap on both sides. [rare] They are rare: in four point seven million daily candles, Bulkowski found just two hundred and ninety-three bullish abandoned babies. So their statistics are encouraging, not proven.

*Visual:* a gap opening on the chart; the three patterns introduced; the count shown.

### 3. dojistar [Doji stars] (lines 7–18, as fixed)
> The morning doji star. [rules] After a downtrend, a large red candle. Then a doji, a session that opens and closes at the same price, sitting below candle one's body, classically after a gap down. Then a large green candle closing past the middle of candle one's body. [stall] A spinning top in the middle says the sellers could not press their advantage. A doji says they could not move price at all. In theory, a deeper stall makes a stronger pattern. [tested] In Bulkowski's tests, though, the doji versions did about as well as the plain stars, not better. [mirror] The evening doji star is the mirror: a big green candle, a doji perched above it, then a big red candle closing deep into the green body.

*Visual:* the morning doji star figure builds candle by candle; the doji's body is held flat; the midpoint draws itself and the third close passes it. At [mirror], the mirror image (illustration).

### 4. ice (the lesson's eli5, lines 20–24)
> Think of a car sliding on ice toward a wall. A morning star is the car slowing right down, then driving away. A morning doji star is the car coming to a dead stop, not even rolling, then driving away. The dead stop is more convincing.

*Visual:* **Illustration.** Two cars on ice, one slowing, one stopping dead, both driving off.

### 5. baby [The abandoned baby] (lines 26–37)
> The abandoned baby adds one demanding condition: the doji must be gapped away from both neighbours, wicks included. [gaps] Here the doji's high, ninety-eight point two six, sits below the first candle's low, ninety-eight point nine six, and below the third candle's low. Nothing touches the baby. [third] Then candle three, a large candle in the reversal direction, closes well into candle one's body. [bearish] The bearish version is the mirror: an isolated doji at the top of a rise, with a gap on each side, then a big red candle.

*Visual:* the bullish figure; the two gaps are shaded as empty bands. **98.26 and 98.96: `computed`.** At [bearish], the bearish figure.

### 6. psychology (lines 39–43)
> [panic] The gap down into the doji is panic: sellers were so eager that the open jumped below yesterday's entire range. [nothing] Then, on the doji, nothing. All that eagerness produced no further movement. [jump] Then the market gaps back up, above the doji's entire range. [trapped] Anyone who sold at the doji's price is now stranded below a gap, losing money, with no way out at the same price. A trapped crowd, and trapped crowds fuel reversals.

*Visual:* the three days, each with its own note; at [trapped], the doji's price band marked "trapped sellers".

### 7. valid [Where they work] (lines 45–51, as fixed)
> These are reversal patterns, and they need a prior trend. [gaps] They need gaps, too, and gaps come from markets that close overnight: stocks, and index futures in cash hours. On a twenty-four-hour chart, like forex or crypto, a true abandoned baby is nearly impossible. [daily] They mean more on daily and weekly charts. [level] And a gapped star at support or resistance is a rare and striking sight. When you see one, it deserves your full attention.

*Visual:* an overnight session break opening a gap, next to a 24-hour chart with no gap (illustration); then the figure with its decline shaded.

### 8. trade [Trading them] (lines 53–59)
> The third candle is the built-in confirmation. [entry] Enter at its close: here, one hundred and three point four six. Waiting for a fourth candle on a pattern this strong often means missing the move. [stop] Put the stop just under the doji's low, ninety-six point eight six: about six point six of risk. That is the level the market abandoned. If price comes back to it, the abandonment was false. [bear] The bearish version: short at the third close, stop above the doji's high.

*Visual:* entry, stop and risk on the bullish figure. **103.46, 96.86, 6.60: `computed`.**

### 9. gapfill (the lesson's warning, lines 61–65)
> Gaps that fill are not gaps that held. If, on the third candle or the next, price trades back into the doji's range, the gap has filled, and the pattern has failed, even if the candles still look right. Do not hold a loser because the shape was textbook. The stop under the doji's low is there for exactly this.

*Visual:* **Illustration.** A fourth candle falls back into the doji's band, and the stop is hit.

### 10. reliability [How reliable] (lines 67–71, as fixed)
> In Bulkowski's tests, the morning doji star reversed about seventy-six percent of the time, and the evening doji star about seventy-one: close to the plain stars. [baby] The bullish abandoned baby, about seventy; the bearish, about sixty-nine. Good numbers for candlesticks. [caveats] Two heavy caveats. They are rare, so the samples are small, and small samples wobble. And because they need gaps, they are stock-market patterns: do not carry the numbers over to forex or crypto.

*Visual:* four bars that fill and settle; the plain stars' 78% and 72% beside the doji stars; the sample counts (932, 293); the credit.

### 11. takeaways (lines 73–80, as fixed)
> To recap. A doji star is a star whose middle candle is a doji: a total stall, stronger in theory, about as reliable in the tests. An abandoned baby is a doji gapped away from both neighbours. The gaps show panic, then nothing, then a jump back, stranding anyone who traded the doji. They need overnight gaps, so they belong to stocks and indexes. Enter at the third close, stop just beyond the doji, and a filled gap means the pattern has failed.

### 12. quiz (lesson quiz question 4, line 86)
> Quick check. You go long on a bullish abandoned baby. On the next candle, price trades back into the doji's range. What does that mean? The pattern is stronger? Or the gap has filled, and the pattern has failed? [think] Take a second to think. [pause 2.5] [reveal] The gap has filled, and the pattern has failed. The stop should be doing its job.

### 13. end (line 90)
> Now practise in the pattern trainer. Whenever you see a doji in the middle of three candles, check for gaps on either side. If both are there, you have found the rarest pattern in the module.

---

**After your approval:**
1. Apply the lesson fixes and rerun the site's checks.
2. Telugu translation.
3. Data module, a detector for the gapped stars with tests, and the scenes.
4. Review stills, then render both languages. Package to `out/publish/m02-candlestick-patterns/13-abandoned-baby-and-stars/v3/`.
