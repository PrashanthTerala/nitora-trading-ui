# Moving Average Crossovers: English script v2 (draft for approval)

**What changed from v1, which you approved on 2026-10-15:**
- **More explanation:** two new teaching scenes, simple analogies added to three existing scenes, and a closing quiz question.
- **Plain words:** everything is pitched so a 10-year-old could follow. Long sentences are split, and every new idea gets a picture before it gets a number.
- **Nothing invented:**
  - The analogies come from the curriculum's own "explain like I'm five" (eli5) callouts where possible: the beach waves from lesson 02, the buckets from this lesson.
  - The two analogies of my own (the ship and the tug of war) only restate what the lesson already says.
  - The one new sum (6 + 8 + 7 + 9 + 10 = 40, ÷ 5 = 8) will be computed and checked by `check.mjs` like every other number.

**Length:** about 5 min 15 s of English narration, up from 3 min 34 s. Each scene still gets its own visual.

**Legend:**
- **KEPT:** the approved v1 wording.
- **EXPANDED:** v1 plus a new part, shown in *italics*.
- **NEW:** a new scene.

---

### 1. title (KEPT)
Moving average crossovers. Module five, lesson three.

### 2. average (NEW): what a moving average is
*Source: lesson 02-moving-averages, lines 1–3 (waves and tide) and line 9 (SMA definition).*
*Visual: waves running up a beach; then five price cards, adding up to 40 and dividing to 8; then the window sliding forward one card at a time.*

> Before the crossover, a quick refresher. Stand on a beach and watch the waves. Each one reaches a different spot on the sand, so a single wave can't tell you whether the tide is coming in. But if you take the average of where the last ten waves reached, the tide becomes clear. A moving average does the same thing to price. Take the last few closing prices, add them up, and divide by how many there are. Say the last five closes were six, eight, seven, nine and ten. Together they make forty. Forty divided by five is eight. That's the average. Tomorrow, you drop the oldest close, add the newest one, and work it out again. The window slides forward one day at a time, so the average moves along with price. That's why it's called a moving average.

### 3. race (KEPT): two runners
> Picture two runners on a track. One is a sprinter, who reacts to every change in pace. The other keeps a steady rhythm. A moving average crossover is exactly this race. You draw a fast average and a slow average on the same chart. When the fast one crosses above the slow one, recent prices are running ahead of older prices. That is what an uptrend looks like from the inside. When it crosses below, the opposite.

### 4. buckets (NEW): why the fast one moves first
*Source: this lesson's eli5 callout, lines 45–49, using the 50/200 pair instead of 9/21.*
*Visual: two buckets, a small "last 50 days" and a big "last 200 days". Higher-priced balls pour in; the small bucket's level rises fast, the big one's slowly, and the levels swap: the cross.*

> Here's another way to picture it. Think of two buckets of prices. The small bucket holds the last fifty days. The big bucket holds the last two hundred. When new, higher prices start pouring in, the small bucket's average rises quickly, because each new price is a big part of a small bucket. The big bucket is still full of old, lower prices, so its average rises slowly. The moment the small bucket's average climbs above the big one's, that's the crossover. And because it takes a while for new prices to fill a bucket, the signal always comes a little late.

### 5. signchange (EXPANDED): the sign flip
> There is no new formula here. Take the fast average, minus the slow average. Yesterday, the difference was minus zero point five: fast below slow. Today, it is plus zero point three: fast above slow. The difference flipped from negative to positive, so today is a bullish crossover. A flip from positive to negative is a bearish crossover. That sign flip is the entire signal. *In plain words: is the fast runner in front, or behind? The moment that answer changes, that's the cross.*

### 6. golden (KEPT): the famous pair, on the chart
> Some pairs have names, because so many people watch them. The golden cross is the fifty-day simple moving average crossing above the two-hundred-day. The death cross is the fifty-day crossing below it. Both are slow, big-picture signals. This chart is synthetic, made for teaching, and it has one of each.

### 7. lag (EXPANDED): why it's always late
*Visual addition: a small ship icon turning slowly beside the measured brackets.*
> Now look at the timing. The crossover waits until enough closes have piled up to drag the whole fast average across the slow one. That wait is the lag. You miss the first chunk of every move, and you give back a chunk at the end, before the exit cross fires. *Think of a big ship. It can't turn the moment the captain spins the wheel. It swings round slowly. A slow average turns the same way: late, but steady.*

### 8. tradeoff (KEPT): fast pairs against slow pairs
> Faster pairs, such as the nine and twenty-one exponential averages, give more signals, earlier, with more false ones. Slower pairs give fewer signals, later, with fewer false ones. On this same chart, the fast pair crossed again and again. The fifty and two-hundred crossed only twice.

### 9. uses (KEPT): three ways traders use it
> Traders use crossovers in three ways. As an entry and exit: buy the bull cross, sell the bear cross. On a market that trends, this can make money, because the few big trends pay for the many small losses. On a market that ranges, it bleeds. As a bias filter: with fast above slow, only look for long setups. And as a trend-health check: when the averages flatten and braid together, the trend is tired.

### 10. whipsaw (EXPANDED): the danger
*Visual addition: a rope with a marker sliding left and right over the range chart.*
> Which brings us to the crossover's natural enemy: whipsaw. In a sideways market, the fast average crosses the slow one again and again, each cross a few candles after a swing that has already finished. Buy every bull cross and sell every bear cross in a range, and you buy the top and sell the bottom of every wobble. *It's like a game of tug of war where the rope keeps sliding back and forth. If you switch sides every time it moves, you always join the side that's about to lose.* Ten small losses in a row is normal for this method in chop.

### 11. structure (KEPT): combining with structure
> A crossover is a direction signal only. It cannot tell you where to put a stop. So use the cross as the last checkmark, not the first. Take the trade because of the structure, such as a breakout that retests its level and holds, and let the cross add a little confidence. A bull cross in the middle of a range, with no breakout, is one you ignore.

### 12. takeaways (KEPT)
> To recap. A crossover fires when the difference between a fast and a slow average changes sign. The golden and death crosses are slow, widely watched signals. Faster pairs signal earlier, with more false alarms. Use crossovers as a filter or a confirmation, not as a stand-alone trigger. And when the averages braid together, stop taking their signals.

### 13. quiz (NEW): check yourself
*Source: this lesson's quiz, question 2 (line 88), the question and answer as the lesson gives them.*
*Visual: the question with two answer cards, a short pause with a countdown ring, then the right card turns green.*

> Quick check. What is a golden cross? Is it the nine-day average crossing above the twenty-one-day? Or the fifty-day average crossing above the two-hundred-day? Take a second to think. … It's the fifty-day crossing above the two-hundred-day. The reverse, crossing below, is the death cross.

### 14. end (KEPT)
> Now open the simulator, mark every crossover you can find, and notice where the failed ones cluster.

---

**After you approve:**
1. I translate the changes into Telugu (friendly style; voice: Google Chirp 3 HD Achird) and Spanish (Piper ald).
2. I build the new visuals in Remotion: waves and window, buckets, ship, rope, quiz.
3. I render all three to `video/out/v2/` with captions, loudness normalised and language tags, then stop for your review.
