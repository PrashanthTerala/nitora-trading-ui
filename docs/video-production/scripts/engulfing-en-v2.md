# Bullish and Bearish Engulfing: English script v2 (approved 2026-10-16)

- **Lesson:** `m02-candlestick-patterns/06-engulfing` (sha256 `415d998e…` after the approved wording fixes, 92 lines).
- **Style:** cinematic, as for Moving Average Crossovers v3. Candlesticks, a camera, a spotlight, no overlapping layers, English on-screen text, plain words a 10-year-old could follow.
- **Length:** about 7 minutes of English narration (ESTIMATE).
- **Numbers:** every number is either the lesson's own or computed from the site's figure data. They are marked `computed` below and are checked by `check.mjs`, as in the crossover lesson.

## Audit: claims the video will and won't make

| Lesson line | Claim | Video |
|---|---|---|
| 5 | "the most popular two-candle pattern on the planet" | **Not said.** Unsourced superlative |
| 5 | "it tests better than most" | Covered by the sourced numbers in scene 12 |
| 44 | covering more prior bodies is "stronger" | Said only as the lesson's reason: "traps more sellers" |
| 70 | Bulkowski: bullish engulfing reverses ~63%, bearish ~79% | **Verified** on thepatternsite.com (BullEngulfing, BearEngulfing). Said with credit |
| 70 | "later studies with different rules land closer to 60%" | **Not said.** No source |
| (source) | Bulkowski also ranks the bearish engulfing's *overall performance* 91 of 103: "the trend after the breakout is short-lived" | **Added**, with credit. It supports the lesson's own caution in line 72 |

**Proposed lesson fixes** (site content, so they need your approval, like the crossover fixes):
1. Line 5: drop "the most popular two-candle pattern on the planet".
2. Line 70: drop "later studies … closer to 60%", and add Bulkowski's short-lived-trend finding.
3. Takeaway 6 (line 80) and quiz question 6 (line 89) both rely on the "60% to 79%" range. Restate them as "about 79% (bearish) and 63% (bullish) in Bulkowski's tests".

## Scenes

`[mark]` = a timing marker the visuals sync to in each language.

### 1. title
> Bullish and bearish engulfing. Module two, lesson six.

*Visual: kinetic title over the bullish-engulfing chart, out of focus.*

### 2. intro (lines 1–3)
> Imagine a playground argument. Yesterday, one kid said something small and mean. Today, the other kid answers so loudly, and so completely, that it covers everything said yesterday, and then some. [define] That is an engulfing pattern: two candles, where the second candle's body completely covers the first candle's body, in the opposite colour. A bullish engulfing is a small red candle, then a big green one that swallows it. A bearish engulfing is the mirror: a small green candle, then a big red one.

*Visual: two speech bubbles, the second swallowing the first. At [define], two big candles, the green body growing until it covers the red one.*

### 3. rules (lines 9–12)
> Here are the exact rules. Candle two is the opposite colour. [open] It opens beyond candle one's close, [close] and it closes beyond candle one's open, so its body covers candle one's body completely. [wicks] In the classic definition, only the bodies count, not the wicks. [size] And candle two should be big compared with recent candles. A tiny candle swallowing an even tinier one is technically an engulfing, and practically meaningless.

*Visual: the figure's two candles, large, with their real prices labelled as drawn (101.12 / 99.32 and 98.92 / 103.22). Each rule lights up its part of the candle: the open below the close, the close above the open, the bodies outlined and the wicks dimmed. Then a tiny pair for comparison.*

### 4. bullish (lines 14–20)
> Here is a bullish engulfing after a decline. Walk through the two days. [day1] On day one, sellers win again, but only by a little. The body is small. [day2] On day two, price opens even lower, which looks like more of the same. Then buyers arrive in force. They push price above where yesterday started, and keep going. [flip] By the close, every seller from yesterday is losing money. Control has flipped in two sessions.

*Visual: the site's bullish-engulfing figure as cinematic candles. The camera moves in on the pair. Day two's candle grows tick by tick from its open (98.92, below 99.32) up through 101.12 to its close (103.22). The "sellers losing" zone is shaded.*

### 5. wave (lines 22–26, the lesson's eli5)
> Picture a sandcastle, knocked down one little kick at a time. Then a wave comes in, bigger than all the kicks put together, and washes it flat. Yesterday's little kick is gone. The engulfing candle is that wave.

*Visual: illustration (small kicks, then a wave), labelled as an illustration.*

### 6. bearish (lines 28–32)
> The bearish engulfing is the mirror image, at the top of a rise. Day one is a small green candle: buyers still winning, but barely. Day two opens higher, which pulls in the last optimists. Then sellers take over, and drive the close below yesterday's open. Everyone who bought in the last two sessions is now losing.

*Visual: the bearish figure, with the same choreography mirrored.*

### 7. valid (lines 34–36)
> But an engulfing pattern is a reversal pattern, so it needs a trend to reverse. A bullish engulfing needs a decline before it. A bearish engulfing needs a rise. In a sideways range, candles engulf each other all the time, because price is just going back and forth. [range] On this sideways chart, there are seven engulfing patterns, and none of them means anything.

*Visual: the site's range regime as candles. Every engulfing pair the detector finds (`video/src/engulfing/detect.ts`, the lesson's body rule) is outlined, and the count rises to 7 (bars 1, 8, 26, 35, 44, 71, 80). **The 7 is `computed`**, so the spoken number is checked. The detector and the video's numbers are tested by `video/scripts/test-engulfing.mjs` (14 tests, including both of the site's engulfing figures).*

### 8. locations (lines 38–44)
> The best places, in order. [level] First, at a clear support or resistance level, after a trend. [slowing] Second, after a long trend that has started to slow down, with smaller bodies. [volume] Third, after a trend, with high volume on the engulfing candle. [count] Some traders also count how many earlier bodies the engulfing candle covers. Covering three or four red bodies traps more sellers than covering just one.

*Visual: three numbered panels on candles, each lighting up as it's said.*

### 9. confirm (lines 46–52)
> The classic confirmation is a third candle that closes beyond the engulfing candle: higher for a bullish one, lower for a bearish one. [volume] Volume matters too. High volume on the engulfing candle means a real change of hands. On thin volume, a big candle can be just one large order. [timeframe] And bigger timeframes carry more weight. A daily engulfing is a whole day of trading. A one-minute engulfing can be a single order.

*Visual: the bullish figure's follow-through candle closing at 105.22, above the engulfing close, highlighted. Then volume bars, then a daily candle against a one-minute candle.*

### 10. trade (lines 54–60)
> Here is a trade idea to practise, on this example. [entry] Enter when the confirmation candle closes above the engulfing candle's high: here, at one hundred and five point two two. [stop] Put the stop below the low of the pattern: ninety-eight point five two. That is six point seven of risk. Aim for the next resistance, or a fixed multiple of that risk. [why] Why there? The engulfing candle's low is where buyers proved control. If price falls back through it, control is lost, and the pattern has failed.

*Visual: entry, stop and risk drawn on the figure's candles. **Entry 105.22, stop 98.52 and risk 6.7 are `computed`** from the figure data as the site draws it (the draft said 105.2 / 98.4 / 6.8, the preset's literal prices before the site rebases the pattern onto the trend).*

### 11. trap (lines 62–66, the lesson's danger callout)
> A common trap. The engulfing candle is enormous, say three times the average range, and you buy at its close. Your stop must go below its far end, so your risk is huge, and much of the move may already be over. Big engulfing candles are strong signals, and terrible entries. Wait for a pullback into the body, or take a smaller position.

*Visual: a normal engulfing next to one three times the average range, with the stop distance compared. Labelled as an illustration.*

### 12. reliability (lines 68–72, verified)
> How reliable is it? In Thomas Bulkowski's published tests, the bearish engulfing reversed the uptrend about seventy-nine percent of the time, and the bullish engulfing about sixty-three percent. [warn] Two warnings. Those counts only include patterns with a proper trend before them. And reversal means price moved the expected way, not that it moved far. In his tests, the trend after a bearish engulfing was often short-lived. So an engulfing is a good reason to expect a turn, not a promise of how big it will be.

*Visual: two bars (79% and 63%) with the credit "Source: T. Bulkowski, thepatternsite.com" on screen. The warnings follow as cards.*

### 13. takeaways (lines 74–81)
> To recap. An engulfing pattern is two candles: the second is the opposite colour, and its body fully covers the first. It needs a trend before it: inside a range, it means nothing. Confirm it with a third candle, and look for high volume. Put the stop beyond the far end of the engulfing candle. And very big engulfing candles mean wide stops and poor entries.

### 14. quiz (lesson quiz question 2, line 85)
> Quick check. Where does a bullish engulfing mean the most? In the middle of a sideways range, or at a support level after a decline? [think] Take a second to think. [pause 2.5] [reveal] At a support level, after a decline. A reversal pattern needs a trend to reverse, and a level makes it stronger.

### 15. end (line 92)
> Now practise in the pattern trainer. Before you answer, check two things: is the whole first body covered, and was there a trend before it?

---

**After your approval:**
1. Telugu (Google Achird, friendly, flowing), Hindi (Google Achird) and Spanish (Piper) translations.
2. Build the cinematic scenes, plus an engulfing detector with tests.
3. Review stills in all four languages, then the full renders.
4. Package to `out/publish/m02-candlestick-patterns/06-engulfing/v3/`.
