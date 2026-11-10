import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  literal,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.webscraper.io/api/v1";

const webscraper = defineProvider({
  name: "Web Scraper",
  hosts: ["api.webscraper.io"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account?${new URLSearchParams({ api_token: account.fields.token })}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, object({ success: literal(true) }));
  },
});

type Account = { fields: { token: string } };

const headers = (_account: Account) => ({ Accept: "application/json" });

const jsonHeaders = (account: Account) => ({ ...headers(account), "content-type": "application/json" });

// The vendor's official client sends the token as the api_token query parameter on every request.
const search = (account: Account, params: Record<string, string | number | boolean | undefined> = {}) => {
  const out = new URLSearchParams({ api_token: account.fields.token });
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return `?${out.toString()}`;
};

// The vendor treats success:false as an error even on HTTP 200.
const envelope = async (response: Response) => {
  const body = await decodeJson(response, json());
  if (typeof body !== "object" || body === null || (body as { success?: unknown }).success !== true) {
    throw new Error(`Web Scraper returned an unsuccessful response: ${JSON.stringify(body)}`);
  }
  return body;
};

const downloadTool = (account: Account, signal: AbortSignal, format: "json" | "csv" | "xlsx") =>
  query(
    {
      description:
        format === "xlsx"
          ? "Download the scraped data of a finished scraping job as an XLSX file; returns the file as base64. Set raw to true to get the unprocessed (pre-normalization) data."
          : `Download the scraped data of a finished scraping job as ${format.toUpperCase()} text${format === "json" ? " (one JSON object per line)" : ""}. Set raw to true to get the unprocessed (pre-normalization) data.`,
      input: object({ scrapingJobId: number(), raw: boolean().optional() }),
    },
    async ({ fetch }, { scrapingJobId, raw }) => {
      const response = await fetch(
        `${base}/scraping-job/${scrapingJobId}/${format}${search(account, { raw: raw === true ? true : undefined })}`,
        { signal, headers: headers(account) },
      );
      if (!response.ok) throw new Error(`Web Scraper download failed with HTTP ${response.status}: ${await response.text()}`);
      if (format === "xlsx") {
        const bytes = new Uint8Array(await response.arrayBuffer());
        let binary = "";
        for (const byte of bytes) binary += String.fromCharCode(byte);
        return { format, base64: btoa(binary) };
      }
      return { format, data: await response.text() };
    },
  );

const tools = (account: Account, signal: AbortSignal) =>
  router({
    getAccount: query(
      {
        description: "Get the Web Scraper Cloud account: email, name, page credits left and plan limits.",
        input: object({}),
      },
      async ({ fetch }) => envelope(await fetch(`${base}/account${search(account)}`, { signal, headers: headers(account) })),
    ),
    listSitemaps: query(
      {
        description: "List the sitemaps (scraper definitions) in the account, 'page' starting at 1.",
        input: object({ page: number().optional() }),
      },
      async ({ fetch }, input) =>
        envelope(await fetch(`${base}/sitemaps${search(account, input)}`, { signal, headers: headers(account) })),
    ),
    getSitemap: query(
      {
        description: "Get one sitemap by id, including its start URLs and selectors.",
        input: object({ sitemapId: number() }),
      },
      async ({ fetch }, { sitemapId }) =>
        envelope(await fetch(`${base}/sitemap/${sitemapId}${search(account)}`, { signal, headers: headers(account) })),
    ),
    createSitemap: mutation(
      {
        description:
          "Create a sitemap. 'sitemap' is the Web Scraper sitemap JSON as exported from the extension: { _id, startUrl: [..], selectors: [..] }.",
        input: object({ sitemap: json() }),
        approval: always(),
      },
      async ({ fetch }, { sitemap }) =>
        envelope(
          await fetch(`${base}/sitemap${search(account)}`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify(sitemap),
          }),
        ),
    ),
    updateSitemap: mutation(
      {
        description: "Replace a sitemap's definition with the given sitemap JSON ({ _id, startUrl, selectors }).",
        input: object({ sitemapId: number(), sitemap: json() }),
        approval: always(),
      },
      async ({ fetch }, { sitemapId, sitemap }) =>
        envelope(
          await fetch(`${base}/sitemap/${sitemapId}${search(account)}`, {
            method: "PUT",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify(sitemap),
          }),
        ),
    ),
    deleteSitemap: mutation(
      {
        description: "Delete a sitemap permanently.",
        input: object({ sitemapId: number() }),
        approval: always(),
      },
      async ({ fetch }, { sitemapId }) =>
        envelope(
          await fetch(`${base}/sitemap/${sitemapId}${search(account)}`, { method: "DELETE", signal, headers: headers(account) }),
        ),
    ),
    getSitemapScheduler: query(
      {
        description: "Get a sitemap's scheduler configuration.",
        input: object({ sitemapId: number() }),
      },
      async ({ fetch }, { sitemapId }) =>
        envelope(await fetch(`${base}/sitemap/${sitemapId}/scheduler${search(account)}`, { signal, headers: headers(account) })),
    ),
    enableSitemapScheduler: mutation(
      {
        description:
          "Enable (or reconfigure) a sitemap's recurring scraping scheduler. 'config' holds the scheduler settings, as documented by Web Scraper Cloud (passed through unvalidated).",
        input: object({ sitemapId: number(), config: json() }),
        approval: always(),
      },
      async ({ fetch }, { sitemapId, config }) =>
        envelope(
          await fetch(`${base}/sitemap/${sitemapId}/enable-scheduler${search(account)}`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify(config),
          }),
        ),
    ),
    disableSitemapScheduler: mutation(
      {
        description: "Disable a sitemap's recurring scraping scheduler.",
        input: object({ sitemapId: number() }),
        approval: always(),
      },
      async ({ fetch }, { sitemapId }) =>
        envelope(
          await fetch(`${base}/sitemap/${sitemapId}/disable-scheduler${search(account)}`, {
            method: "POST",
            signal,
            headers: headers(account),
          }),
        ),
    ),
    listScrapingJobs: query(
      {
        description: "List scraping jobs, optionally only those of one sitemap. 'page' starts at 1.",
        input: object({ sitemapId: number().optional(), page: number().optional() }),
      },
      async ({ fetch }, { sitemapId, page }) =>
        envelope(
          await fetch(`${base}/scraping-jobs${search(account, { sitemap_id: sitemapId, page })}`, { signal, headers: headers(account) }),
        ),
    ),
    getScrapingJob: query(
      {
        description: "Get one scraping job: status, scraped and stored record counts, timings and configuration.",
        input: object({ scrapingJobId: number() }),
      },
      async ({ fetch }, { scrapingJobId }) =>
        envelope(await fetch(`${base}/scraping-job/${scrapingJobId}${search(account)}`, { signal, headers: headers(account) })),
    ),
    createScrapingJob: mutation(
      {
        description:
          "Start a scraping job for a sitemap. Consumes page credits. start_urls overrides the sitemap's start URLs; custom_id is echoed back on the job. Further job settings are passed through 'options' as free-form JSON per the Web Scraper Cloud docs.",
        input: object({
          sitemap_id: number(),
          start_urls: array(string()).optional(),
          custom_id: string().optional(),
          options: json().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { options, ...input }) =>
        envelope(
          await fetch(`${base}/scraping-job${search(account)}`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({ ...(typeof options === "object" && options !== null ? options : {}), ...input }),
          }),
        ),
    ),
    deleteScrapingJob: mutation(
      {
        description: "Delete a scraping job and its stored data.",
        input: object({ scrapingJobId: number() }),
        approval: always(),
      },
      async ({ fetch }, { scrapingJobId }) =>
        envelope(
          await fetch(`${base}/scraping-job/${scrapingJobId}${search(account)}`, { method: "DELETE", signal, headers: headers(account) }),
        ),
    ),
    getScrapingJobDataQuality: query(
      {
        description: "Get data-quality results for a scraping job (empty-value and duplicate checks per selector).",
        input: object({ scrapingJobId: number() }),
      },
      async ({ fetch }, { scrapingJobId }) =>
        envelope(
          await fetch(`${base}/scraping-job/${scrapingJobId}/data-quality${search(account)}`, { signal, headers: headers(account) }),
        ),
    ),
    listProblematicUrls: query(
      {
        description: "List URLs a scraping job failed to load or that returned empty or no data. 'page' starts at 1.",
        input: object({ scrapingJobId: number(), page: number().optional() }),
      },
      async ({ fetch }, { scrapingJobId, page }) =>
        envelope(
          await fetch(`${base}/scraping-job/${scrapingJobId}/problematic-urls${search(account, { page })}`, {
            signal,
            headers: headers(account),
          }),
        ),
    ),
    downloadJson: downloadTool(account, signal, "json"),
    downloadCsv: downloadTool(account, signal, "csv"),
    downloadXlsx: downloadTool(account, signal, "xlsx"),
  });

export default defineApp({ user: { accounts: { webscraper: webscraper.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.webscraper ?? [], (account) => tools(account, signal), { signal }), {
    title: "Web Scraper",
    description:
      "Manage Web Scraper Cloud: sitemaps, schedulers, scraping jobs, data quality, and download scraped data as JSON, CSV or XLSX.",
    icons,
  }),
}));
