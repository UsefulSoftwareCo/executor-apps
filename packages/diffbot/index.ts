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

const api = "https://api.diffbot.com";
const kg = "https://kg.diffbot.com";
const nl = "https://nl.diffbot.com";
const llm = "https://llm.diffbot.com";

const diffbot = defineProvider({
  name: "Diffbot",
  hosts: ["api.diffbot.com", "kg.diffbot.com", "nl.diffbot.com", "llm.diffbot.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${api}/v4/account?token=${encodeURIComponent(account.fields.token)}`, { signal });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// Diffbot authenticates every API with a `token` query parameter; the Web
// Search host (llm.diffbot.com) takes the same token as a bearer header.
type Init = { method?: string; body?: string; contentType?: string; form?: Params; bearer?: boolean };

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (origin: string, path: string, params: Params = {}, init: Init = {}) => {
    const url = new URL(`${origin}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    if (!init.bearer) url.searchParams.set("token", token);
    // Crawl and Bulk create take form-encoded fields in the body (token stays in the query).
    let body = init.body;
    let contentType = init.contentType ?? "application/json";
    if (init.form) {
      const form = new URLSearchParams();
      for (const [key, value] of Object.entries(init.form)) {
        if (value === undefined || value === null) continue;
        form.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
      }
      body = form.toString();
      contentType = "application/x-www-form-urlencoded";
    }
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = contentType;
    if (init.bearer) headers.Authorization = `Bearer ${token}`;
    const response = await fetcher(url.toString(), {
      signal,
      method: init.method ?? "GET",
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
      ...(body !== undefined ? { body } : {}),
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

// path segment, tool name, description
const extractors: readonly [string, string, string][] = [
  ["article", "article", "Extract a news article or blog post: title, author, date, text, HTML, images, sentiment, tags."],
  ["product", "product", "Extract a product page: name, brand, offer price, SKU, images, specs, reviews."],
  ["image", "image", "Extract images from a page with sizes, captions and OCR text."],
  ["video", "video", "Extract an embedded or hosted video from a page."],
  ["discussion", "discussion", "Extract a forum thread or review/comment section with posts and authors."],
  ["event", "event", "Extract an event page: name, dates, venue, organizer, tickets."],
  ["job", "job", "Extract a job posting: title, employer, location, employment type, compensation, requirements."],
  ["list", "list", "Extract the items of a list or directory page."],
  ["analyze", "analyze", "Automatically detect the page type and run the matching extractor."],
];

const extractInput = object({
  url: string({ minLength: 1 }),
  fields: string().optional(),
  timeout: number().optional(),
  params: record(json()).optional(),
});

function build(call: Call) {
  const extract = Object.fromEntries(
    extractors.map(([path, name, description]) => [
      name,
      query(
        {
          description: `${description} Set fields (comma separated, e.g. "links,meta") for extra data and params for further API options. Uses extraction credits.`,
          input: extractInput,
        },
        async (_ctx, { url, fields, timeout, params }) =>
          call(api, `/v3/${path}`, { ...(params ?? {}), url, fields, timeout }),
      ),
    ]),
  );

  return router({
    extract: router(
      {
        ...extract,
        fromHtml: mutation(
          {
            description:
              "Run an extractor on HTML you supply instead of a URL (POSTs the HTML; url is the page's address for resolving links). api is one of article, product, image, video, discussion, event, job, list, analyze.",
            input: object({
              api: string({ minLength: 1 }),
              url: string({ minLength: 1 }),
              html: string({ minLength: 1 }),
              fields: string().optional(),
            }),
          },
          async (_ctx, { api: path, url, html, fields }) =>
            call(api, `/v3/${encodeURIComponent(path)}`, { url, fields }, { method: "POST", body: html, contentType: "text/html" }),
        ),
      },
      { title: "Extract", description: "Automatic extraction APIs: turn any web page into structured data." },
    ),
    knowledgeGraph: router(
      {
        search: query(
          {
            description:
              'Search the Diffbot Knowledge Graph with a DQL query, e.g. type:Organization name:"Diffbot" or type:Person employments.employer.name:"Google". Returns entities with facts. Uses KG credits.',
            input: object({
              query: string({ minLength: 1 }),
              size: number().optional(),
              from: number().optional(),
              params: record(json()).optional(),
            }),
          },
          async (_ctx, { query: dql, size, from, params }) =>
            call(kg, "/kg/v3/dql", { ...(params ?? {}), type: "query", query: dql, size, from }),
        ),
        enhance: query(
          {
            description:
              "Enrich a person or organization from partial data. type is Person or Organization; supply any of name, url, email, phone, employer, location, ids. Returns best-match Knowledge Graph entities.",
            input: object({
              type: string({ minLength: 1 }),
              name: string().optional(),
              url: string().optional(),
              email: string().optional(),
              size: number().optional(),
              threshold: number().optional(),
              params: record(json()).optional(),
            }),
          },
          async (_ctx, { type, name, url, email, size, threshold, params }) =>
            call(kg, "/kg/v3/enhance", { ...(params ?? {}), type, name, url, email, size, threshold }),
        ),
        combine: query(
          {
            description:
              "Enhance Combine: like enhance, but merges the matching Knowledge Graph entities for a Person or Organization into a single combined entity. type is Person or Organization; supply any of name, url, email, phone, employer, title, school, location.",
            input: object({
              type: string({ minLength: 1 }),
              name: string().optional(),
              url: string().optional(),
              email: string().optional(),
              threshold: number().optional(),
              params: record(json()).optional(),
            }),
          },
          async (_ctx, { type, name, url, email, threshold, params }) =>
            call(kg, "/kg/v3/enhance/combine", { ...(params ?? {}), type, name, url, email, threshold }),
        ),
        report: query(
          {
            description:
              "Run a DQL coverage report: aggregate statistics over the entities matching a DQL query. Pass a report id (from a previous report) to fetch it instead.",
            input: object({
              query: string().optional(),
              id: string().optional(),
              size: number().optional(),
              from: number().optional(),
              params: record(json()).optional(),
            }),
          },
          async (_ctx, { query: dql, id, size, from, params }) =>
            id !== undefined
              ? call(kg, `/kg/v3/dql/report/${encodeURIComponent(id)}`)
              : call(kg, "/kg/v3/dql/report", { ...(params ?? {}), query: dql, size, from }),
        ),
        enhanceBulk: router(
          {
            stop: mutation(
              { description: "Stop a running bulk enhance job.", input: object({ jobId: string({ minLength: 1 }) }) },
              async (_ctx, { jobId }) => call(kg, `/kg/v3/enhance/bulk/${encodeURIComponent(jobId)}/stop`),
            ),
            delete: mutation(
              { description: "Delete a bulk enhance job and its results.", input: object({ jobId: string({ minLength: 1 }) }) },
              async (_ctx, { jobId }) => call(kg, `/kg/v3/enhance/bulk/${encodeURIComponent(jobId)}/delete`),
            ),
            row: query(
              {
                description: "Result of a single row of a bulk enhance job, by zero-based row index.",
                input: object({ jobId: string({ minLength: 1 }), index: number() }),
              },
              async (_ctx, { jobId, index }) => call(kg, `/kg/v3/enhance/bulk/${encodeURIComponent(jobId)}/${index}`),
            ),
            report: query(
              {
                description: "Fetch a report for a bulk enhance job.",
                input: object({ jobId: string({ minLength: 1 }), reportId: string({ minLength: 1 }) }),
              },
              async (_ctx, { jobId, reportId }) =>
                call(kg, `/kg/v3/enhance/bulk/report/${encodeURIComponent(jobId)}/${encodeURIComponent(reportId)}`),
            ),
            create: mutation(
              {
                description:
                  "Start a bulk enhance job. body is the JSON array of entity lookups (each with type and name/url/email...). Returns the bulk job id.",
                input: object({ name: string({ minLength: 1 }), body: json(), params: record(json()).optional() }),
              },
              async (_ctx, { name, body, params }) =>
                call(kg, "/kg/v3/enhance/bulk", { ...(params ?? {}), name }, { method: "POST", body: JSON.stringify(body) }),
            ),
            list: query(
              { description: "List the status of all bulk enhance jobs on this token.", input: object({}) },
              async () => call(kg, "/kg/v3/enhance/bulk/status"),
            ),
            status: query(
              { description: "Status and progress of a bulk enhance job.", input: object({ jobId: string({ minLength: 1 }) }) },
              async (_ctx, { jobId }) => call(kg, `/kg/v3/enhance/bulk/${encodeURIComponent(jobId)}/status`),
            ),
            results: query(
              { description: "Results of a bulk enhance job.", input: object({ jobId: string({ minLength: 1 }) }) },
              async (_ctx, { jobId }) => call(kg, `/kg/v3/enhance/bulk/${encodeURIComponent(jobId)}`),
            ),
          },
          { title: "Bulk enhance", description: "Enrich many entities in one asynchronous job." },
        ),
      },
      { title: "Knowledge Graph", description: "Search and enrich entities in Diffbot's Knowledge Graph." },
    ),
    crawl: router(
      {
        list: query(
          { description: "List all Crawlbot crawl jobs and their status, or one job when name is set.", input: object({ name: string().optional() }) },
          async (_ctx, { name }) => call(api, "/v3/crawl", { name }),
        ),
        create: mutation(
          {
            description:
              "Create a Crawlbot crawl job. seeds is a space-separated list of start URLs and apiUrl the extraction API to run on each page (e.g. https://api.diffbot.com/v3/article). Extra options (maxToCrawl, urlCrawlPattern, maxHops...) go in params.",
            input: object({
              name: string({ minLength: 1 }),
              seeds: string({ minLength: 1 }),
              apiUrl: string({ minLength: 1 }),
              params: record(json()).optional(),
            }),
          },
          async (_ctx, { name, seeds, apiUrl, params }) =>
            call(api, "/v3/crawl", {}, { method: "POST", form: { ...(params ?? {}), name, seeds, apiUrl } }),
        ),
        update: mutation(
          {
            description:
              "Change a crawl job. Set any of pause (1 or 0), restart (1), roundStart (1 starts a new round), delete (1), or other crawl options in params.",
            input: object({ name: string({ minLength: 1 }), params: record(json()) }),
          },
          async (_ctx, { name, params }) => call(api, "/v3/crawl", { ...params, name }),
        ),
        data: query(
          {
            description: "Download extracted objects from a crawl job (format json or csv; num limits results).",
            input: object({ name: string({ minLength: 1 }), format: string().optional(), num: number().optional() }),
          },
          async (_ctx, { name, format, num }) => call(api, "/v3/crawl/data", { name, format, num }),
        ),
      },
      { title: "Crawlbot", description: "Crawl whole sites and extract structured data from every page." },
    ),
    bulk: router(
      {
        list: query(
          { description: "List all Bulk API jobs, or one when name is set.", input: object({ name: string().optional() }) },
          async (_ctx, { name }) => call(api, "/v3/bulk", { name }),
        ),
        create: mutation(
          {
            description:
              "Create a Bulk API job. urls is a space-separated list of URLs and apiUrl the extraction API to run on each (e.g. https://api.diffbot.com/v3/article).",
            input: object({
              name: string({ minLength: 1 }),
              urls: string({ minLength: 1 }),
              apiUrl: string({ minLength: 1 }),
              params: record(json()).optional(),
            }),
          },
          async (_ctx, { name, urls, apiUrl, params }) =>
            call(api, "/v3/bulk", {}, { method: "POST", form: { ...(params ?? {}), name, urls, apiUrl } }),
        ),
        update: mutation(
          {
            description: "Change a bulk job. Set pause (1 or 0), restart (1) or delete (1) in params.",
            input: object({ name: string({ minLength: 1 }), params: record(json()) }),
          },
          async (_ctx, { name, params }) => call(api, "/v3/bulk", { ...params, name }),
        ),
        data: query(
          {
            description: "Download extracted objects from a bulk job (format json or csv).",
            input: object({ name: string({ minLength: 1 }), format: string().optional() }),
          },
          async (_ctx, { name, format }) => call(api, "/v3/bulk/data", { name, format }),
        ),
      },
      { title: "Bulk API", description: "Run an extraction API over a list of URLs as an asynchronous job." },
    ),
    naturalLanguage: query(
      {
        description:
          "Natural Language API: extract entities, facts, relations and sentiment from text. fields is comma separated (entities,facts,sentiment,...); lang is a language code such as en.",
        input: object({ content: string({ minLength: 1 }), fields: string().optional(), lang: string().optional() }),
      },
      async (_ctx, { content, fields, lang }) =>
        call(
          nl,
          "/v1/",
          { fields: fields ?? "entities,facts,sentiment" },
          { method: "POST", body: JSON.stringify([{ content, lang: lang ?? "auto", format: "plain text with title" }]) },
        ),
    ),
    webSearch: query(
      {
        description:
          "Search Diffbot's Web Index and return page results as LLM-ready text. size is 1-5 results; maxTokens caps the response length.",
        input: object({ text: string({ minLength: 1 }), size: number().optional(), maxTokens: number().optional() }),
      },
      async (_ctx, { text, size, maxTokens }) => call(llm, "/api/v1/web_search", { text, size, maxTokens }, { bearer: true }),
    ),
    account: query(
      { description: "Account plan, credits used and remaining, and API call history for the token.", input: object({}) },
      async () => call(api, "/v4/account"),
    ),
  });
}

export default defineApp(
  { user: { accounts: { diffbot: diffbot.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.diffbot ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Diffbot",
        description:
          "Extract structured data from any web page, crawl sites, search and enrich the Diffbot Knowledge Graph, and read account usage.",
        icons,
      },
    ),
  }),
);
