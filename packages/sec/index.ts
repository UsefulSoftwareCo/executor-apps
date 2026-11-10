import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

// EDGAR needs no API key. Its fair-access guidance asks automated requests to declare a
// User-Agent (sample format: company name plus admin contact email) and caps clients at
// 10 requests per second, which this package does not enforce. The account holds that identity; it is not a secret.
const sec = defineProvider({
  name: "SEC EDGAR",
  hosts: ["data.sec.gov", "www.sec.gov", "efts.sec.gov"],
  auth: {
    identity: secrets({
      label: "Requester identity (SEC fair-access User-Agent)",
      fields: object({ userAgent: plain(string({ minLength: 3 })) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://data.sec.gov/submissions/CIK0000320193.json", {
      signal,
      headers: { "user-agent": account.fields.userAgent, accept: "application/json" },
    });
    await decodeJson(response, object({ cik: string() }));
  },
});

const cikOf = (value: string) => {
  const digits = value.replace(/^CIK/i, "").trim();
  if (!/^\d{1,10}$/.test(digits)) throw new Error(`Invalid CIK "${value}": use up to 10 digits`);
  return digits.padStart(10, "0");
};
const segment = (value: string, label: string) => {
  if (!/^[A-Za-z0-9._-]+$/.test(value)) throw new Error(`Invalid ${label} "${value}"`);
  return value;
};

export default defineApp({ user: { accounts: { sec: sec.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.sec ?? [],
      (account) => {
        const get = async (url: string) =>
          decodeJson(
            await fetch(url, {
              signal,
              headers: { "user-agent": account.fields.userAgent, accept: "application/json" },
            }),
            json(),
          );
        const cik = string({ minLength: 1 });
        return router({
          submissions: router({
            get: query(
              {
                description:
                  "Filer metadata (name, SIC, tickers, exchanges, former names, addresses) and the recent filings (at least a year or 1,000 filings) as parallel arrays. Older filings are listed under filings.files; fetch those with submissions.getFile.",
                input: object({ cik }),
              },
              async (_ctx, { cik }) => get(`https://data.sec.gov/submissions/CIK${cikOf(cik)}.json`),
            ),
            getFile: query(
              {
                description:
                  "An additional submissions history file named in submissions.get's filings.files, for example CIK0000320193-submissions-001.json.",
                input: object({ name: string({ minLength: 1 }) }),
              },
              async (_ctx, { name }) => {
                if (!/^CIK\d{10}-submissions-\d{3}\.json$/.test(name)) throw new Error(`Invalid file name "${name}"`);
                return get(`https://data.sec.gov/submissions/${name}`);
              },
            ),
          }),
          xbrl: router({
            companyFacts: query(
              {
                description:
                  "Every XBRL fact a company has reported, grouped by taxonomy, concept and unit, in one call. Large for big filers; prefer companyConcept for one metric.",
                input: object({ cik }),
              },
              async (_ctx, { cik }) => get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cikOf(cik)}.json`),
            ),
            companyConcept: query(
              {
                description:
                  "All of one company's disclosures of one XBRL concept, grouped by unit. taxonomy is us-gaap, ifrs-full, dei or srt; tag is the concept such as Revenues or AccountsPayableCurrent.",
                input: object({ cik, taxonomy: string({ minLength: 1 }), tag: string({ minLength: 1 }) }),
              },
              async (_ctx, { cik, taxonomy, tag }) =>
                get(
                  `https://data.sec.gov/api/xbrl/companyconcept/CIK${cikOf(cik)}/${segment(taxonomy, "taxonomy")}/${segment(tag, "tag")}.json`,
                ),
            ),
            frames: query(
              {
                description:
                  "One fact per reporting company for a concept and calendar period, for cross-company comparison. unit is USD, shares, USD-per-shares or pure. period is CY2019 (annual), CY2019Q1 (quarterly) or CY2019Q1I (instantaneous, balance-sheet items).",
                input: object({
                  taxonomy: string({ minLength: 1 }),
                  tag: string({ minLength: 1 }),
                  unit: string({ minLength: 1 }),
                  period: string({ minLength: 1 }),
                }),
              },
              async (_ctx, { taxonomy, tag, unit, period }) =>
                get(
                  `https://data.sec.gov/api/xbrl/frames/${segment(taxonomy, "taxonomy")}/${segment(tag, "tag")}/${segment(unit, "unit")}/${segment(period, "period")}.json`,
                ),
            ),
          }),
          companies: router({
            tickers: query(
              {
                description: "Every ticker-listed company with its CIK, name and ticker. Use it to resolve a ticker to a CIK.",
                input: object({}),
              },
              async () => get("https://www.sec.gov/files/company_tickers.json"),
            ),
            tickersWithExchange: query(
              {
                description: "Ticker-listed companies with CIK, name, ticker and exchange, as fields plus data rows.",
                input: object({}),
              },
              async () => get("https://www.sec.gov/files/company_tickers_exchange.json"),
            ),
          }),
          filings: router({
            index: query(
              {
                description:
                  "Directory listing of one filing's files. accessionNumber may carry dashes (0000320193-23-000106) or not; cik is the filer's CIK.",
                input: object({ cik, accessionNumber: string({ minLength: 1 }) }),
              },
              async (_ctx, { cik, accessionNumber }) => {
                const accession = accessionNumber.replace(/-/g, "");
                if (!/^\d{18}$/.test(accession)) throw new Error(`Invalid accession number "${accessionNumber}"`);
                return get(`https://www.sec.gov/Archives/edgar/data/${Number(cikOf(cik))}/${accession}/index.json`);
              },
            ),
            search: query(
              {
                description:
                  "Full-text search of filings since 2001 (the engine behind sec.gov/edgar/search). q supports quoted phrases and boolean operators; forms is a comma-separated list such as 10-K,8-K; ciks a comma-separated list of CIKs; startdt and enddt are YYYY-MM-DD; from is the result offset (100 per page).",
                input: object({
                  q: string({ minLength: 1 }),
                  forms: string().optional(),
                  ciks: string().optional(),
                  startdt: string().optional(),
                  enddt: string().optional(),
                  from: number().optional(),
                }),
              },
              async (_ctx, input) => {
                const params = new URLSearchParams({ q: input.q });
                if (input.forms !== undefined) params.set("forms", input.forms);
                if (input.ciks !== undefined) params.set("ciks", input.ciks);
                if (input.startdt !== undefined || input.enddt !== undefined) {
                  params.set("dateRange", "custom");
                  if (input.startdt !== undefined) params.set("startdt", input.startdt);
                  if (input.enddt !== undefined) params.set("enddt", input.enddt);
                }
                if (input.from !== undefined) params.set("from", String(input.from));
                return get(`https://efts.sec.gov/LATEST/search-index?${params.toString()}`);
              },
            ),
          }),
        });
      },
      { signal },
    ),
    {
      title: "SEC EDGAR",
      description: "Company filings, XBRL financial data, ticker lookup and full-text search from the U.S. SEC's EDGAR system.",
      instructions:
        "Read-only. Resolve a ticker to a CIK with companies.tickers, then use submissions.get for the filing list and xbrl.companyConcept for a single metric. EDGAR limits clients to 10 requests per second.",
      icons,
    },
  ),
}));
