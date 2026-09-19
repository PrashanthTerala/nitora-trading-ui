import { Link } from 'react-router-dom';
import { SYMBOLS } from '@/engine/market/symbols';

export function GuidePage() {
  return (
    <div className="prose-lesson mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight">How TradeLab Academy works</h1>
      <p className="mt-3 text-lg text-ink-soft">The site has four rooms. Use them in this order the first time, then move between them freely.</p>

      <h2>1. Learn</h2>
      <p>
        Thirteen modules, ordered like school years. Each lesson ends with key takeaways and a short quiz. Your progress and best quiz scores are saved in this browser (nothing is sent
        anywhere). Do not skip Module 7, Risk Management: it is the part that keeps you alive.
      </p>

      <h2>2. Simulator</h2>
      <p>
        A paper-trading platform with a synthetic market. The eight instruments are invented, but their behaviour is modelled on real asset classes so you meet calm, trending, mean-reverting
        and gappy markets:
      </p>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Personality</th>
          </tr>
        </thead>
        <tbody>
          {SYMBOLS.map((s) => (
            <tr key={s.symbol}>
              <td className="font-mono font-bold">{s.symbol}</td>
              <td>{s.name}</td>
              <td className="text-sm text-ink-soft">{s.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        The market has a clock you control. <strong>Play</strong> lets candles form live at the speed you choose. <strong>Step</strong> advances exactly one candle on the current
        timeframe, which is the best way to practise: decide, step, see what happened, repeat. All eight symbols share the same clock, so a position in BLUE keeps living while you look at
        NOVA.
      </p>
      <p>
        Orders work like a real broker: market, limit, stop and stop-limit, with optional take-profit and stop-loss brackets, DAY or GTC, long and short, configurable leverage,
        commissions, slippage, and a margin call that liquidates you if equity drops below maintenance. Every fill is logged.
      </p>
      <p>
        Everything is deterministic from a seed. The same seed always produces the same market, so you can replay a session. <strong>New market</strong> rolls a fresh seed. Your
        account, orders and clock position are saved in this browser.
      </p>
      <h3>Replaying real history</h3>
      <p>
        The toggle above the chart switches between <strong>Synthetic</strong> and <strong>Real data</strong>. Synthetic is the default and needs nothing: it works offline, it
        generates unlimited history at any timeframe, and it is the market every worked example in the lessons is written against.
      </p>
      <p>
        Real data replays actual historical bars for instruments you will recognise, one bar at a time, with the same order ticket and the same clock. It is worth using once the
        mechanics are second nature, because real markets do things invented ones do not: earnings gaps, holiday sessions, the same level failing three times and holding the
        fourth. It needs a small service running alongside the site, and if that service is not running the simulator says so and carries on in synthetic mode.
      </p>
      <p>
        Two honest limits. History is bounded by what the data provider gives, which is roughly a week of one-minute bars but years of daily ones, so changing timeframe reloads
        rather than re-slicing. And switching between the two markets starts a fresh account, for the same reason rolling a new market does: a position is priced against the
        market that created it, so carrying it across would invent profit that was never made.
      </p>

      <h3>Live</h3>
      <p>
        The third source follows the market as it trades now. The clock belongs to the market rather than to you, so there is no play, step or speed: the
        candle on the right edge grows while you watch it. It is the mode to use when you want to feel what it is like to make a decision without knowing
        what the next bar does, which is the one thing replay can never quite reproduce.
      </p>
      <p>
        <strong>Live means crypto, and it means running your own copy.</strong> Bitcoin and Ethereum are what you can follow, and they are genuinely live: the
        site holds one connection open to the exchange and builds the forming candle out of actual trades as they happen, rather than asking every so often
        what the price is now. A trade reaches the chart in well under a second, and the candle on the right edge really is the one being traded.
      </p>
      <p>
        Real data of any kind is a local feature, and that is a licensing boundary rather than a technical one. Market prices are licensed, and the licensed
        act is the showing: looking at a chart yourself is one thing, putting it in front of a visitor is redistribution, and that needs permission you do
        not get by default. This is true of share and index prices, and it is true of the crypto feed too, whose terms are free of charge but still bar
        showing the data, or charts drawn from it, to anyone outside your own organisation without written consent.
      </p>
      <p>
        The bar above the chart always says what you are looking at — real time, delayed by a stated amount, or delay unknown — and it says the last of
        those rather than guessing. A <em>LIVE</em> badge over a fifteen-minute-old price is exactly the small lie this site exists to argue against.
      </p>
      <p>
        So the version of this site you are most likely to meet runs on the synthetic market, which needs no permission from anyone: it is invented, it works
        offline, and every worked example in all 128 lessons is written against it. Real replay and live mode are there for when you run your own copy.
      </p>
      <p>
        None of which should matter much to you. Nothing in this course depends on being fast: you are learning to read structure and manage risk, and a
        chart fifteen minutes behind teaches both exactly as well as one that is instant. The moment being first actually matters, you have left the kind of
        trading this site is trying to teach.
      </p>

      <h2>3. Trainer</h2>
      <p>
        Two drills. <strong>Name the pattern</strong> shows a randomly generated candle snippet and asks which pattern it is. <strong>Next candle</strong> shows a real-looking chart
        and asks whether the next few candles will close higher or lower; it is deliberately humbling and teaches that even good reads are only edges, not certainties.
      </p>

      <h2>4. Journal</h2>
      <p>
        Every completed round-trip trade from the simulator lands here with its P&amp;L, R-multiple (when you set a stop), exit reason and duration. Tag your setups and mistakes, and
        watch expectancy, profit factor, win rate and maximum drawdown update. Module 12 explains how to read these numbers.
      </p>

      <h2>Honesty notes</h2>
      <ul>
        <li>Synthetic data has no real news, earnings or macro, so it teaches mechanics and discipline rather than fundamentals. Real-data replay does carry those events, but you are seeing them after the fact, already knowing a chart exists to the right of the bar you are on.</li>
        <li>Fills are optimistic compared with thin real markets. Real slippage on news is worse than anything here.</li>
        <li>Nothing on this site is financial advice. It is a school, not a broker.</li>
      </ul>
      <p>
        <Link to="/learn" className="btn-primary">
          Start learning
        </Link>
      </p>
    </div>
  );
}
