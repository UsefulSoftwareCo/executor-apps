import {
  accountRouter,
  defineApp,
  defineProvider,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://elite.finviz.com";

const finviz = defineProvider({
  name: "Finviz",
  hosts: ["elite.finviz.com"],
  auth: {
    apiKey: secrets({
      label: "Finviz Elite API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // There is no account endpoint. A one-ticker screener export proves the key and the Elite plan.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/export?${new URLSearchParams({ v: "111", t: "AAPL", auth: account.fields.token })}`, {
      signal,
    });
    if (!response.ok) throw new Error(`Finviz rejected the API key (HTTP ${response.status}). An Elite plan is required.`);
    const rows = parseCsv(await checkedCsv(response, "export"));
    if (!rows[0]?.includes("Ticker")) throw new Error("Finviz health check did not return the expected CSV header (no Ticker column).");
  },
});

type Account = { fields: { token: string } };

// Finviz answers every export with CSV; split it into rows keyed by the header line.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

// Without a valid auth parameter Finviz answers 200 with an HTML upsell page, so check where the response came from and what it is.
async function checkedCsv(response: Response, path: string): Promise<string> {
  const host = new URL(response.url || base).hostname;
  const type = response.headers.get("content-type") ?? "";
  if (host !== "elite.finviz.com" || !/^text\/(plain|csv)/i.test(type)) {
    throw new Error(`Finviz ${path} did not return CSV (content-type "${type}", host ${host}); the API key is missing or the account has no Elite plan.`);
  }
  return response.text();
}

const MaxRecords = number().optional();

type Params = Record<string, string | number | undefined>;

const exportCsv = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  path: string,
  params: Params,
  maxRecords: number | undefined,
) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") search.set(key, String(value));
  search.set("auth", account.fields.token);
  const response = await fetch(`${base}/${path}?${search}`, { signal });
  if (!response.ok) {
    throw new Error(`Finviz ${path} failed with HTTP ${response.status}${response.status === 429 ? " (rate limited)" : ""}`);
  }
  const [header = [], ...body] = parseCsv(await checkedCsv(response, path));
  const limit = Math.max(1, Math.min(maxRecords ?? 500, 5000));
  const rows = body.slice(0, limit).map((cells) => Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ""])));
  return { columns: header, rows, totalRows: body.length, truncated: body.length > rows.length };
};

const finvizTools = (account: Account, signal: AbortSignal) =>
  router(
    {
      screener: router({
        export: query(
          {
            description:
              "Run a Finviz stock screener and return the rows. Build the filters in the screener at finviz.com/screener.ashx and copy the codes from its URL. Rows come back as strings keyed by column name.",
            input: object({
              view: string().default("111"),
              filters: string().optional(),
              tickers: string().optional(),
              columns: string().optional(),
              order: string().optional(),
              maxRecords: MaxRecords,
            }),
          },
          ({ fetch }, input) =>
            exportCsv(
              fetch,
              account,
              signal,
              "export",
              { v: input.view, f: input.filters, t: input.tickers, c: input.columns, o: input.order },
              input.maxRecords,
            ),
        ),
      }),
      quotes: router({
        history: query(
          {
            description:
              "Get OHLCV price bars for one ticker. timeframe: i1, i3, i5, i15, i30 (intraday minutes), d (daily), w (weekly), m (monthly).",
            input: object({ ticker: string({ minLength: 1 }), timeframe: string().default("d"), maxRecords: MaxRecords }),
          },
          ({ fetch }, input) =>
            exportCsv(fetch, account, signal, "quote_export.ashx", { t: input.ticker, p: input.timeframe }, input.maxRecords),
        ),
      }),
      news: router({
        export: query(
          {
            description: "Get Finviz market news (view 1) or blog and other news feeds by view number, as rows with time, headline and link.",
            input: object({ view: string().default("1"), maxRecords: MaxRecords }),
          },
          ({ fetch }, input) => exportCsv(fetch, account, signal, "news_export.ashx", { v: input.view }, input.maxRecords),
        ),
      }),
      groups: router({
        export: query(
          {
            description:
              "Get aggregated performance and valuation metrics for market groups. group: sector, industry, country, capitalization.",
            input: object({
              group: string().default("sector"),
              view: string().default("152"),
              order: string().optional(),
              columns: string().optional(),
              maxRecords: MaxRecords,
            }),
          },
          ({ fetch }, input) =>
            exportCsv(
              fetch,
              account,
              signal,
              "grp_export.ashx",
              { g: input.group, v: input.view, o: input.order, c: input.columns },
              input.maxRecords,
            ),
        ),
      }),
    },
  );

export default defineApp({ user: { accounts: { finviz: finviz.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.finviz ?? [], (account) => finvizTools(account, signal), { signal }), {
    title: "Finviz",
    description: "Finviz Elite exports: stock screener, price history, news, market groups as rows.",
    instructions:
      "Needs a Finviz Elite plan. Finviz rate-limits exports (reported as roughly 10 requests per 5 seconds, unverified), so call them one at a time. Values are strings. Results are cut to maxRecords (default 500); check truncated and totalRows.",
    icons,
  }),
}));
