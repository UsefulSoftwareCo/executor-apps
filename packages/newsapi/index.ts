import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://newsapi.org/v2";

const newsapi = defineProvider({
  name: "NewsAPI",
  hosts: ["newsapi.org"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Read-only lookup of the (small) source list.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/top-headlines/sources?language=en&country=us`, {
      signal,
      headers: { "X-Api-Key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ status: string() }));
  },
});

type Account = { fields: { token: string } };

const get = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  path: string,
  params: Record<string, string | number | undefined>,
) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const qs = out.toString();
  const response = await fetch(`${base}/${path}${qs === "" ? "" : `?${qs}`}`, {
    signal,
    headers: { "X-Api-Key": account.fields.token, Accept: "application/json" },
  });
  return decodeJson(response, json());
};

const newsapiTools = (account: Account, signal: AbortSignal) =>
  router({
    searchArticles: query(
      {
        description:
          "Search all articles (GET /v2/everything). q is up to 500 chars and supports quoted phrases, +must, -exclude and AND/OR/NOT with parentheses. searchIn is a comma-separated subset of title, description, content. sources is up to 20 comma-separated source ids (from listSources); domains and excludeDomains are comma-separated domains. from and to are ISO 8601 dates or datetimes. language is a 2-letter code (ar, de, en, es, fr, he, it, nl, no, pt, ru, sv, ud, zh). sortBy is relevancy, popularity or publishedAt (default). pageSize defaults to 100 (max 100); page starts at 1. At least one of q, sources or domains is required. The free Developer plan limits history to about a month and 100 requests per day; article content is truncated to 200 chars.",
        input: object({
          q: string().optional(),
          searchIn: string().optional(),
          sources: string().optional(),
          domains: string().optional(),
          excludeDomains: string().optional(),
          from: string().optional(),
          to: string().optional(),
          language: string().optional(),
          sortBy: string().optional(),
          pageSize: number().optional(),
          page: number().optional(),
        }),
      },
      async ({ fetch }, i) =>
        get(fetch, account, signal, "everything", {
          q: i.q,
          searchIn: i.searchIn,
          sources: i.sources,
          domains: i.domains,
          excludeDomains: i.excludeDomains,
          from: i.from,
          to: i.to,
          language: i.language,
          sortBy: i.sortBy,
          pageSize: i.pageSize,
          page: i.page,
        }),
    ),
    getTopHeadlines: query(
      {
        description:
          "Get breaking news headlines (GET /v2/top-headlines), newest first. country is a 2-letter ISO 3166-1 code (for example us); category is business, entertainment, general, health, science, sports or technology. sources (comma-separated ids) cannot be combined with country or category. q filters by keywords. pageSize defaults to 20 (max 100); page starts at 1.",
        input: object({
          country: string().optional(),
          category: string().optional(),
          sources: string().optional(),
          q: string().optional(),
          pageSize: number().optional(),
          page: number().optional(),
        }),
      },
      async ({ fetch }, i) =>
        get(fetch, account, signal, "top-headlines", {
          country: i.country,
          category: i.category,
          sources: i.sources,
          q: i.q,
          pageSize: i.pageSize,
          page: i.page,
        }),
    ),
    listSources: query(
      {
        description:
          "List the news publishers available for top headlines (GET /v2/top-headlines/sources). Optional filters: category (business, entertainment, general, health, science, sports, technology), language (2-letter code) and country (2-letter code). Returns id, name, description, url, category, language and country; use ids in the sources parameter of the other tools.",
        input: object({
          category: string().optional(),
          language: string().optional(),
          country: string().optional(),
        }),
      },
      async ({ fetch }, i) =>
        get(fetch, account, signal, "top-headlines/sources", {
          category: i.category,
          language: i.language,
          country: i.country,
        }),
    ),
  });

export default defineApp(
  { user: { accounts: { newsapi: newsapi.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.newsapi ?? [], (account) => newsapiTools(account, signal), { signal }),
      {
        title: "NewsAPI",
        description: "Search news articles and breaking headlines from thousands of sources and blogs with NewsAPI.org.",
        icons,
      },
    ),
  }),
);
