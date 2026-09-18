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
        <li>Synthetic data has no real news, earnings or macro. It teaches mechanics and discipline, not fundamentals.</li>
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
