import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const trader = "https://api.schwabapi.com/trader/v1";
const marketdata = "https://api.schwabapi.com/marketdata/v1";

type Account = { method: "oauth"; fields: { access_token: string } };

const schwab = defineProvider({
  name: "Charles Schwab",
  hosts: ["api.schwabapi.com"],
  auth: {
    // Schwab issues the app key and secret in the developer portal; the app has no scopes.
    // Access tokens last 30 minutes and refresh tokens 7 days, so the user reconnects weekly.
    oauth: oauth2({
      authorizationUrl: "https://api.schwabapi.com/v1/oauth/authorize",
      tokenUrl: "https://api.schwabapi.com/v1/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${trader}/accounts/accountNumbers`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, base: string, path: string, init: { query?: Params; body?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${account.fields.access_token}`,
      Accept: "application/json",
    };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (!response.ok) {
      throw new Error(`Schwab responded with HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
    }
    // Order placement, replacement and cancellation answer with an empty body (the new order id is in the Location header).
    const location = response.headers.get("location");
    const text = await response.text();
    if (text.trim() === "") return location ? { ok: true, location } : { ok: true };
    return JSON.parse(text) as unknown;
  };
}

const enc = encodeURIComponent;
const accountHash = string({ minLength: 1 });
const orderId = string({ minLength: 1 });
const opt = string().optional();
const orderWindow = {
  fromEnteredTime: string({ minLength: 1 }),
  toEnteredTime: string({ minLength: 1 }),
  maxResults: number().optional(),
  status: opt,
};
const orderQuery = (i: { fromEnteredTime: string; toEnteredTime: string; maxResults?: number | undefined; status?: string | undefined }): Params => ({
  fromEnteredTime: i.fromEnteredTime,
  toEnteredTime: i.toEnteredTime,
  maxResults: i.maxResults,
  status: i.status,
});
const orderNote =
  "fromEnteredTime and toEnteredTime are ISO-8601 timestamps such as 2026-01-01T00:00:00.000Z (range at most 60 days). status is one of AWAITING_PARENT_ORDER, AWAITING_CONDITION, AWAITING_STOP_CONDITION, AWAITING_MANUAL_REVIEW, ACCEPTED, AWAITING_UR_OUT, PENDING_ACTIVATION, QUEUED, WORKING, REJECTED, PENDING_CANCEL, CANCELED, PENDING_REPLACE, REPLACED, FILLED, EXPIRED, NEW, AWAITING_RELEASE_TIME, PENDING_ACKNOWLEDGEMENT, PENDING_RECALL, UNKNOWN.";
const orderBodyNote =
  "body is Schwab's order object: { session, duration, orderType, orderStrategyType, price?, orderLegCollection: [{ instruction, quantity, instrument: { symbol, assetType } }] } as documented in the Trader API Order Examples.";

function build(send: ReturnType<typeof client>) {
  const t = (method: string, path: string, init?: { query?: Params; body?: unknown }) => send(method, trader, path, init);
  const m = (path: string, q?: Params) => send("GET", marketdata, path, { query: q });
  return router({
    accounts: router(
      {
        numbers: query(
          { description: "List the linked accounts' plain account numbers with the encrypted hashValue every other account endpoint requires.", input: object({}) },
          async () => t("GET", "/accounts/accountNumbers"),
        ),
        list: query(
          { description: "List all linked accounts with balances. Pass fields=positions to include positions.", input: object({ fields: opt }) },
          async (_c, i) => t("GET", "/accounts", { query: { fields: i.fields } }),
        ),
        get: query(
          { description: "Get one account's balances. accountHash comes from numbers. Pass fields=positions to include positions.", input: object({ accountHash, fields: opt }) },
          async (_c, i) => t("GET", `/accounts/${enc(i.accountHash)}`, { query: { fields: i.fields } }),
        ),
        userPreference: query(
          { description: "Get the user's preferences: account nicknames, display colors, streamer connection info and offers.", input: object({}) },
          async () => t("GET", "/userPreference"),
        ),
      },
      { title: "Accounts", description: "Linked brokerage accounts, balances, positions and user preferences." },
    ),
    orders: router(
      {
        listAll: query(
          { description: `List orders across all linked accounts. ${orderNote}`, input: object(orderWindow) },
          async (_c, i) => t("GET", "/orders", { query: orderQuery(i) }),
        ),
        list: query(
          { description: `List orders for one account. ${orderNote}`, input: object({ accountHash, ...orderWindow }) },
          async (_c, i) => t("GET", `/accounts/${enc(i.accountHash)}/orders`, { query: orderQuery(i) }),
        ),
        get: query(
          { description: "Get one order by its id.", input: object({ accountHash, orderId }) },
          async (_c, i) => t("GET", `/accounts/${enc(i.accountHash)}/orders/${enc(i.orderId)}`),
        ),
        preview: mutation(
          { description: `Preview an order without placing it. ${orderBodyNote}`, input: object({ accountHash, body: json() }), approval: always() },
          async (_c, i) => t("POST", `/accounts/${enc(i.accountHash)}/previewOrder`, { body: i.body }),
        ),
        place: mutation(
          { description: `Place an order, which can trade real money. Returns the new order's Location header. ${orderBodyNote}`, input: object({ accountHash, body: json() }), approval: always() },
          async (_c, i) => t("POST", `/accounts/${enc(i.accountHash)}/orders`, { body: i.body }),
        ),
        replace: mutation(
          { description: `Replace an existing order with a new one. ${orderBodyNote}`, input: object({ accountHash, orderId, body: json() }), approval: always() },
          async (_c, i) => t("PUT", `/accounts/${enc(i.accountHash)}/orders/${enc(i.orderId)}`, { body: i.body }),
        ),
        cancel: mutation(
          { description: "Cancel an open order.", input: object({ accountHash, orderId }), approval: always() },
          async (_c, i) => t("DELETE", `/accounts/${enc(i.accountHash)}/orders/${enc(i.orderId)}`),
        ),
      },
      { title: "Orders", description: "Order history, previews, placement, replacement and cancellation." },
    ),
    transactions: router(
      {
        list: query(
          {
            description:
              "List an account's transactions. startDate and endDate are ISO-8601 timestamps. types is one of TRADE, RECEIVE_AND_DELIVER, DIVIDEND_OR_INTEREST, ACH_RECEIPT, ACH_DISBURSEMENT, CASH_RECEIPT, CASH_DISBURSEMENT, ELECTRONIC_FUND, WIRE_OUT, WIRE_IN, JOURNAL, MEMORANDUM, MARGIN_CALL, MONEY_MARKET, SMA_ADJUSTMENT. symbol filters by instrument.",
            input: object({ accountHash, startDate: string({ minLength: 1 }), endDate: string({ minLength: 1 }), types: string({ minLength: 1 }), symbol: opt }),
          },
          async (_c, i) =>
            t("GET", `/accounts/${enc(i.accountHash)}/transactions`, { query: { startDate: i.startDate, endDate: i.endDate, types: i.types, symbol: i.symbol } }),
        ),
        get: query(
          { description: "Get one transaction by its id.", input: object({ accountHash, transactionId: string({ minLength: 1 }) }) },
          async (_c, i) => t("GET", `/accounts/${enc(i.accountHash)}/transactions/${enc(i.transactionId)}`),
        ),
      },
      { title: "Transactions", description: "Account transaction history." },
    ),
    quotes: router(
      {
        list: query(
          {
            description:
              "Get quotes for a comma-separated list of symbols (equities, options, futures, forex, indices). fields is a comma-separated subset of quote, fundamental, extended, reference, regular. indicative=true includes indicative quotes for ETFs.",
            input: object({ symbols: string({ minLength: 1 }), fields: opt, indicative: opt }),
          },
          async (_c, i) => m("/quotes", { symbols: i.symbols, fields: i.fields, indicative: i.indicative }),
        ),
        get: query(
          { description: "Get the quote for one symbol. fields is a comma-separated subset of quote, fundamental, extended, reference, regular.", input: object({ symbol: string({ minLength: 1 }), fields: opt }) },
          async (_c, i) => m(`/${enc(i.symbol)}/quotes`, { fields: i.fields }),
        ),
      },
      { title: "Quotes", description: "Real-time and delayed quotes." },
    ),
    options: router(
      {
        chain: query(
          {
            description:
              "Get the option chain for an underlying symbol. contractType is CALL, PUT or ALL; strikeCount limits strikes around the money; range is ITM, NTM, OTM, SAK, SBK, SNK or ALL; fromDate and toDate are yyyy-MM-dd; strategy is SINGLE, ANALYTICAL, COVERED, VERTICAL, CALENDAR, STRANGLE, STRADDLE, BUTTERFLY, CONDOR, DIAGONAL, COLLAR or ROLL.",
            input: object({
              symbol: string({ minLength: 1 }),
              contractType: opt,
              strikeCount: number().optional(),
              includeUnderlyingQuote: opt,
              strategy: opt,
              interval: number().optional(),
              strike: number().optional(),
              range: opt,
              fromDate: opt,
              toDate: opt,
              volatility: number().optional(),
              underlyingPrice: number().optional(),
              interestRate: number().optional(),
              daysToExpiration: number().optional(),
              expMonth: opt,
              optionType: opt,
              entitlement: opt,
            }),
          },
          async (_c, i) => m("/chains", { ...i }),
        ),
        expirations: query(
          { description: "Get the option expiration dates for an underlying symbol.", input: object({ symbol: string({ minLength: 1 }) }) },
          async (_c, i) => m("/expirationchain", { symbol: i.symbol }),
        ),
      },
      { title: "Options", description: "Option chains and expiration dates." },
    ),
    priceHistory: router(
      {
        get: query(
          {
            description:
              "Get OHLCV candles for a symbol. periodType is day, month, year or ytd; period is the number of periods; frequencyType is minute, daily, weekly or monthly; frequency is the number of those per candle. startDate and endDate are epoch milliseconds. Set needExtendedHoursData or needPreviousClose to true as needed.",
            input: object({
              symbol: string({ minLength: 1 }),
              periodType: opt,
              period: number().optional(),
              frequencyType: opt,
              frequency: number().optional(),
              startDate: number().optional(),
              endDate: number().optional(),
              needExtendedHoursData: opt,
              needPreviousClose: opt,
            }),
          },
          async (_c, i) => m("/pricehistory", { ...i }),
        ),
      },
      { title: "Price history", description: "Historical candles." },
    ),
    markets: router(
      {
        movers: query(
          {
            description:
              "Get top movers for an index. index is $DJI, $COMPX, $SPX, NYSE, NASDAQ, OTCBB, INDEX_ALL, EQUITY_ALL, OPTION_ALL, OPTION_PUT or OPTION_CALL. sort is VOLUME, TRADES, PERCENT_CHANGE_UP or PERCENT_CHANGE_DOWN; frequency is 0, 1, 5, 10, 30 or 60 minutes.",
            input: object({ index: string({ minLength: 1 }), sort: opt, frequency: number().optional() }),
          },
          async (_c, i) => m(`/movers/${enc(i.index)}`, { sort: i.sort, frequency: i.frequency }),
        ),
        hours: query(
          { description: "Get market hours for a comma-separated list of markets (equity, option, bond, future, forex). date is yyyy-MM-dd.", input: object({ markets: string({ minLength: 1 }), date: opt }) },
          async (_c, i) => m("/markets", { markets: i.markets, date: i.date }),
        ),
        hoursFor: query(
          { description: "Get market hours for one market (equity, option, bond, future, forex). date is yyyy-MM-dd.", input: object({ marketId: string({ minLength: 1 }), date: opt }) },
          async (_c, i) => m(`/markets/${enc(i.marketId)}`, { date: i.date }),
        ),
      },
      { title: "Markets", description: "Market movers and trading hours." },
    ),
    instruments: router(
      {
        search: query(
          { description: "Search instruments. projection is symbol-search, symbol-regex, desc-search, desc-regex, search or fundamental.", input: object({ symbol: string({ minLength: 1 }), projection: string({ minLength: 1 }) }) },
          async (_c, i) => m("/instruments", { symbol: i.symbol, projection: i.projection }),
        ),
        get: query(
          { description: "Get an instrument by CUSIP.", input: object({ cusip: string({ minLength: 1 }) }) },
          async (_c, i) => m(`/instruments/${enc(i.cusip)}`),
        ),
      },
      { title: "Instruments", description: "Instrument search and CUSIP lookup." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { schwab: schwab.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.schwab ?? [], (account) => build(client(account, fetch, signal)), { signal }),
      {
        title: "Charles Schwab",
        description: "Schwab brokerage accounts, positions, orders, transactions, quotes, option chains, price history and market hours.",
        icons,
      },
    ),
  }),
);
