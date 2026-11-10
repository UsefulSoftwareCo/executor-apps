import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  array,
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

const base = "https://api.prerender.io";

const prerender = defineProvider({
  name: "Prerender",
  hosts: ["api.prerender.io"],
  auth: {
    // The Prerender token is under Security and Access > Prerender Token in the dashboard.
    // Prerender's REST API takes it as the `prerenderToken` JSON body field.
    token: secrets({
      label: "Prerender token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /search is the only read-only call; exact match on an empty URL returns no rows.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/search`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prerenderToken: account.fields.token, exactMatch: "https://invalid.invalid/", start: 0 }),
    });
    if (!response.ok) throw new Error(`Prerender rejected the token (HTTP ${response.status})`);
    try {
      await response.json();
    } catch {
      throw new Error("Prerender returned a non-JSON response to the health check");
    }
  },
});

type Fetch = typeof fetch;

function rest(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const post = async (path: string, body: Record<string, unknown>) => {
    const response = await fetcher(`${base}${path}`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prerenderToken: token, ...body }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Prerender ${path} failed (HTTP ${response.status}): ${text}`);
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { ok: true, response: text };
    }
  };
  const device = string().optional();
  return router({
    recache: mutation(
      {
        description:
          "Cache a URL for the first time or refresh a cached one. Pass url for a single page or urls (up to 1000) for a batch. adaptiveType: 'mobile' recaches the mobile version.",
        input: object({ url: string().optional(), urls: array(string()).optional(), adaptiveType: device }),
      },
      (_ctx, args) => {
        const hasUrl = args.url !== undefined;
        const hasUrls = args.urls !== undefined;
        if (hasUrl === hasUrls) throw new Error("Pass exactly one of url or urls");
        if (hasUrls && (args.urls!.length === 0 || args.urls!.length > 1000)) throw new Error("urls must contain 1 to 1000 URLs");
        return post("/recache", args);
      },
    ),
    search: query(
      {
        description:
          "Search the Prerender cache. query matches URLs containing the text; exactMatch matches a full URL and wins over query. start is the pagination offset (200 results per page). adaptiveType: 'mobile' or 'desktop'. Limited to 50 requests per minute.",
        input: object({
          query: string().optional(),
          exactMatch: string().optional(),
          start: number().optional(),
          adaptiveType: device,
        }),
      },
      (_ctx, args) => post("/search", args),
    ),
    sitemap: mutation(
      {
        description: "Add the URLs of a sitemap XML to the cache queue. Only adds new URLs; it does not recache existing ones.",
        input: object({ url: string({ minLength: 1 }) }),
      },
      (_ctx, args) => post("/sitemap", args),
    ),
    cacheClear: mutation(
      {
        description:
          "Queue a job that removes cached URLs matching a pattern. query uses % and ? wildcards, e.g. https://example.com% removes everything under that prefix. One job per account at a time; current plans only.",
        input: object({ query: string({ minLength: 1 }) }),
      },
      (_ctx, args) => post("/cache-clear", args),
    ),
    cacheClearStatus: query(
      { description: "Check whether a queued cache clear job is still in progress.", input: object({}) },
      async () => {
        const response = await fetcher(`${base}/cache-clear-status/${encodeURIComponent(token)}`, { signal });
        const text = await response.text();
        return { status: response.status, body: text };
      },
    ),
    changeRecacheSpeed: mutation(
      {
        description:
          "Set the recache queue speed in URLs per hour: 0 for automatic delay, otherwise 3600 to 36000. Higher speeds can overload your origin server.",
        input: object({ urlsPerHour: number() }),
      },
      (_ctx, args) => post("/change-recache-speed", args),
    ),
  });
}

export default defineApp(
  { user: { accounts: { prerender: prerender.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.prerender ?? [],
        (account) =>
          withApprovals(rest(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Prerender",
        description: "Prerender.io: recache URLs, search the cache, submit sitemaps, clear cached pages and tune the render queue speed.",
        icons,
      },
    ),
  }),
);
