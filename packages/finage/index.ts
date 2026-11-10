import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.finage.co.uk";

const finage = defineProvider({
  name: "Finage",
  hosts: ["api.finage.co.uk"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Market status is read-only; an invalid key returns HTTP 401, and a valid one always has `market` and `timezone`.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `${base}/marketstatus?${new URLSearchParams({ apikey: account.fields.token })}`,
      { signal, headers: { Accept: "application/json" } },
    );
    await decodeJson(response, object({ market: string(), timezone: string() }));
  },
});

type Account = { fields: { token: string } };
type Params = Record<string, string | number | undefined>;

// Encode each interpolated path value on its own so `/` or `..` cannot change the route.
const seg = (value: string | number) => encodeURIComponent(String(value));

// Finage authenticates with an `apikey` query parameter on every request.
const get = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  path: string,
  params: Params = {},
) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value));
  search.set("apikey", account.fields.token);
  return decodeJson(
    await fetch(`${base}${path}?${search}`, { signal, headers: { Accept: "application/json" } }),
    json(),
  );
};

const sort = string().optional();

const tools = (account: Account, signal: AbortSignal) => {
  // One read-only tool per endpoint; `path` receives the validated input.
  const read = <S extends ReturnType<typeof object>>(
    description: string,
    input: S,
    path: (input: any) => string,
    params: (input: any) => Params = () => ({}),
  ) =>
    query({ description, input }, async ({ fetch }, value) =>
      get(fetch, account, signal, path(value), params(value)),
    );

  const sym = object({ symbol: string() });
  const symLimit = object({ symbol: string(), limit: number().optional() });
  const symPeriod = object({ symbol: string(), limit: number().optional(), period: string().optional() });
  const agg = object({
    symbol: string(),
    multiply: number(),
    timespan: string(),
    from: string(),
    to: string(),
    limit: number().optional(),
    sort,
  });
  const aggParams = (i: any): Params => ({ limit: i.limit, sort: i.sort });

  return router({
    market: router(
      {
        status: read("Open/closed status of the major exchanges and forex and crypto markets. Optional flags (true/false) add holidays, trading hours and extended hours.", object({ country: string().optional(), currencies: string().optional(), holidays: string().optional(), trading_hours: string().optional(), extended_hours: string().optional() }), () => "/marketstatus", (i) => ({ country: i.country, currencies: i.currencies, holidays: i.holidays, trading_hours: i.trading_hours, extended_hours: i.extended_hours })),
        mostActives: read("Most actively traded US stocks in the current session.", object({}), () => "/fnd/market-information/us/most-actives"),
        mostGainers: read("US stocks with the largest gains in the current session.", object({}), () => "/fnd/market-information/us/most-gainers"),
        mostLosers: read("US stocks with the largest losses in the current session.", object({}), () => "/fnd/market-information/us/most-losers"),
        sectorPerformance: read("Performance of US market sectors.", object({}), () => "/fnd/market-information/us/sector-performance"),
        symbolList: read("List supported symbols for a type (e.g. forex), paged from page 1, optionally filtered by search text.", object({ type: string(), page: number().optional(), search: string().optional() }), (i) => `/symbol-list/${seg(i.type)}`, (i) => ({ page: i.page, search: i.search })),
        listCryptocurrencies: read("List supported cryptocurrencies.", object({ limit: number().optional(), page: number().optional(), sort: string().optional() }), () => "/fnd/list/cryptocurrency", (i) => ({ limit: i.limit, page: i.page, sort: i.sort })),
      },
      { title: "Market", description: "Market status, movers, sector performance and symbol lists." },
    ),
    stocks: router(
      {
        lastQuote: read("Latest bid/ask quote for a US stock, e.g. AAPL.", sym, (i) => `/last/stock/${seg(i.symbol)}`),
        lastTrade: read("Latest trade (price, size, timestamp) for a US stock.", sym, (i) => `/last/trade/stock/${seg(i.symbol)}`),
        lastQuoteGlobal: read(
          "Latest quote for a stock on a non-US market. country is one of uk, ca, in, ru.",
          object({ country: string(), symbol: string() }),
          (i) => `/last/stock/${seg(i.country)}/${seg(i.symbol)}`,
        ),
        aggregates: read(
          "OHLCV bars for a US stock. timespan is minute, hour, day, week, month, quarter or year; from and to are YYYY-MM-DD; sort is asc or desc. Free keys cap the result size.",
          agg,
          (i) => `/agg/stock/${seg(i.symbol)}/${seg(i.multiply)}/${seg(i.timespan)}/${seg(i.from)}/${seg(i.to)}`,
          aggParams,
        ),
        aggregatesGlobal: read(
          "OHLCV bars for a stock on a non-US market (country uk, ca, in or ru). interval is a combined span such as 1day.",
          object({ country: string(), symbol: string(), interval: string(), from: string(), to: string(), limit: number().optional(), sort }),
          (i) => `/agg/stock/global/${seg(i.country)}/${seg(i.symbol)}/${seg(i.interval)}/${seg(i.from)}/${seg(i.to)}`,
          aggParams,
        ),
        previousClose: read("Previous trading day's OHLCV for a US stock.", sym, (i) => `/agg/stock/prev-close/${seg(i.symbol)}`),
        snapshot: read(
          "Snapshot of US stocks in one request. symbols is a comma-separated list; quotes and trades (true/false) include the latest quote and trade.",
          object({ symbols: string().optional(), quotes: string().optional(), trades: string().optional() }),
          () => "/snapshot/stock",
          (i) => ({ symbols: i.symbols, quotes: i.quotes, trades: i.trades }),
        ),
        detail: read("Company profile for a stock symbol.", sym, (i) => `/fnd/detail/stock/${seg(i.symbol)}`),
        search: read("Search companies by name or ticker in a market (e.g. us).", object({ market: string(), query: string(), limit: number().optional() }), (i) => `/fnd/search/market/${seg(i.market)}/${seg(i.query)}`, (i) => ({ limit: i.limit })),
        sharesFloat: read("Shares float for a stock.", sym, (i) => `/fnd/shares-float/${seg(i.symbol)}`),
        news: read("Recent news for a stock symbol.", symLimit, (i) => `/news/market/${seg(i.symbol)}`, (i) => ({ limit: i.limit })),
        technicalIndicator: read(
          "Technical indicator for a stock. indicator is e.g. sma, ema, rsi; time is the bar size such as daily; period is the indicator window (e.g. 10).",
          object({ indicator: string(), time: string(), symbol: string(), period: number().optional() }),
          (i) => `/fnd/technical-indicator/${seg(i.indicator)}/${seg(i.time)}/${seg(i.symbol)}`,
          (i) => ({ period: i.period }),
        ),
        signals: read("Daily trading signals for a US stock.", sym, (i) => `/fnd/signals/us-stock/daily/${seg(i.symbol)}`),
        delistedCompanies: read("List delisted companies.", object({ limit: number().optional() }), () => "/fnd/delisted-companies", (i) => ({ limit: i.limit })),
      },
      { title: "Stocks", description: "US and international stock quotes, bars, snapshots, profiles and news." },
    ),
    forex: router(
      {
        lastQuote: read("Latest bid/ask for a forex pair or metal, e.g. GBPUSD or XAUUSD.", sym, (i) => `/last/forex/${seg(i.symbol)}`),
        lastTrade: read("Latest trade for a forex pair.", sym, (i) => `/last/trade/forex/${seg(i.symbol)}`),
        aggregates: read(
          "OHLCV bars for a forex pair or metal. timespan is minute, hour, day, week, month, quarter or year; from and to are YYYY-MM-DD.",
          agg,
          (i) => `/agg/forex/${seg(i.symbol)}/${seg(i.multiply)}/${seg(i.timespan)}/${seg(i.from)}/${seg(i.to)}`,
          aggParams,
        ),
        previousClose: read("Previous day's OHLCV for a forex pair.", sym, (i) => `/agg/forex/prev-close/${seg(i.symbol)}`),
        snapshot: read(
          "Snapshot of forex pairs in one request. symbols is a comma-separated list such as EURUSD,GBPUSD.",
          object({ symbols: string().optional(), quotes: string().optional(), trades: string().optional() }),
          () => "/snapshot/forex",
          (i) => ({ symbols: i.symbols, quotes: i.quotes, trades: i.trades }),
        ),
        convert: read("Convert an amount between currencies at the live rate.", object({ from: string(), to: string(), amount: number() }), (i) => `/convert/forex/${seg(i.from)}/${seg(i.to)}/${seg(i.amount)}`),
        currencyDetail: read("Currency pair metadata (codes, flags).", sym, (i) => `/fnd/detail/currency/${seg(i.symbol)}`),
        searchCurrency: read("Search currencies.", object({ query: string(), limit: number().optional() }), (i) => `/fnd/search/currency/${seg(i.query)}`, (i) => ({ limit: i.limit })),
        countryDetail: read("Country details: currency, phone code, flag. Takes an ISO code such as gb.", object({ code: string() }), (i) => `/fnd/detail/country/${seg(i.code)}`),
        searchCountry: read("Search countries.", object({ query: string(), limit: number().optional() }), (i) => `/fnd/search/country/${seg(i.query)}`, (i) => ({ limit: i.limit })),
        signals: read("Daily trading signals for a forex pair.", sym, (i) => `/fnd/signals/forex/daily/${seg(i.symbol)}`),
        news: read("Recent forex news for a currency, e.g. gbp.", symLimit, (i) => `/news/forex/${seg(i.symbol)}`, (i) => ({ limit: i.limit })),
      },
      { title: "Forex", description: "Forex and metals quotes, bars, conversion, currency and country data." },
    ),
    crypto: router(
      {
        lastTrade: read("Latest trade for a crypto pair, e.g. BTCUSD.", sym, (i) => `/last/crypto/${seg(i.symbol)}`),
        lastQuote: read("Latest bid/ask for a crypto pair.", sym, (i) => `/last/quote/crypto/${seg(i.symbol)}`),
        lastDetailed: read("Price, changes, volume, market cap and highs/lows for a crypto pair.", sym, (i) => `/fnd/last/crypto/detailed/${seg(i.symbol)}`),
        aggregates: read(
          "OHLCV bars for a crypto pair. timespan is minute, hour, day, week, month, quarter or year; from and to are YYYY-MM-DD.",
          agg,
          (i) => `/agg/crypto/${seg(i.symbol)}/${seg(i.multiply)}/${seg(i.timespan)}/${seg(i.from)}/${seg(i.to)}`,
          aggParams,
        ),
        previousClose: read("Previous day's OHLCV for a crypto pair.", sym, (i) => `/agg/crypto/prev-close/${seg(i.symbol)}`),
        snapshot: read(
          "Snapshot of crypto pairs in one request. symbols is a comma-separated list such as BTCUSD,DOGEUSD.",
          object({ symbols: string().optional(), quotes: string().optional(), trades: string().optional() }),
          () => "/snapshot/crypto",
          (i) => ({ symbols: i.symbols, quotes: i.quotes, trades: i.trades }),
        ),
        convert: read("Convert an amount between cryptocurrencies or into fiat.", object({ from: string(), to: string(), amount: number() }), (i) => `/convert/crypto/${seg(i.from)}/${seg(i.to)}/${seg(i.amount)}`),
        detail: read("Fundamentals for a cryptocurrency by name, e.g. bitcoin: description, links, technical details.", object({ name: string() }), (i) => `/fnd/detail/cryptocurrency/${seg(i.name)}`),
        search: read("Search cryptocurrencies by name.", object({ query: string(), limit: number().optional() }), (i) => `/fnd/search/cryptocurrency/${seg(i.query)}`, (i) => ({ limit: i.limit })),
        news: read("Recent news for a crypto symbol, e.g. BTC.", symLimit, (i) => `/news/cryptocurrency/${seg(i.symbol)}`, (i) => ({ limit: i.limit })),
      },
      { title: "Crypto", description: "Cryptocurrency quotes, bars, snapshots, conversion, details and news." },
    ),
    indices: router(
      {
        last: read("Latest value of an index, e.g. US2000.", sym, (i) => `/last/index/${seg(i.symbol)}`),
        aggregates: read(
          "OHLCV bars for an index. interval is a combined span such as 1day.",
          object({ symbol: string(), interval: string(), from: string(), to: string(), limit: number().optional(), sort }),
          (i) => `/agg/index/${seg(i.symbol)}/${seg(i.interval)}/${seg(i.from)}/${seg(i.to)}`,
          aggParams,
        ),
        previousClose: read("Previous day's OHLCV for an index.", sym, (i) => `/agg/index/prev-close/${seg(i.symbol)}`),
      },
      { title: "Indices", description: "Stock index values and bars." },
    ),
    etfs: router(
      {
        last: read("Latest price of an ETF, e.g. QQQ.", sym, (i) => `/last/etf/${seg(i.symbol)}`),
        aggregates: read(
          "OHLCV bars for an ETF. interval is a combined span such as 1day.",
          object({ symbol: string(), interval: string(), from: string(), to: string(), limit: number().optional(), sort }),
          (i) => `/agg/etf/${seg(i.symbol)}/${seg(i.interval)}/${seg(i.from)}/${seg(i.to)}`,
          aggParams,
        ),
        previousClose: read("Previous day's OHLCV for an ETF.", sym, (i) => `/agg/etf/prev-close/${seg(i.symbol)}`),
        mutualFundHolders: read("Mutual fund holders of a symbol.", sym, (i) => `/fnd/funds/mutual-fund-holder/${seg(i.symbol)}`),
        institutionalHolders: read("Institutional holders of a symbol.", sym, (i) => `/fnd/funds/institutional-holder/${seg(i.symbol)}`),
      },
      { title: "ETFs and funds", description: "ETF prices and bars, fund and institutional holders." },
    ),
    fundamentals: router(
      {
        incomeStatement: read("Income statements. period is annual or quarter.", symPeriod, (i) => `/fnd/income-statement/${seg(i.symbol)}`, (i) => ({ limit: i.limit, period: i.period })),
        balanceSheet: read("Balance sheet statements.", symPeriod, (i) => `/fnd/balance-sheet-statements/${seg(i.symbol)}`, (i) => ({ limit: i.limit, period: i.period })),
        cashFlow: read("Cash flow statements.", symPeriod, (i) => `/fnd/cash-flow-statement/${seg(i.symbol)}`, (i) => ({ limit: i.limit, period: i.period })),
        financialRatios: read("Financial ratios for a symbol.", sym, (i) => `/fnd/financial-ratios/${seg(i.symbol)}`),
        historicalDividends: read("Dividend history for a symbol.", sym, (i) => `/fnd/historical-dividends/${seg(i.symbol)}`),
        historicalSplits: read("Stock split history for a symbol.", sym, (i) => `/fnd/historical-stock-splits/${seg(i.symbol)}`),
        usTreasuryRate: read("US treasury rate series by code, e.g. DGS1.", object({ code: string() }), (i) => `/fnd/bonds/us/rate/${seg(i.code)}`),
      },
      { title: "Fundamentals", description: "Financial statements, ratios, dividends, splits and treasury rates." },
    ),
    calendars: router(
      {
        economic: read("Economic calendar events; from and to are YYYY-MM-DD.", object({ from: string(), to: string() }), () => "/fnd/economic-calendar", (i) => ({ from: i.from, to: i.to })),
        earnings: read("Upcoming earnings releases.", object({}), () => "/fnd/earning-calendar"),
        dividends: read("Upcoming dividends. from and to are YYYY-MM-DD.", object({ from: string(), to: string() }), () => "/fnd/dividend-calendar", (i) => ({ from: i.from, to: i.to })),
        ipo: read("Upcoming IPOs. from and to are YYYY-MM-DD.", object({ from: string(), to: string() }), () => "/fnd/ipo-calendar", (i) => ({ from: i.from, to: i.to })),
        stockSplits: read("Upcoming stock splits. from and to are YYYY-MM-DD.", object({ from: string(), to: string() }), () => "/fnd/stock-split-calendar", (i) => ({ from: i.from, to: i.to })),
        fundsNewsFeed: read("RSS-style feed of fund news.", object({}), () => "/fnd/funds/rss-feed"),
      },
      { title: "Calendars", description: "Economic, earnings, dividend, IPO and split calendars." },
    ),
  });
};

export default defineApp(
  { user: { accounts: { finage: finage.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.finage ?? [], (account) => tools(account, signal), { signal }),
      {
        title: "Finage",
        description:
          "Real-time and historical market data from Finage: stocks, forex, crypto, indices, ETFs, fundamentals, news and calendars. Read-only.",
        icons,
      },
    ),
  }),
);
