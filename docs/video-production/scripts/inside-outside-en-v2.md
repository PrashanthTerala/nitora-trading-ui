# Three Inside and Three Outside: English script v2 (approved 2026-10-17)

- **Lesson:** `m02-candlestick-patterns/12-three-inside-outside` (sha256 `591fdb36…` before the approved fix; 109 lines).
- **Languages:** English and Telugu only.
- **Style:** the studio look, as in the soldiers lesson:
  - a brand opening and chapter cards;
  - kinetic headlines;
  - candles that build with a live price tag;
  - a camera push with depth of field;
  - levels that draw themselves;
  - labels on what they name;
  - tags in the corner, and the icon on the end card.
- **Length:** about 7½ minutes of English narration (ESTIMATE).
- **Numbers:** every number is the lesson's own or is computed from the site's figure data as the site draws it, and is checked by `check.mjs`.

## Audit: claims the video will and won't make

Sources: Thomas Bulkowski's pattern pages, read 2026-10-17. All ranks are out of 103 patterns.

| Lesson line | Claim | What the source says | Video |
|---|---|---|---|
| 10–11 | Three inside up: a bullish harami, then a green third candle closing above candle one's open; "some traders relax this to a close above candle two's high, but the classic rule is the stricter one" | `ThreeInsideUp.html`: the last day "closes above the prior close". `ThreeInsideDown.html`: "must close lower, but can be any color". So Bulkowski's tested rule is the **looser** one. No source for "candle two's high" or for "classic" | **Corrected.** The video teaches the lesson's stricter rule and says Bulkowski tested the looser one |
| 34–35, 44–45 | Three outside: an engulfing, then a third candle closing beyond candle two's close | `ThreeOutsideUp.html`: "price closes higher"; `ThreeOutsideDown.html`: "a lower close" | **Verified** |
| 86 | Bullish harami ~53%; three inside up ~65%; three inside down ~60% | "Bullish reversal 65% of the time" (rank 20); "Bearish reversal 60% of the time" (rank 56). The harami lesson's 53% (bullish) and 47% (bearish) | **Verified.** Adds the bearish harami's 47% |
| 88 | Three outside up ~75% vs bullish engulfing 63%; three outside down ~69% vs bearish engulfing 79% | "Bullish reversal 75% of the time" (rank 34); "Bearish reversal 69% of the time" (rank 39). The engulfing lesson's 63% and 79% | **Verified** |
| 90 | Confirmation "reliably earns its keep" on stalls "(harami, doji, spinning top)", and is mixed on decisive shifts "(engulfing, marubozu)" | These pages test only harami and engulfing bases. Nothing here on doji, spinning top or marubozu | **Narrowed** to the harami and the engulfing |

**Proposed lesson fixes** (site content, so they need your approval):
1. **Line 11.** Replace "Some traders relax this to a close above candle two's high, but the classic rule is the stricter one." with "Bulkowski's tests used a looser rule, a close above candle two's close, so his numbers below are for that looser version."
2. **Line 86.** "…has the plain bullish harami at about 53% and the bearish harami at about 47%, while three inside up comes in around 65% and three inside down around 60%…"
3. **Line 90.** "The practical lesson from these numbers: confirmation earned its keep on the harami, which is only a stall, and its effect was mixed on the engulfing, which is already a decisive shift. Spend your patience where it pays."
4. **Takeaway (line 98).** "Confirmation lifted the bullish harami from about 53% to about 65%, and the bearish from about 47% to about 60%; its effect on the engulfing patterns is mixed."

## The figures as drawn (rebased by the site)

| | Candle 1 (open → close) | Candle 2 | Candle 3 | The test |
|---|---|---|---|---|
| Three inside up | 102.30 → 97.10 (low 96.80) | 98.50 → 100.40 | 100.50 → 103.60 | 103.60 above the first open, 102.30 |
| Three inside down | 98.93 → 104.23 (high 104.53) | 102.83 → 101.53 | 101.43 → 98.13 | 98.13 below the first open, 98.93 |
| Three outside up | 100.57 → 98.77 | 98.37 → 102.67 (low 97.97) | 102.77 → 105.27 | 105.27 above the second close, 102.67 |
| Three outside down | 99.37 → 101.27 | 101.67 → 97.27 (high 101.97) | 97.17 → 94.47 | 94.47 below the second close, 97.27 |

**`Computed`.**

## Scenes

`[mark]` is a timing marker the visuals sync to in each language. Chapters are in brackets.

### 1. title
> Three inside and three outside. Module two, lesson twelve.

### 2. intro (lines 1–5)
> In the last few lessons you kept hearing the same instruction: wait for the next candle to close in the predicted direction. [named] Traders added that candle so often that the confirmed versions got their own names. [inside] Three inside up is a bullish harami plus a confirming third candle; three inside down, the bearish mirror. "Inside", because the harami's small candle sits inside the big one. [outside] Three outside up is a bullish engulfing plus confirmation; three outside down, its mirror. "Outside", because the engulfing candle wraps around the one before. [new] If you know the harami and the engulfing, you already know these four. What is new is what the third candle must do, and what the numbers say about adding it.

*Visual:* the harami building; a third candle completes it into "three inside up". Then the engulfing, completed into "three outside up". A 2×2 grid of the four names.

### 3. insideup [Three inside] (lines 7–15)
> Three inside up. [trend] A downtrend. [harami] A big red candle, then a small candle whose body sits inside it: a bullish harami. [third] Then a green candle that closes above candle one's open. Here: one hundred and three point six, above the first open at one hundred and two point three. [story] Day one, sellers win big. Day two, they stall. Day three, buyers push price above where the big red candle began, so every seller from day one is now losing. The stall has become a turn. [looser] One note: Bulkowski's tests used a looser rule, a close above candle two's close, so his numbers are for that version.

*Visual:* the figure builds candle by candle. The first open draws itself as a level, then the third close rises through it. **103.60 vs 102.30: `computed`.**

### 4. trolley (the lesson's eli5, lines 17–21)
> Remember the shopping trolley that hit thick grass and slowed down? Three inside up is the trolley slowing on day two, then rolling back up the slope, past where it started, on day three. Now you know which way the grass sent it.

*Visual:* **Illustration.** A slope, a patch of grass, a trolley that slows and then rolls back up past its start mark.

### 5. insidedown (lines 23–29)
> Three inside down is the mirror. After a rise, a big green candle, then a small one inside it: a bearish harami. [third] Then a red candle closing below candle one's open: ninety-eight point one three, below ninety-eight point nine three. Buyers stalled on day two, and were overrun on day three.

*Visual:* the figure, with the first open drawn and the third close falling through it. **`Computed`.**

### 6. outsideup [Three outside] (lines 31–39)
> Three outside up. [trend] A downtrend. [engulf] A small red candle, then a green candle whose body covers it completely: a bullish engulfing. [third] Then another green candle that closes higher than candle two's close. Here: one hundred and five point two seven, above one hundred and two point six seven. [why] The engulfing showed buyers taking control. The third candle shows they kept it. One big green candle can be one large order; two closes in a row are harder to explain away.

*Visual:* the figure builds; candle two's close draws itself, and the third close rises past it. **`Computed`.**

### 7. outsidedown (lines 41–47)
> Three outside down: after a rise, a bearish engulfing, then a red candle closing lower than candle two's close. Ninety-four point four seven, below ninety-seven point two seven. Sellers took control on day two, and kept it on day three.

*Visual:* the figure, as above. **`Computed`.**

### 8. third [The third candle] (lines 49–60)
> What exactly must the third candle do? [inside] For the inside versions: close beyond the first candle's open. [outside] For the outside versions: close beyond the second candle's close. [why] The inside versions have the harder test. The harami's small candle started inside a big one, so the third candle must travel further to prove the turn. The engulfing already did most of the work, so the outside versions only need one more close in the same direction.

*Visual:* the four rules as a table that builds row by row. Then two side-by-side figures with the two distances drawn: the inside up's from candle two's close to the first open, and the outside up's from candle two's close.

### 9. valid (lines 62–66)
> Everything from the harami and engulfing lessons applies. These are reversal patterns: they need a prior trend, they are strongest at support and resistance, and on daily charts. [watch] And because they contain their own confirmation, they are often the version you actually trade. Seeing a harami tells you to watch. Seeing three inside up tells you the watch is over.

*Visual:* the inside up figure with the decline shaded. At [watch], "harami: watch" on candles 1–2, then "three inside up: the watch is over" on the whole pattern.

### 10. trade [Trading them] (lines 68–76)
> Since the third candle is the confirmation, most traders enter at its close or the next open. [inside] Three inside up: enter at the third close, one hundred and three point six, with the stop below the big red candle's low, ninety-six point eight. That is six point eight of risk. [outside] Three outside up: enter at the third close, one hundred and five point two seven, with the stop below the engulfing candle's low, ninety-seven point nine seven: seven point three of risk. [size] The down versions mirror these, with stops above the pattern's high. Three sessions of movement can put the stop a long way off, so size the position to the stop.

*Visual:* the inside up trade, then the outside up trade, with entry, stop and risk on each. **Entries 103.60 / 105.27, stops 96.80 / 97.97, risks 6.80 / 7.30: `computed`.**

### 11. cost (the lesson's warning, lines 78–82)
> Confirmation costs you price. A trader who bought at the harami's small candle got in at one hundred point four. Waiting for the third candle meant one hundred and three point six: three point two later, with a wider stop. [tradeoff] That is the trade-off: fewer false signals, but a smaller share of each move. Confirmation buys accuracy with price, and you will decide in your own testing which you prefer.

*Visual:* the inside up figure: the early entry (100.40) and the confirmed one (103.60), with the gap between them measured. **3.20: `computed`.**

### 12. reliability [How reliable] (lines 84–90, as fixed)
> Here is the interesting part. [harami] In Bulkowski's tests, adding the confirmation helped the harami a lot. The bullish harami reversed about fifty-three percent of the time; three inside up, about sixty-five. The bearish harami, about forty-seven; three inside down, about sixty. [engulfing] The outside versions are mixed. Three outside up, about seventy-five, above the bullish engulfing's sixty-three. But three outside down, about sixty-nine: below the bearish engulfing's seventy-nine. [lesson] So confirmation earned its keep on the harami, which is only a stall. On the engulfing, already a decisive shift, its effect was mixed. Spend your patience where it pays.

*Visual:* four pairs of bars (base pattern, then the confirmed version) that fill and settle, with an arrow up or down between each pair. The credit: "Bulkowski's tested versions close beyond the second candle's close."

### 13. takeaways (lines 92–99, as fixed)
> To recap. Three inside up or down is a harami plus a third candle closing beyond the first candle's open. Three outside up or down is an engulfing plus a third candle closing beyond the second candle's close. They need a prior trend, and work best at support or resistance. Enter at the third close, stop beyond the pattern's extreme, and size to the wider stop. And confirmation helps the harami far more than the engulfing.

### 14. quiz (lesson quiz question 3, line 104)
> Quick check. Why does confirmation help the harami more than the engulfing? Does it not help either? Or is the harami only a stall, while the engulfing already showed a change of control? [think] Take a second to think. [pause 2.5] [reveal] The harami is only a stall, and many resume the trend. Confirmation filters those out. The engulfing had already done most of the work.

### 15. end (line 109)
> Now practise in the pattern trainer. Whenever you spot a harami or an engulfing, look at the next candle and ask: does it complete a three inside or a three outside?

*Visual:* the end card with the Nitora icon.

---

**After your approval:**
1. Apply the lesson fixes and rerun the site's checks.
2. Telugu translation.
3. Data module, a detector for the four patterns with tests, and the scenes.
4. Review stills, then render both languages. Package to `out/publish/m02-candlestick-patterns/12-three-inside-outside/v3/`.
