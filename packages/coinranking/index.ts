import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.coinranking.com/v2";

const coinranking = defineProvider({
  name: "Coinranking",
  hosts: ["api.coinranking.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Reference currencies are available on every plan, including the free one.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/reference-currencies?limit=1`, {
      signal,
      headers: { "x-access-token": account.fields.token },
    });
    await decodeJson(response, object({ status: string() }));
  },
});

type Account = { fields: { token: string } };

const Query = record(json()).optional();

// Arrays use the API's `name[]=value` form; everything else is stringified.
const search = (params: Record<string, unknown> | undefined) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) for (const item of value) out.append(`${key}[]`, String(item));
    else out.set(key, String(value));
  }
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const PRO = " Requires the Professional plan or higher.";
const REF = "referenceCurrencyUuid (default USD, uuid of a reference currency; find one with referenceCurrencies.list)";
const PAGE = "limit, offset";
const ORDER = "orderBy, orderDirection (asc or desc)";

type Spec = { description: string; path: string; params?: string[] };

// :uuid style segments become required string inputs; every other API parameter goes in `query`.
const tool = (spec: Spec, account: Account, signal: AbortSignal) => {
  const names = [...spec.path.matchAll(/:(\w+)/g)].map((match) => match[1]!);
  const fields: Record<string, ReturnType<typeof string>> = {};
  for (const name of names) fields[name] = string({ minLength: 1 });
  return query(
    {
      description: `${spec.description} Query parameters go in "query" (arrays as JSON arrays): ${spec.params?.join("; ") ?? "none"}.`,
      input: object({ ...fields, query: Query }),
    },
    async ({ fetch }, input) => {
      const values = input as Record<string, unknown>;
      const path = spec.path.replace(/:(\w+)/g, (_, name: string) => encodeURIComponent(String(values[name])));
      return decodeJson(
        await fetch(`${base}${path}${search(values.query as Record<string, unknown> | undefined)}`, {
          signal,
          headers: { "x-access-token": account.fields.token },
        }),
        json(),
      );
    },
  );
};

const group = (specs: Record<string, Spec>, account: Account, signal: AbortSignal) =>
  router(Object.fromEntries(Object.entries(specs).map(([name, spec]) => [name, tool(spec, account, signal)])));

const coinranking_tools = (account: Account, signal: AbortSignal) => {
  const g = (specs: Record<string, Spec>) => group(specs, account, signal);
  return router({
    coins: g({
      list: {
        description:
          "List coins ordered by rank (market cap) by default, with price, market cap, 24h volume, change and sparkline, plus list-wide stats.",
        path: "/coins",
        params: [REF, "timePeriod (e.g. 24h, 7d, 30d, 1y; max 1y on Free, 5y on paid)", "symbols, uuids, contractAddresses, blockchains, coinGeckoIds, coinMarketCapIds, tiers, tags (arrays filters)", ORDER.replace("orderBy", "orderBy (price, marketCap, 24hVolume, change, listedAt)"), PAGE, "cursor"],
      },
      trending: {
        description: "List trending coins.",
        path: "/coins/trending",
        params: [REF, "timePeriod", "tiers (array)", PAGE],
      },
      details: {
        description: "Get one coin by uuid: price, market cap, supply, links, rank and more.",
        path: "/coin/:uuid",
        params: [REF, "timePeriod"],
      },
      price: {
        description: "Get a coin's price now, or the price nearest to a given timestamp (epoch seconds).",
        path: "/coin/:uuid/price",
        params: [REF, "timestamp"],
      },
      priceHistory: {
        description: "Get a coin's price history for a time period.",
        path: "/coin/:uuid/price-history",
        params: [REF, "timePeriod (e.g. 24h, 7d, 30d, 1y)"],
      },
      ohlcv: {
        description: "Get open, high, low, close and volume candles for a coin." + PRO,
        path: "/coin/:uuid/ohlcv",
        params: [REF, "interval (minute, 5minutes, hour, 8hours, day, week, month)", "limit", "from", "to"],
      },
      exchanges: {
        description: "List exchanges that list a coin." + PRO,
        path: "/coin/:uuid/exchanges",
        params: [REF, PAGE, ORDER, "search", "cursor"],
      },
      markets: {
        description: "List markets (trading pairs) for a coin." + PRO,
        path: "/coin/:uuid/markets",
        params: [REF, PAGE, ORDER, "search", "cursor"],
      },
      fiatPrices: {
        description: "Get a coin's price in fiat currencies." + PRO,
        path: "/coin/:uuid/fiat-prices",
      },
      gainsAndLosses: {
        description: "Get a coin's gains and losses over intervals." + PRO,
        path: "/coin/:uuid/gains-and-losses",
        params: [REF, "interval", "limit"],
      },
      marketCapHistory: {
        description: "Get a coin's market cap history." + PRO,
        path: "/coin/:uuid/market-cap-history",
        params: ["interval", "limit"],
      },
      rankHistory: {
        description: "Get a coin's rank history." + PRO,
        path: "/coin/:uuid/rank-history",
        params: ["interval", "limit"],
      },
      supplyHistory: {
        description: "Get a coin's supply history." + PRO,
        path: "/coin/:uuid/supply-history",
        params: ["interval", "limit"],
      },
      tradingVolumeHistory: {
        description: "Get a coin's trading volume history." + PRO,
        path: "/coin/:uuid/trading-volume-history",
        params: [REF, "interval", "limit"],
      },
      supplyModifiers: {
        description: "List supply modifiers (burns, mints, unlocks) of a coin." + PRO,
        path: "/coin/:uuid/modifiers",
        params: [PAGE, ORDER],
      },
      issuanceBlockchains: {
        description: "List blockchains a coin is issued on." + PRO,
        path: "/coin/:uuid/issuance-blockchains",
        params: [PAGE, "cursor"],
      },
      mapping: {
        description:
          "Look up a Coinranking coin from another provider's id (provider is coingecko or coinmarketcap)." + PRO,
        path: "/mappings/:provider/coin/:providerId",
        params: [REF, "timePeriod"],
      },
    }),
    assets: g({
      list: {
        description: "List assets (coins, stocks and other tradable assets).",
        path: "/assets",
        params: ["types (array)", REF, PAGE, "cursor"],
      },
    }),
    stats: g({
      global: {
        description: "Get global crypto market statistics: total coins, markets, exchanges, market cap and volume.",
        path: "/stats",
        params: [REF],
      },
      coins: {
        description: "Get statistics for a selection of coins or a tag.",
        path: "/stats/coins",
        params: [REF, "timePeriod", "uuids (array)", "tag"],
      },
      globalMarketCaps: {
        description: "Get the global market cap history." + PRO,
        path: "/stats/global-market-caps",
        params: [REF, "timePeriod"],
      },
      globalTradingVolumes: {
        description: "Get the global trading volume history." + PRO,
        path: "/stats/global-trading-volumes",
        params: [REF, "interval", "limit", "cursor"],
      },
      bitcoinDominanceHistory: {
        description: "Get Bitcoin dominance history." + PRO,
        path: "/stats/bitcoin-dominance-history",
        params: [REF, "timePeriod"],
      },
    }),
    exchanges: g({
      list: {
        description: "List exchanges." + PRO,
        path: "/exchanges",
        params: [REF, PAGE, ORDER, "uuids", "search", "countries", "fiatCurrencyUuids", "cursor"],
      },
      details: { description: "Get one exchange." + PRO, path: "/exchange/:uuid", params: [REF] },
      coins: {
        description: "List coins listed on an exchange." + PRO,
        path: "/exchange/:uuid/coins",
        params: [REF, PAGE, ORDER, "search", "cursor"],
      },
      newCoins: {
        description: "List coins newly listed on an exchange." + PRO,
        path: "/exchange/:uuid/coins/new",
        params: [REF, PAGE],
      },
      markets: {
        description: "List markets of an exchange." + PRO,
        path: "/exchange/:uuid/markets",
        params: [REF, PAGE, ORDER, "search", "cursor"],
      },
    }),
    dexs: g({
      list: {
        description: "List decentralized exchanges." + PRO,
        path: "/dexs",
        params: [REF, PAGE, ORDER, "uuids", "search", "countries", "fiatCurrencyUuids"],
      },
      protocols: {
        description: "List DEX protocols." + PRO,
        path: "/dex-protocols",
        params: [REF, PAGE, ORDER, "uuids", "search", "countries", "fiatCurrencyUuids"],
      },
      details: { description: "Get one DEX." + PRO, path: "/dex/:uuid", params: [REF] },
      coins: {
        description: "List coins listed on a DEX." + PRO,
        path: "/dex/:uuid/coins",
        params: [REF, PAGE, ORDER, "cursor"],
      },
      newCoins: {
        description: "List coins newly listed on a DEX." + PRO,
        path: "/dex/:uuid/coins/new",
        params: [REF, PAGE],
      },
      markets: {
        description: "List markets of a DEX." + PRO,
        path: "/dex/:uuid/markets",
        params: [REF, PAGE, ORDER, "search"],
      },
    }),
    markets: g({
      list: {
        description: "List markets (trading pairs)." + PRO,
        path: "/markets",
        params: [REF, PAGE, ORDER, "search", "cursor"],
      },
      details: { description: "Get one market." + PRO, path: "/market/:uuid", params: [REF] },
    }),
    futures: g({
      coins: {
        description: "List futures coins." + PRO,
        path: "/futures/coins",
        params: [REF, "uuids", "symbols", "search", ORDER, PAGE, "cursor"],
      },
      coinDetails: { description: "Get one futures coin." + PRO, path: "/futures/coin/:uuid", params: [REF] },
      coinExchanges: {
        description: "List exchanges trading a futures coin." + PRO,
        path: "/futures/coin/:uuid/exchanges",
        params: [REF, "uuids", "search", ORDER, PAGE, "cursor"],
      },
      coinMarkets: {
        description: "List futures markets of a coin." + PRO,
        path: "/futures/coin/:uuid/markets",
        params: [REF, "search", ORDER, PAGE, "cursor"],
      },
      coinOhlcv: {
        description: "Get OHLCV candles for a futures coin." + PRO,
        path: "/futures/coin/:uuid/ohlcv",
        params: [REF, "interval", "limit", "offset"],
      },
      exchanges: {
        description: "List futures exchanges." + PRO,
        path: "/futures/exchanges",
        params: [REF, "uuids", "search", ORDER, PAGE, "cursor"],
      },
      exchangeCoins: {
        description: "List futures coins on an exchange." + PRO,
        path: "/futures/exchange/:uuid/coins",
        params: [REF, "search", ORDER, PAGE, "cursor"],
      },
      exchangeMarkets: {
        description: "List futures markets on an exchange." + PRO,
        path: "/futures/exchange/:uuid/markets",
        params: [REF, "search", ORDER, PAGE, "cursor"],
      },
      markets: {
        description: "List futures markets." + PRO,
        path: "/futures/markets",
        params: [REF, "search", ORDER, PAGE, "cursor"],
      },
      marketDetails: { description: "Get one futures market." + PRO, path: "/futures/market/:uuid", params: [REF] },
    }),
    indicators: g({
      fearAndGreed: {
        description: "Get the crypto fear and greed index." + PRO,
        path: "/indicators/fear-and-greed",
        params: ["timePeriod", "interval"],
      },
      movingAverages: {
        description: "Get moving averages for a coin." + PRO,
        path: "/indicators/:uuid/moving-averages",
        params: ["timePeriod", "interval", REF],
      },
      rsi: {
        description: "Get the relative strength index for a coin." + PRO,
        path: "/indicators/:uuid/rsi",
        params: ["timePeriod", "interval", REF],
      },
      macd: {
        description: "Get MACD for a coin." + PRO,
        path: "/indicators/:uuid/macd",
        params: ["timePeriod", "interval", REF],
      },
      atr: {
        description: "Get average true range for a coin." + PRO,
        path: "/indicators/:uuid/atr",
        params: ["timePeriod", "interval", REF],
      },
      supertrend: {
        description: "Get supertrend for a coin." + PRO,
        path: "/indicators/:uuid/supertrend",
        params: ["timePeriod", "interval", REF],
      },
    }),
    blockchains: g({
      list: { description: "List blockchains." + PRO, path: "/blockchains" },
      details: { description: "Get one blockchain by name." + PRO, path: "/blockchain/:name" },
      contract: {
        description: "Look up a contract address on a blockchain." + PRO,
        path: "/blockchain/:blockchain/:address",
      },
    }),
    tags: g({
      list: {
        description: "List coin tags (categories) such as defi or meme.",
        path: "/tags",
        params: [REF, "timePeriod", "type", PAGE, "cursor"],
      },
      details: { description: "Get one tag by slug.", path: "/tag/:slug", params: [REF, "timePeriod"] },
    }),
    referenceCurrencies: g({
      list: {
        description: "List reference currencies (fiat, crypto and others) usable as referenceCurrencyUuid.",
        path: "/reference-currencies",
        params: ["types (array: fiat, coin, denominator)", "search", PAGE, "cursor"],
      },
    }),
    search: g({
      suggestions: {
        description: "Search coins, exchanges and markets by name for autocomplete.",
        path: "/search-suggestions",
        params: ["query", "types (array)", REF],
      },
    }),
  });
};

export default defineApp({ user: { accounts: { coinranking: coinranking.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.coinranking ?? [], (account) => coinranking_tools(account, signal), { signal }), {
    title: "Coinranking",
    description:
      "Cryptocurrency data from Coinranking: coins, prices and history, global stats, exchanges, DEXs, markets, futures, indicators and tags.",
    instructions:
      "All tools are read-only. Pass path ids (uuid, slug) as top-level inputs and everything else in `query`. Many endpoints need a paid plan and return 402/403 on the Free plan. Find uuids with coins.list or search.suggestions.",
    icons,
  }),
}));
