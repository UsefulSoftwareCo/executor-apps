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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.coresignal.com";
const cd = `${base}/cdapi/v2`;

const coresignal = defineProvider({
  name: "Coresignal",
  hosts: ["api.coresignal.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Coresignal has no free account endpoint. A ES DSL search returns IDs only and is the cheapest
  // authenticated call; only 401/403 mean a bad key (a 402 or 429 is a plan or credit state, not a bad key).
  async health({ account, fetch, signal }) {
    const response = await fetch(`${cd}/company_multi_source/search/es_dsl?items_per_page=1`, {
      method: "POST",
      signal,
      headers: { apikey: account.fields.token, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query: { match_all: {} } }),
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Coresignal rejected the API key (${response.status})`);
    }
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { apikey: token, accept: "application/json", "Content-Type": "application/json" };
  const qs = (params: Record<string, string | number | undefined>, repeated: Record<string, string[] | undefined> = {}) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value));
    for (const [key, values] of Object.entries(repeated)) for (const value of values ?? []) search.append(key, value);
    const text = search.toString();
    return text ? `?${text}` : "";
  };
  const get = async (path: string) => decodeJson(await fetcher(`${cd}${path}`, { signal, headers }), json());
  const post = async (url: string, body: unknown) =>
    decodeJson(await fetcher(url, { method: "POST", signal, headers, body: JSON.stringify(body) }), json());
  const getText = async (path: string) => {
    const response = await fetcher(`${cd}${path}`, { signal, headers });
    if (!response.ok) throw new Error(`Coresignal request failed (${response.status}): ${await response.text()}`);
    return { text: await response.text() };
  };
  return { get, post, getText, qs };
}

type Client = ReturnType<typeof client>;

const dsl = record(json());
const fields = json().optional();

function fieldList(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.map(String) : undefined;
}

function dataset(c: Client, kind: "company" | "employee" | "job", key: string, label: string, extra: Record<string, any> = {}) {
  const searchInput = object({
    query: dsl,
    sort: json().optional(),
    itemsPerPage: number().optional(),
    after: string().optional(),
  });
  const body = (input: { query: Record<string, unknown>; sort?: unknown }) =>
    input.sort === undefined ? { query: input.query } : { query: input.query, sort: input.sort };
  const bulk = `${cd}/data_requests/${key}`;
  return router(
    {
      search: query(
        {
          description: `Search ${label} with an Elasticsearch DSL query body (the value of "query", e.g. {"bool":{"must":[...]}}). Returns a list of matching record IDs to pass to collect. Use itemsPerPage (up to 1000) and the "after" cursor from the previous response's x-next-page-after header for pagination. Field names are listed in the Coresignal data dictionary.`,
          input: searchInput,
        },
        async (_ctx, input) =>
          c.post(`${cd}/${key}/search/es_dsl${c.qs({ items_per_page: input.itemsPerPage, after: input.after })}`, body(input)),
      ),
      semanticSearch: query(
        {
          description: `Elasticsearch DSL search over ${label} with semantic (synonym-expanded) matching of job title style queries. Same body as search. threshold and boost tune the semantic matching.`,
          input: object({ query: dsl, sort: json().optional(), itemsPerPage: number().optional(), threshold: number().optional(), boost: number().optional() }),
        },
        async (_ctx, input) =>
          c.post(
            `${cd}/${key}/semantic_search/es_dsl${c.qs({ items_per_page: input.itemsPerPage, threshold: input.threshold, boost: input.boost })}`,
            body(input),
          ),
      ),
      searchPreview: query(
        {
          description: `Preview up to 20 matching ${label} with a limited set of fields in one call (same query body as search). Use page to page through up to 1,000 records.`,
          input: object({ query: dsl, sort: json().optional(), page: number().optional() }),
        },
        async (_ctx, input) => c.post(`${cd}/${key}/search/es_dsl/preview${c.qs({ page: input.page })}`, body(input)),
      ),
      collect: query(
        {
          description: `Collect one full ${label.replace(/s$/, "")} record by ID${kind === "job" ? "" : " or by profile URL shorthand name"} (the part of the URL after the profile path). Deducts credits per successful request. Optionally limit the response with fields (a list of field names)${kind === "employee" ? " or bundle (core_employee_data, employer_information, career_intelligence, social_influence)" : kind === "company" ? " or bundle (core_company_data, financial_information, growth_signals, workforce_intelligence, company_intelligence)" : ""}.`,
          input: object({ id: string({ minLength: 1 }), fields, bundles: kind === "job" ? json().optional() : fields }),
        },
        async (_ctx, input) =>
          c.get(`/${key}/collect/${encodeURIComponent(input.id)}${c.qs({}, { fields: fieldList(input.fields), bundle: fieldList(input.bundles) })}`),
      ),
      bulk: router(
        {
          requestByIds: mutation(
            {
              description: `Submit an asynchronous bulk collect of ${label} by a list of IDs. Returns a request_id; poll listFiles until files are ready. Deducts credits per record. Optional limit and webhook_url.`,
              input: object({ ids: json(), limit: number().optional(), webhookUrl: string().optional() }),
            },
            async (_ctx, input) =>
              c.post(`${bulk}/ids`, { ids: input.ids, ...(input.limit === undefined ? {} : { limit: input.limit }), ...(input.webhookUrl === undefined ? {} : { webhook_url: input.webhookUrl }) }),
          ),
          requestByQuery: mutation(
            {
              description: `Submit an asynchronous bulk collect of all ${label} matching an Elasticsearch DSL query body (the value of "query"). Returns a request_id. Set limit to cap the number of records and credits spent.`,
              input: object({ query: dsl, limit: number().optional(), webhookUrl: string().optional() }),
            },
            async (_ctx, input) =>
              c.post(`${bulk}/es_dsl`, {
                es_dsl_query: { query: input.query },
                ...(input.limit === undefined ? {} : { limit: input.limit }),
                ...(input.webhookUrl === undefined ? {} : { webhook_url: input.webhookUrl }),
              }),
          ),
        },
        { title: "Bulk collect", description: `Collect many ${label} asynchronously.` },
      ),
      ...extra,
    },
    { title: label[0]!.toUpperCase() + label.slice(1), description: `Search and collect ${label}.` },
  );
}

function build(c: Client) {
  return router(
    {
      companies: dataset(c, "company", "company_multi_source", "companies", {
        enrich: query(
          {
            description:
              "Look up a company record by website URL or domain (for example thermofisher.com). Deducts credits per successful request. Optionally limit with bundles (core_company_data, financial_information, growth_signals, workforce_intelligence, company_intelligence) or fields.",
            input: object({ website: string({ minLength: 1 }), fields, bundles: fields }),
          },
          async (_ctx, input) =>
            c.get(`/company_multi_source/enrich${c.qs({ website: input.website }, { fields: fieldList(input.fields), bundle: fieldList(input.bundles) })}`),
        ),
        historicalHeadcount: query(
          {
            description: "Collect monthly historical headcount and follower data for a company by company ID or shorthand name.",
            input: object({ id: string({ minLength: 1 }) }),
          },
          async (_ctx, { id }) => c.get(`/historical_headcount/collect/${encodeURIComponent(id)}`),
        ),
      }),
      employees: dataset(c, "employee", "employee_multi_source", "employees", {
        scrapeRealtime: mutation(
          {
            description:
              "Scrape a live employee profile by profile URL with the Real-time Employee API. maxAge is the maximum cache age in hours: 0 for current data, 24 for up to a day old, 168 for up to a week. Can take up to 30 seconds (408 means retry). Deducts credits.",
            input: object({ url: string({ minLength: 1 }), maxAge: number() }),
          },
          async (_ctx, { url, maxAge }) => c.post(`${base}/rtapi/v2/employee/scrape`, { url, max_age: maxAge }),
        ),
      }),
      jobs: dataset(c, "job", "job_multi_source", "job postings"),
      bulkFiles: router(
        {
          list: query(
            {
              description: "List the result files of a bulk collect request by data request ID (the request_id returned when submitting). Empty until processing finishes.",
              input: object({ dataRequestId: string({ minLength: 1 }) }),
            },
            async (_ctx, { dataRequestId }) => c.get(`/data_requests/${encodeURIComponent(dataRequestId)}/files`),
          ),
          read: query(
            {
              description: "Read a result file of a bulk collect request as text (JSON lines). Use list first to get file names.",
              input: object({ dataRequestId: string({ minLength: 1 }), fileName: string({ minLength: 1 }) }),
            },
            async (_ctx, { dataRequestId, fileName }) =>
              c.getText(`/data_requests/${encodeURIComponent(dataRequestId)}/files/${encodeURIComponent(fileName)}`),
          ),
        },
        { title: "Bulk files", description: "Retrieve results of bulk collect requests." },
      ),
    },
    { title: "Coresignal", description: "B2B company, employee and job posting data." },
  );
}

export default defineApp(
  { user: { accounts: { coresignal: coresignal.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.coresignal ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Coresignal",
        description: "Search and collect B2B company, employee and job posting data, run bulk collects, and scrape live employee profiles.",
        icons,
      },
    ),
  }),
);
