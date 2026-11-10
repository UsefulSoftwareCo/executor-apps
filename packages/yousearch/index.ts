import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.you.com";
const index = "https://ydc-index.io";

const you = defineProvider({
  name: "You.com",
  hosts: ["api.you.com", "ydc-index.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${api}/v1/billing/account_balance`, {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    const { data } = await decodeJson(response, object({ data: object({ id: string() }) }));
    return { accountInfo: { externalId: data.id } };
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "X-API-Key": account.fields.token, Accept: "application/json" });

const post = (account: Account, signal: AbortSignal, fetch: typeof globalThis.fetch, url: string, body: unknown) =>
  fetch(url, {
    method: "POST",
    signal,
    headers: { ...headers(account), "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const domains = {
  include_domains: array(string()).optional(),
  exclude_domains: array(string()).optional(),
  boost_domains: array(string()).optional(),
};

const youTools = (account: Account, signal: AbortSignal) =>
  router({
    search: query(
      {
        description:
          "Search the web and news. Returns LLM-ready results with snippets. query supports search operators. count is results per section (default 10). freshness is day, week, month, year or YYYY-MM-DDtoYYYY-MM-DD. offset is 0-9 in multiples of count. country is a two-letter code such as US; language a BCP 47 tag such as EN. safesearch is off, moderate or strict. include_domains cannot be combined with exclude_domains or boost_domains. extraction (optional object) requests per-result content, for example { \"highlights\": {} } or { \"full_page\": { \"extraction_formats\": [\"markdown\"] } }; it can add cost. crawl_timeout is 1-60 seconds.",
        input: object({
          query: string(),
          count: number().optional(),
          freshness: string().optional(),
          offset: number().optional(),
          country: string().optional(),
          language: string().optional(),
          safesearch: string().optional(),
          knowledge: string().optional(),
          extraction: record(json()).optional(),
          crawl_timeout: number().optional(),
          ...domains,
        }),
      },
      async ({ fetch }, input) => decodeJson(await post(account, signal, fetch, `${index}/v1/search`, input), json()),
    ),
    contents: query(
      {
        description:
          "Fetch the contents of web pages. urls is the list of pages; formats is any of html, markdown and metadata (JSON-LD and OpenGraph). crawl_timeout is 1-60 seconds (default 10). max_age re-fetches cached content older than that many seconds.",
        input: object({
          urls: array(string()),
          formats: array(string()).optional(),
          crawl_timeout: number().optional(),
          max_age: number().optional(),
        }),
      },
      async ({ fetch }, input) => decodeJson(await post(account, signal, fetch, `${index}/v1/contents`, input), json()),
    ),
    answer: query(
      {
        description:
          "Get a synthesized natural-language answer to a query, with numbered citations and the web results used. freshness is day, week, month, year or YYYY-MM-DDtoYYYY-MM-DD. include_domains cannot be combined with exclude_domains or boost_domains.",
        input: object({
          query: string(),
          freshness: string().optional(),
          country: string().optional(),
          language: string().optional(),
          safesearch: string().optional(),
          ...domains,
        }),
      },
      async ({ fetch }, input) => decodeJson(await post(account, signal, fetch, `${api}/v1/answer`, input), json()),
    ),
    images: query(
      {
        description:
          "Search for images. q supports operators such as site: and filetype:. count is 1-100 (default 10). Beta; access is limited to early access partners and may return 403 otherwise.",
        input: object({ q: string(), count: number().optional() }),
      },
      async ({ fetch }, { q, count }) => {
        const params = new URLSearchParams({ q });
        if (count !== undefined) params.set("count", String(count));
        return decodeJson(await fetch(`${api}/v1/images?${params}`, { signal, headers: headers(account) }), json());
      },
    ),
    accountBalance: query(
      {
        description: "Get the remaining credit balance for the API key's billing entity. data.attributes.balance is in cents.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${api}/v1/billing/account_balance`, { signal, headers: headers(account) }), json()),
    ),
    research: router(
      {
        run: mutation(
          {
            description:
              "Run the Research API: multiple searches, source reading and a cited answer. research_effort is lite (<10s), standard (default, 10-30s), deep (<120s), exhaustive (<300s) or frontier (long-running; requires background: true). With background: true it returns a task id at once; poll research.task. source_control (beta) is an object with include_domains, exclude_domains, boost_domains and more; include_domains cannot be combined with exclude_domains. output_schema (beta) requests structured JSON in output.content; it needs a JSON object root, additionalProperties false, every property required, and is not allowed with lite. Billed per call.",
            input: object({
              input: string(),
              research_effort: string().optional(),
              background: boolean().optional(),
              source_control: record(json()).optional(),
              output_schema: record(json()).optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(await post(account, signal, fetch, `${api}/v1/research`, input), json()),
        ),
        task: query(
          {
            description:
              "Get the status of a background research task. status is queued, running, completed, failed or cancelled; result is null until completed.",
            input: object({ task_id: string() }),
          },
          async ({ fetch }, { task_id }) =>
            decodeJson(
              await fetch(`${api}/v1/research/${encodeURIComponent(task_id)}`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
      },
      { title: "Research", description: "Deep, cited research with optional background execution." },
    ),
    financeResearch: mutation(
      {
        description:
          "Run the Finance Research API: a cited answer to financial questions using an index of earnings reports, SEC filings, analyst coverage, market data and news. research_effort is deep (default, <120s) or exhaustive (<300s). output_schema (beta) follows the same rules as research.run. Billed per call.",
        input: object({
          input: string(),
          research_effort: string().optional(),
          output_schema: record(json()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(await post(account, signal, fetch, `${api}/v1/finance_research`, input), json()),
    ),
  });

export default defineApp({ user: { accounts: { you: you.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.you ?? [], (account) => youTools(account, signal), { signal }), {
    title: "You.com",
    description: "Real-time web and news search, page contents, cited answers, and deep and finance research with the You.com API.",
    icons,
  }),
}));
