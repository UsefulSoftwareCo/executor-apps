import {
  accountRouter,
  array,
  boolean,
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

const base = "https://api.finlight.me/v2";

const finlight = defineProvider({
  name: "Finlight",
  hosts: ["api.finlight.me"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing sources is read-only and takes no parameters.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/sources`, {
      signal,
      headers: { "X-API-KEY": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, array(object({ domain: string() })));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "X-API-KEY": account.fields.token, Accept: "application/json" });

const finlightTools = (account: Account, signal: AbortSignal) =>
  router({
    searchArticles: query(
      {
        description:
          "Search financial news articles (POST /v2/articles). query supports plain text and advanced syntax (ticker:AAPL, source:reuters.com, AND/OR/NOT, quoted phrases). Filters: sources (\"*\" allowed), optInSources (added to your defaults), excludeSources, tickers, countries (ISO 3166-1 alpha-2, article subject), categories (markets, economy, business, politics, geopolitics, regulation, technology, energy, commodities, crypto, health, climate, security), from/to (YYYY-MM-DD or ISO), language (ISO 639-1, default en), orderBy (publishDate, createdAt, revisedDate), order (ASC, DESC), pageSize 1-100, page. includeEntities adds mentioned companies on plans that allow it. Returns status, page, pageSize and articles with sentiment and confidence.",
        input: object({
          query: string().optional(),
          sources: array(string()).optional(),
          optInSources: array(string()).optional(),
          excludeSources: array(string()).optional(),
          tickers: array(string()).optional(),
          countries: array(string()).optional(),
          categories: array(string()).optional(),
          includeEntities: boolean().optional(),
          from: string().optional(),
          to: string().optional(),
          language: string().optional(),
          orderBy: string().optional(),
          order: string().optional(),
          pageSize: number().optional(),
          page: number().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/articles`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    getArticleByLink: query(
      {
        description:
          "Fetch one article by its URL (GET /v2/articles/by-link). includeEntities adds mentioned companies on plans that allow it; includeContent returns the full text (deprecated, only on plans with content access).",
        input: object({
          link: string({ minLength: 1 }),
          includeContent: boolean().optional(),
          includeEntities: boolean().optional(),
        }),
      },
      async ({ fetch }, input) => {
        const params = new URLSearchParams({ link: input.link });
        if (input.includeContent !== undefined) params.set("includeContent", String(input.includeContent));
        if (input.includeEntities !== undefined) params.set("includeEntities", String(input.includeEntities));
        return decodeJson(
          await fetch(`${base}/articles/by-link?${params.toString()}`, { signal, headers: headers(account) }),
          json(),
        );
      },
    ),
    listSources: query(
      {
        description:
          "List all supported news sources (GET /v2/sources) with domain, isDefaultSource, originCountry and languages. Use the domains in the sources, optInSources and excludeSources filters of searchArticles.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/sources`, { signal, headers: headers(account) }), json()),
    ),
  });

export default defineApp({ user: { accounts: { finlight: finlight.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.finlight ?? [], (account) => finlightTools(account, signal), { signal }), {
    title: "Finlight",
    description: "Search real-time financial news with sentiment, look up an article by link and list Finlight's news sources.",
    icons,
  }),
}));
