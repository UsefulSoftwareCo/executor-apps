import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.tokenmetrics.com/v3";

const tokenmetrics = defineProvider({
  name: "Token Metrics",
  hosts: ["api.tokenmetrics.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API has no account endpoint; this read-only call returns one token row.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/top-market-cap-tokens?top_k=1`, {
      signal,
      redirect: "error",
      headers: { "x-api-key": account.fields.token, accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "x-api-key": account.fields.token, accept: "application/json" });

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const page = {
  limit: number().optional(),
  page: number().optional(),
};
const dates = { start_date: string().optional(), end_date: string().optional() };
const token = {
  token_id: string().optional(),
  token_name: string().optional(),
  symbol: string().optional(),
  slug: string().optional(),
};
const tokenFilter = {
  ...token,
  category: string().optional(),
  exchange: string().optional(),
  marketcap: string().optional(),
  volume: string().optional(),
  fdv: string().optional(),
};
const dateNote = " Dates are YYYY-MM-DD; the API limits a range to 29 days per call.";
const idsNote = " token_id, symbol, token_name and slug accept comma-separated lists (for example symbol=BTC,ETH).";

// Each entry is one GET endpoint: [tool name, path, description, input fields].
const get = [
  ["tokens", "tokens", "List the tokens Token Metrics covers with token_id, name, symbol, category, exchanges and market data. Use it to resolve a symbol to a token_id." + idsNote, { ...tokenFilter, blockchain_address: string().optional(), ...page }],
  ["topMarketCapTokens", "top-market-cap-tokens", "List the top tokens by market capitalisation. top_k is the number of tokens (default 100).", { top_k: number().optional() }],
  ["price", "price", "Current price for one or more tokens." + idsNote, token],
  ["dailyOhlcv", "daily-ohlcv", "Daily open, high, low, close and volume candles for tokens." + idsNote + dateNote, { ...token, ...dates, ...page }],
  ["hourlyOhlcv", "hourly-ohlcv", "Hourly open, high, low, close and volume candles for tokens." + idsNote + dateNote, { ...token, ...dates, ...page }],
  ["tmGrade", "tm-grade", "Current Token Metrics Grade (overall AI grade, quant grade, signal and momentum) for tokens." + idsNote, { ...token, ...page }],
  ["tmGradeHistory", "tm-grade-history", "Historical Token Metrics Grade for tokens." + idsNote + dateNote, { ...token, ...dates, ...page }],
  ["technologyGrade", "technology-grade", "Current Technology Grade for tokens: activity, security, repository, collaboration and DeFi scanner scores." + idsNote, { ...token, ...page }],
  ["technologyGradeHistory", "technology-grade-history", "Historical Technology Grade for tokens." + idsNote + dateNote, { ...token, ...dates, ...page }],
  ["fundamentalGrade", "fundamental-grade", "Current Fundamental Grade for tokens: community, exchange, VC, tokenomics and DeFi scanner scores." + idsNote, { ...token, ...page }],
  ["fundamentalGradeHistory", "fundamental-grade-history", "Historical Fundamental Grade for tokens." + idsNote + dateNote, { ...token, ...dates, ...page }],
  ["tradingSignals", "trading-signals", "AI daily long and short trading signals per token: bullish (1), bearish (-1) or none (0), with trend and returns of the strategy against holding." + idsNote + dateNote, { ...tokenFilter, ...dates, signal: string().optional(), ...page }],
  ["hourlyTradingSignals", "hourly-trading-signals", "AI hourly long and short trading signals per token." + idsNote, { ...token, ...page }],
  ["resistanceSupport", "resistance-support", "Historical resistance and support price levels for tokens." + idsNote, { ...token, ...page }],
  ["marketMetrics", "market-metrics", "Whole-market analytics including the Bullish/Bearish market indicator." + dateNote, { ...dates, ...page }],
  ["quantmetrics", "quantmetrics", "Quantitative risk and return metrics for tokens (volatility, drawdown, Sharpe-style ratios)." + idsNote, { ...tokenFilter, ...page }],
  ["pricePrediction", "price-prediction", "AI price prediction scenarios (bear, base, moon) for tokens." + idsNote, { ...token, ...page }],
  ["moonshotTokens", "moonshot-tokens", "Tokens the AI flags as moonshots. type is active or past; sort_by is moonshot_at, roi_pct, tm_grade or market_cap_usd.", { type: string().optional(), sort_by: string().optional(), ...page }],
  ["correlation", "correlation", "Correlation of tokens with the top tokens." + idsNote, { ...token, category: string().optional(), exchange: string().optional(), ...page }],
  ["aiReports", "ai-reports", "AI-generated research reports on tokens (investment analysis, deep dive, code review)." + idsNote, { token_id: string().optional(), token_name: string().optional(), symbol: string().optional(), ...page }],
  ["cryptoInvestors", "crypto-investors", "Crypto investors with round counts and ROI statistics.", page],
  ["indices", "indices", "AI-managed crypto indices with price, performance and grade. indices_type filters the index family.", { indices_type: string().optional(), ...page }],
  ["indicesHoldings", "indices-holdings", "Current holdings and weights of one index, selected by id from the indices tool.", { id: number() }],
  ["indicesPerformance", "indices-performance", "Performance history of one index, selected by id." + dateNote, { id: number(), ...dates, ...page }],
] as const;

const tokenMetricsTools = (account: Account, signal: AbortSignal) => {
  const tools: Record<string, ReturnType<typeof query>> = {};
  for (const [name, path, description, fields] of get) {
    tools[name] = query(
      { description, input: object(fields as never) },
      async ({ fetch }, input: Record<string, string | number | undefined>) =>
        decodeJson(
          await fetch(`${base}/${path}?${search(input)}`, { signal, redirect: "error", headers: headers(account) }),
          json(),
        ),
    ) as never;
  }
  // A POST that spends paid API credits, so it is declared as a mutation and always asks.
  (tools as Record<string, unknown>).ask = mutation(
    {
      description:
        "Ask the Token Metrics AI agent (TMAI) a question about tokens, markets or trading ideas. Sends one user message and returns the agent's answer. Uses API credits.",
      input: object({ question: string() }),
    },
    async ({ fetch }, { question }) =>
      decodeJson(
        await fetch(`${base}/tmai`, {
          method: "POST",
          signal,
          redirect: "error",
          headers: { ...headers(account), "content-type": "application/json" },
          body: JSON.stringify({ messages: [{ user: question }] }),
        }),
        json(),
      ),
  );
  return withApprovals(router(tools as never), (tool) => (tool.kind === "mutation" ? always() : undefined));
};

export default defineApp({ user: { accounts: { tokenmetrics: tokenmetrics.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.tokenmetrics ?? [], (account) => tokenMetricsTools(account, signal), { signal }), {
    title: "Token Metrics",
    description:
      "Crypto market data and AI analytics: prices, OHLCV, TM, technology and fundamental grades, trading signals, market metrics, price predictions, indices and the TMAI agent.",
    icons,
  }),
}));
