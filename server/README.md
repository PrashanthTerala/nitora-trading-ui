# TradeLab Academy — market data service

A small Spring Boot service that fetches real historical OHLCV bars, caches them on disk, and
serves them to the browser as clean JSON.

The simulator runs an **entirely synthetic** market by default and needs nothing from this
service. This is the optional "real data" replay mode: point the course at a real instrument and
step through its actual history bar by bar. If this service is not running, the app keeps working
in synthetic mode.

It exists for three reasons, none of which the browser can solve on its own:

1. **CORS.** The upstream chart endpoint sends no CORS headers, so a page cannot call it directly.
2. **Caching.** A classroom of tabs would otherwise hammer an endpoint that owes us nothing.
3. **Swappability.** The provider sits behind a Java interface, so a licensed vendor can replace
   the default one without touching anything else.

---

## Running it

Requires a JDK 21 or newer. Maven is not required — the wrapper fetches it.

```bash
cd server
./mvnw spring-boot:run          # macOS / Linux / Git Bash
mvnw.cmd spring-boot:run        # Windows cmd / PowerShell
```

If you would rather use a Maven you already have:

```bash
"C:/Users/Prashanth/.m2/wrapper/dists/apache-maven-3.9.2-bin/5aq6rqcntpmkk4aam7p0t6i219/apache-maven-3.9.2/bin/mvn" spring-boot:run
```

Build a jar and run that instead:

```bash
./mvnw clean package
java -jar target/tradelab-data-1.0.0.jar
```

The service listens on **http://127.0.0.1:5300** and prints a licensing notice on startup.

Point the front end at it with `VITE_DATA_API` if you move it off the default port; the browser
client defaults to `http://localhost:5300`.

### The Maven wrapper

`mvnw`, `mvnw.cmd` and `.mvn/wrapper/maven-wrapper.properties` use the modern **script-only**
wrapper (`distributionType=only-script`, wrapper 3.3.2). There is no `maven-wrapper.jar` to commit
and no manual step: the scripts download Maven 3.9.2 themselves on first use and cache it under
`~/.m2/wrapper/dists`.

---

## API

Every response is JSON. Every error is `{"error": "<one plain sentence>"}` — never a stack trace.

### `GET /api/health`

```json
{"ok":true,"version":"1.0.0","provider":"yahoo","cache":{"entries":12,"bytes":345678}}
```

Used by the browser to decide whether to offer real-data mode at all.

### `GET /api/symbols`

```json
{"symbols":[{"symbol":"AAPL","name":"Apple Inc.","kind":"stock","decimals":2,
             "unitLabel":"shares","description":"A mega-cap tech name: ..."}]}
```

A static, curated list of 15 instruments — not a provider lookup. It mirrors the teaching range of
the synthetic instruments so a learner meets the same spread of market behaviour in either mode:

| symbol | kind | decimals | why it is here |
| --- | --- | --- | --- |
| AAPL, MSFT | stock | 2 | mega-cap, deep liquidity, readable trends |
| NVDA, TSLA | stock | 2 | violent momentum, gap risk |
| KO, JNJ | stock | 2 | calm blue chips, small candles |
| SPY, QQQ | index | 2 | the broad market and its high-beta cousin |
| GLD | metal | 2 | gold: long ranges, grinding trends |
| BTC-USD | crypto | 0 | 24/7, no gaps, brutal volatility |
| ETH-USD | crypto | 2 | correlated risk next to BTC |
| XOM, USO | energy | 2 | supply-shock trends, company vs. commodity |
| MRNA | biotech | 2 | event risk: quiet drift, enormous gaps |
| EURUSD=X | forex | 4 | pips and tight ranges |

`kind` is one of `stock`, `index`, `metal`, `crypto`, `energy`, `biotech`, `forex`.
`decimals` and `unitLabel` are the simulator's formatting contract, not the provider's.

### `GET /api/history?symbol=AAPL&interval=1d&range=5y`

```json
{"symbol":"AAPL","interval":"1d","currency":"USD","exchange":"NMS",
 "bars":[{"time":1700000000,"open":1.23,"high":1.3,"low":1.2,"close":1.28,"volume":12345}],
 "source":"yahoo","fetchedAt":1700000000,"cached":true,"stale":false}
```

* `interval` — one of `1m`, `5m`, `15m`, `1h`, `4h`, `1d`. Required.
* `range` — optional; forms like `7d`, `2w`, `6mo`, `5y`, `max`. Defaults to the maximum that
  interval supports.
* `time` — unix **seconds**, not milliseconds.
* `cached` — the bars came off disk rather than the wire.
* `stale` — the bars came off disk *after* an upstream failure, so they are older than the TTL
  allows. `fetchedAt` stays honest about their real age.

**Guarantees on `bars`:**

* Sorted ascending and **strictly** increasing in `time` — no duplicate timestamps. Where the
  provider repeats a timestamp (a revised bar), the later row wins.
* No nulls and no NaN. Any row with a missing open/high/low/close is dropped outright rather than
  interpolated — inventing prices in a trading trainer is worse than showing a gap. A missing
  volume alone keeps the bar, with `volume: 0`.
* `high >= max(open, close)` and `low <= min(open, close)`. The provider occasionally returns
  inconsistent rows, so every bar is clamped.
* Prices are rounded to six decimal places, which is past the tick size of every instrument here
  and only strips floating-point noise.

**Range caps.** Each resolution is capped to what the provider will actually serve. Asking for
more is not an error; the request is silently capped and still succeeds.

| interval | maximum range | fetched as |
| --- | --- | --- |
| `1m` | 7d | native |
| `5m` | 60d | native |
| `15m` | 60d | native |
| `1h` | 730d | native |
| `4h` | 730d | **1h, aggregated here** |
| `1d` | 10y | native |

**4h is synthetic.** No common provider offers a 4-hour resolution, so the service fetches 1h and
aggregates: open of the first bar, max high, min low, close of the last, summed volume. Buckets are
floored on the unix epoch, which lands them exactly on 00:00, 04:00, 08:00 … **UTC**. Aligning to
UTC rather than to the first bar in the window means a cached 4h series and a freshly fetched one
always agree.

### Errors

| status | when |
| --- | --- |
| `400` | unknown interval, malformed range, missing parameter, or a symbol that fails validation |
| `404` | the provider has no data for that symbol at that resolution, or the path does not exist |
| `502` | the provider failed, refused us, or returned something unparseable |
| `504` | the provider did not respond within the timeout |
| `500` | a bug in this service (logged in full, reported as a flat sentence) |

Symbols are validated against a narrow allow-list — `^[A-Za-z0-9^][A-Za-z0-9.^=-]{0,14}$`, with
`..` rejected outright. This is the security boundary of the service, not a formatting nicety: the
symbol is the only caller input that reaches an upstream URL path and a cache filename, so
arbitrary paths can never be proxied.

---

## Caching

* **Where.** `server/.cache/`, one JSON file per `symbol + interval + range`. Gitignored, created
  on demand, and safe to delete at any time — it rebuilds itself.
* **TTL**, by how fast the underlying bars actually move:
  * `1m`, `5m`, `15m` → 5 minutes
  * `1h`, `4h` → 30 minutes
  * `1d` → 12 hours
* **Stale-on-failure.** If the TTL has lapsed and the upstream fetch then fails, the cached bars
  are served with `"stale": true` rather than returning an error. Out-of-date bars still teach the
  same lesson; an error page teaches nothing. A *bad request* is never masked this way.
* **Disk, not memory.** A restart mid-lesson should not cost a fresh round of fetches, and an
  operator can open a file to see exactly what was served.
* **Cache failures are never fatal.** An unreadable or unwritable cache degrades the service to
  "always fetch" — slower, still correct.
* **Coalescing.** Concurrent identical requests share one in-flight fetch, so ten browser tabs
  cause one upstream call.
* **Throttling.** Outgoing calls are spaced to at most ~5 per second, with a 15-second timeout
  (5-second connect).

---

## Configuration

`src/main/resources/application.yml`; every value has an environment override.

| property | env var | default |
| --- | --- | --- |
| `server.port` | `PORT` | `5300` |
| `server.address` | `BIND_ADDRESS` | `127.0.0.1` |
| `tradelab.provider` | `PROVIDER` | `yahoo` |
| `tradelab.allowed-origins` | `ALLOWED_ORIGINS` | *(empty)* |
| `tradelab.cache.dir` | `CACHE_DIR` | `.cache` |
| `tradelab.cache.intraday-ttl` | `CACHE_TTL_INTRADAY` | `5m` |
| `tradelab.cache.hourly-ttl` | `CACHE_TTL_HOURLY` | `30m` |
| `tradelab.cache.daily-ttl` | `CACHE_TTL_DAILY` | `12h` |
| `tradelab.upstream.timeout` | `UPSTREAM_TIMEOUT` | `15s` |
| `tradelab.upstream.connect-timeout` | `UPSTREAM_CONNECT_TIMEOUT` | `5s` |
| `tradelab.upstream.requests-per-second` | `UPSTREAM_RPS` | `5` |
| `tradelab.upstream.yahoo-base-url` | `YAHOO_BASE_URL` | `https://query1.finance.yahoo.com` |

**CORS.** `http://localhost:5173` and `http://localhost:5199` (and their `127.0.0.1` spellings) are
always allowed; `ALLOWED_ORIGINS` adds more, comma separated. Origins are listed explicitly and
echoed back — a request carrying an `Origin` never receives a blanket `*`. Preflight is handled.

**Binding.** The service binds to loopback by default and warns loudly on startup if you move it.
That default is deliberate; see below.

---

## Data licensing — read this

The default provider is **Yahoo Finance's public chart endpoint**. It needs no API key, but:

* It is **unofficial and undocumented**. Yahoo does not support it, does not promise it will keep
  working, and can change or withdraw it without notice.
* Yahoo's terms **prohibit redistribution** of the data.
* It requires a browser-like `User-Agent`, which this service sends.

Consequently this service is built for **personal, local, educational use only**:

* it binds to `127.0.0.1` and is not intended to be exposed to a network or the internet;
* it caches so it stays a light client, and throttles itself to ~5 requests per second;
* it prints a notice to this effect on every startup.

**You, the operator, are responsible for complying with the provider's terms.** Do not deploy this
publicly, do not republish what it serves, and do not build a product on the default provider. If
any of that is your plan, buy a data licence first.

### Swapping in a licensed provider

Everything above the provider is provider-agnostic — caching, normalisation, 4h aggregation,
throttling, validation and the HTTP layer neither know nor care where bars come from.

1. Implement `com.terala.tradelab.provider.MarketDataProvider`: `name()`, and
   `fetch(symbol, interval, range)` returning a `ProviderSeries`. Throw
   `ApiException.noData/upstreamFailed/upstreamTimeout` for the 404/502/504 cases.
   You do **not** need to handle `4h` — the service never asks for it — and you do not need to sort
   or clean the bars.
2. Register it in `ServiceConfig.marketDataProvider(...)`, selected by `tradelab.provider`.
3. Set `PROVIDER=<your name>`.

Nothing else changes. `source` in each history response reports whichever provider answered.

---

## Troubleshooting: "Unable to establish loopback connection"

On the machine this was built on, the service compiles and every test passes, but Tomcat
cannot start:

```
java.io.IOException: Unable to establish loopback connection
  caused by java.net.SocketException: Invalid argument: connect
    at sun.nio.ch.PipeImpl$Initializer.init
```

This is not a defect in this service. Java's NIO `Selector` builds its wakeup pipe from a
self-connected loopback socket, and on this machine that specific connect fails. It was
reproduced with a five-line program that uses no Spring at all, both inside and outside the
agent sandbox, so it affects **any** Java NIO server: Tomcat, Jetty, Netty and Undertow
alike, including the Spring Boot API in the sibling Granite project.

What still works, which is what makes the diagnosis precise:

| Operation | Result |
|---|---|
| `new ServerSocket(0)` | binds fine |
| `ServerSocketChannel.bind()` | fine |
| `Pipe.open()` | fine |
| plain blocking connect to 127.0.0.1 | fine |
| `Selector.open()` | **fails** |

`-Djava.net.preferIPv4Stack=true`, `-Djava.net.preferIPv6Addresses=true` and
`-Djdk.net.usePlainSocketImpl=true` were each tried and none of them help.

The usual cause is a Winsock layered service provider left behind by a VPN or security
product, which corrupts the loopback path the selector relies on. The usual remedy is:

```
netsh winsock reset
```

followed by a reboot. That resets network configuration and can disrupt VPN clients, so it
is deliberately left for the operator to run rather than being done automatically.

Until then the service can still be exercised end to end through `LiveEndToEndTest`, which
drives the real controller, the real exception handling and the real upstream provider
without binding a socket.

## Tests

```bash
./mvnw test
```

102 tests, all offline — no test touches the network. They cover bar normalisation (nulls dropped,
ordering, duplicate collapse, high/low clamping), 4h aggregation against hand-computed buckets,
range capping per interval, symbol validation against traversal-ish and over-long input, cache TTL
behaviour (fresh hit, expired miss, stale-on-upstream-failure, survival across a restart), request
coalescing, and the full wire contract including status-code mapping and CORS.

Two live checks are tagged `live` and **excluded by default**, so a dropped wifi connection can
never fail the build. Run them deliberately when you suspect the upstream shape has drifted:

```bash
./mvnw test -Dtest=YahooLiveSmokeTest,LiveEndToEndTest -Dtest.excludedGroups=
```

---

## Layout

```
server/
├── pom.xml
├── mvnw, mvnw.cmd, .mvn/wrapper/maven-wrapper.properties
├── .cache/                                   # created on demand, gitignored
└── src/
    ├── main/java/com/terala/tradelab/
    │   ├── TradeLabDataApplication.java
    │   ├── cache/        DiskCache, CachedSeries
    │   ├── config/       TradeLabProperties, ServiceConfig, CorsConfig, StartupNotice
    │   ├── dto/          HistoryResponse, SymbolInfo, SymbolsResponse, HealthResponse, ErrorResponse
    │   ├── error/        ApiException
    │   ├── market/       Bar, Bars, Interval, SymbolCatalog, SymbolValidator, MarketDataService
    │   ├── provider/     MarketDataProvider, ProviderSeries, YahooChartProvider,
    │   │                 YahooChartParser, RateLimiter
    │   └── web/          MarketDataController, ApiExceptionHandler
    ├── main/resources/application.yml
    └── test/java/com/terala/tradelab/...
```
