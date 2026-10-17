# Morning Star and Evening Star: English script v2 (approved 2026-10-16)

- **Lesson:** `m02-candlestick-patterns/10-morning-evening-star` (sha256 `e2ef6f62…` before the approved fix; 98 lines).
- **Languages:** English and Telugu only.
- **Style:** as for the tweezers lesson:
  - candles, a camera and a spotlight;
  - labels on what they name, with no pointer lines;
  - disclaimer tags in the corner and the Nitora icon on the end card;
  - English on-screen text and plain words.
- **Length:** about 7 minutes of English narration (ESTIMATE).
- **Numbers:** every number is the lesson's own or is computed from the site's figure data as the site draws it, and is checked by `check.mjs`.

## Audit: claims the video will and won't make

Sources: Thomas Bulkowski's pattern pages, read 2026-10-16. All ranks are out of 103 patterns.

| Lesson line | Claim | What the source says | Video |
|---|---|---|---|
| 11–12 | Star body below candle one's body; third candle closes at least past the midpoint | `MorningStar.html`: the star's "body gaps below the prior body"; the third candle "closes at least midway into the body of the first day" | **Verified** |
| 76 | Morning star reverses ~78%, evening star ~72% | "Bullish reversal 78% of the time" (overall rank **12**); "Bearish reversal 72% of the time" (overall rank **4**) | **Verified.** Said with credit |
| 76 | "other researchers… report figures in the 60s" | No source | **Not said** |
| 78 | "stars are decent at calling a turn and only average at predicting how big it is" | Bulkowski's *overall* rank, which also weighs how far price moved afterwards, puts the evening star 4th and the morning star 12th of 103 | **Corrected.** They rank well on that too, but no pattern promises a big move |
| 50 | "stars test better than two-candle patterns" | True for most two-candle patterns. Not for the bearish engulfing (79%, against the evening star's 72%) | Said as "most" |

**Proposed lesson fixes** (site content, so they need your approval):
1. **Line 50.** "…stars test better than most two-candle patterns…".
2. **Line 76.** Drop "though other researchers using different rules and markets report figures in the 60s".
3. **Line 78.** Replace "stars are decent at calling a turn and only average at predicting how big it is" with: "in Bulkowski's overall ranking, which also weighs how far price moved, the evening star places 4th and the morning star 12th of 103, so they do better than most; still, no pattern promises a big move".
4. **Takeaway (line 86).** "In Bulkowski's tests the morning star reversed about 78% of the time and the evening star about 72%, but they need a proper trend and a genuine stall to earn those numbers."
5. **Quiz question 6's explanation (line 95).** Drop ", and other studies land in the 60s".

## Scenes

`[mark]` is a timing marker the visuals sync to in each language.

### 1. title
> Morning star and evening star. Module two, lesson ten.

### 2. intro (lines 1–5)
> The darkest part of the night comes just before dawn. Then the sky turns grey, neither dark nor light, and then the sun comes up: night, the in-between, day. [define] The morning star is three candles that tell that story: a big red candle, the night; a small candle sitting below it, the star; and a big green candle that closes well into the first candle's body, the day. [evening] The evening star is the mirror, at the top of a rise: dusk instead of dawn. Three candles are harder to fake than one, and the third one is a built-in confirmation.

*Visual:*
- A night-grey-day sky strip (illustration).
- At [define], the morning-star figure: candle one, the star and candle three appear in turn, labelled "night", "star" and "day".

### 3. rules (lines 7–13)
> Here are the morning star's rules. [trend] It comes after a decline, and candle one is a big red candle. [star] Candle two has a small body, sitting below candle one's body. Classically it gaps down, so the bodies do not touch. [third] Candle three is a big green candle that closes well into candle one's body, at least past the middle. The star's colour does not matter.

*Visual:* the figure with a checklist. The numbers on screen:
- the star's body (96.30 to 96.50) sitting below candle one's close, 97.20;
- candle one's midpoint, 99.75;
- the third close, 102.20.

**`Computed`.**

### 4. psychology (lines 17–21)
> [day1] Day one is a big win for the sellers. [day2] Day two opens lower, which should mean more selling, and then goes nowhere. The body is tiny: the sellers had every advantage and could not press it. That stall is the hinge of the whole pattern. [day3] Day three, buyers arrive and drive price back up through most of day one's losses. Confident selling, then hesitation, then confident buying, across three sessions.

*Visual:* the three days appear one by one on the figure, each with its own short note.

### 5. seesaw (the lesson's eli5, lines 23–27)
> Think of a seesaw. A heavy kid sits on one end, and it slams down: the red candle. A lighter kid climbs onto the other end, and the seesaw wobbles, nearly balanced: the star. Then a second kid jumps on with the light one, and it swings hard the other way: the green candle. The star is the wobble. Without it, the seesaw would not have swung.

*Visual:* **Illustration.**

### 6. evening (lines 29–38)
> The evening star is the mirror. After a rise, a big green candle. [star] Then a small star, above it, after a gap up that pulls in the last eager buyers, and the session goes nowhere. [third] Then a big red candle that closes deep into the green body. Everyone who bought the star is now losing. Dusk.

*Visual:* the evening-star figure. The third close, 96.71, sits 88% of the way into the green body. **`Computed`.**

### 7. star (lines 40–46)
> The middle candle decides the quality of the pattern. [small] The smaller the star, the better: a doji star is the strongest. A star with a medium body may not be a star at all. [gap] A real gap between the star's body and its neighbours makes it stronger: the market lurched one way, then reversed, leaving the star alone. [colour] And its colour does not matter.

*Visual:* three versions of the star side by side: a doji, a small body and a medium body (labelled "not a star"). **Illustration.**

### 8. third (lines 48–52)
> The third candle is the confirmation, and it is built into the pattern: you cannot call it a morning star until it has closed. [deep] The deeper it closes into the first candle's body, the stronger the pattern. Here it wins back ninety-eight percent of the first body, almost to the first candle's open. [volume] And heavy volume on the third candle shows real buying, not a thin bounce.

*Visual:* the first body is measured from 97.20 to 102.30, and the third close, 102.20, is marked at 98%. **`Computed`.**

### 9. valid (lines 54–58)
> Both need a clear trend. The best morning stars come after a long decline, at support; the best evening stars after a long rise, at resistance. [timeframe] And stars work best on daily and weekly charts, because the gaps that isolate the star come from the overnight break. On a five-minute chart, the star is usually just a small candle with no gaps: a weaker version.

*Visual:* the figure with the decline shaded, then a daily star against an intraday one with no gaps (illustration).

### 10. trade (lines 60–66)
> A trade idea to practise. [entry] Enter at the close of the third candle: here, one hundred and two point two. Some traders wait for a fourth candle to close higher, a slightly worse price for more certainty. [stop] Put the stop below the low of the star, the lowest point of the pattern: ninety-five point four. That is six point eight of risk. The stop is often a long way off, because the pattern spans three sessions: size your position to that distance.

*Visual:* entry, stop and risk on the figure. **Entry 102.20, stop 95.40 (the star's low) and risk 6.80 are `computed`.**

### 11. lazy (the lesson's warning, lines 68–72)
> Watch out for the lazy star. If the middle candle has a medium body, or overlaps the first candle's body heavily, you do not have a star. You have three ordinary candles. The whole meaning depends on the middle session being a genuine stall. If it was not, the third candle is just a bounce.

*Visual:* the figure's star swapped for a medium body that overlaps candle one, labelled "not a star". **Illustration.**

### 12. reliability (lines 74–78, corrected)
> How reliable are they? Among the best. In Thomas Bulkowski's published tests, the morning star reversed the downtrend about seventy-eight percent of the time, and the evening star the uptrend about seventy-two percent. [ranks] His overall ranking also weighs how far price moved afterwards, and there the evening star places fourth and the morning star twelfth, out of a hundred and three. [warn] Two things to remember. Those numbers need a proper trend, a small star and a deep third candle: a sloppy star in a range does not earn them. And no pattern promises a big move.

*Visual:* two bars (78 and 72) against a coin-flip line, the two ranks, and the credit.

### 13. takeaways (lines 80–87, as fixed)
> To recap. A morning star: after a decline, a big red candle, a small star below it, and a big green candle closing past the middle of the red body. The evening star is the mirror, after a rise. The star is the stall; the third candle is the resolution, and a built-in confirmation. Smaller stars, real gaps and deep third candles make it stronger. Put the stop beyond the star.

### 14. quiz (lesson quiz question 3, line 92)
> Quick check. The middle candle of a possible evening star has a medium-sized body that overlaps the first candle heavily. What do you have? A very strong evening star? Or three ordinary candles? [think] Take a second to think. [pause 2.5] [reveal] Three ordinary candles. Without a genuine stall in the middle, the pattern loses its meaning.

### 15. end (line 98)
> Now practise in the pattern trainer. When you see three candles with a small one in the middle, check three things: the trend before, the size of the star, and how deep the third candle closes.

---

**After your approval:**
1. Apply the lesson fixes and rerun the site's checks.
2. Telugu translation.
3. Data module, a star detector with tests, and the scenes.
4. Review stills in both languages, then the renders. Package to `out/publish/m02-candlestick-patterns/10-morning-evening-star/v3/`.
