import {
  accountRouter,
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

const base = "https://api.worldnewsapi.com";

const worldnewsapi = defineProvider({
  name: "World News API",
  hosts: ["api.worldnewsapi.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Read-only lookup, run only when an account is connected. The vendor does not publish its quota cost.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/search-news-sources?name=bbc`, {
      signal,
      headers: { "x-api-key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ available: number() }));
  },
});

type Account = { fields: { token: string } };

const get = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  path: string,
  params: Record<string, string | number | boolean | undefined>,
) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const qs = out.toString();
  return fetch(`${base}/${path}${qs === "" ? "" : `?${qs}`}`, {
    signal,
    headers: { "x-api-key": account.fields.token, Accept: "application/json" },
  });
};

const worldnewsapiTools = (account: Account, signal: AbortSignal) =>
  router({
    searchNews: query(
      {
        description:
          "Search news articles. text supports AND, OR, -negation, parentheses and quoted phrases (3-100 chars). Dates are YYYY-MM-DD or YYYY-MM-DD HH:MM:SS. newsSources is up to 10 comma-separated domains; categories and authors are comma-separated; entities looks like ORG:Tesla,PER:Elon Musk; locationFilter is latitude,longitude,radius-km (1-100). sort is usually publish-time with sortDirection ASC or DESC. number is 1-100, offset up to 100000. At least one filter is required. Costs quota points per call.",
        input: object({
          text: string().optional(),
          textMatchIndexes: string().optional(),
          sourceCountry: string().optional(),
          language: string().optional(),
          minSentiment: number().optional(),
          maxSentiment: number().optional(),
          earliestPublishDate: string().optional(),
          latestPublishDate: string().optional(),
          newsSources: string().optional(),
          authors: string().optional(),
          categories: string().optional(),
          entities: string().optional(),
          locationFilter: string().optional(),
          sort: string().optional(),
          sortDirection: string().optional(),
          offset: number().optional(),
          number: number().optional(),
        }),
      },
      async ({ fetch }, i) =>
        decodeJson(
          await get(fetch, account, signal, "search-news", {
            text: i.text,
            "text-match-indexes": i.textMatchIndexes,
            "source-country": i.sourceCountry,
            language: i.language,
            "min-sentiment": i.minSentiment,
            "max-sentiment": i.maxSentiment,
            "earliest-publish-date": i.earliestPublishDate,
            "latest-publish-date": i.latestPublishDate,
            "news-sources": i.newsSources,
            authors: i.authors,
            categories: i.categories,
            entities: i.entities,
            "location-filter": i.locationFilter,
            sort: i.sort,
            "sort-direction": i.sortDirection,
            offset: i.offset,
            number: i.number,
          }),
          json(),
        ),
    ),
    topNews: query(
      {
        description:
          "Get the top news story clusters for a country and language on a day. sourceCountry is a 2-letter ISO 3166 code, language a 2-letter ISO 639-1 code, date is YYYY-MM-DD (default today). headlinesOnly returns just id, title and url. maxNewsPerCluster is 1-100 (default 1).",
        input: object({
          sourceCountry: string(),
          language: string(),
          date: string().optional(),
          headlinesOnly: boolean().optional(),
          maxNewsPerCluster: number().optional(),
        }),
      },
      async ({ fetch }, i) =>
        decodeJson(
          await get(fetch, account, signal, "top-news", {
            "source-country": i.sourceCountry,
            language: i.language,
            date: i.date,
            "headlines-only": i.headlinesOnly,
            "max-news-per-cluster": i.maxNewsPerCluster,
          }),
          json(),
        ),
    ),
    retrieveNews: query(
      {
        description:
          "Retrieve full details of articles by id, using ids from searchNews or topNews. ids is comma-separated.",
        input: object({ ids: string() }),
      },
      async ({ fetch }, i) => decodeJson(await get(fetch, account, signal, "retrieve-news", { ids: i.ids }), json()),
    ),
    extractNews: query(
      {
        description:
          "Extract structured data (title, text, images, authors, publish date, language) from a news article URL. Set analyze to also extract named entities and sentiment.",
        input: object({ url: string(), analyze: boolean().optional() }),
      },
      async ({ fetch }, i) =>
        decodeJson(await get(fetch, account, signal, "extract-news", { url: i.url, analyze: i.analyze }), json()),
    ),
    extractNewsLinks: query(
      {
        description:
          "Extract the links to news articles from a webpage or site. prefix restricts links to those starting with it (max 100 chars); subDomain (default true) includes sub-domains; analyze analyzes the links.",
        input: object({
          url: string(),
          analyze: boolean().optional(),
          prefix: string().optional(),
          subDomain: boolean().optional(),
        }),
      },
      async ({ fetch }, i) =>
        decodeJson(
          await get(fetch, account, signal, "extract-news-links", {
            url: i.url,
            analyze: i.analyze,
            prefix: i.prefix,
            "sub-domain": i.subDomain,
          }),
          json(),
        ),
    ),
    searchNewsSources: query(
      {
        description: "Search news sources by (partial) name, for example bbc or reuters (min 3 chars). Returns names, URLs, languages and countries.",
        input: object({ name: string() }),
      },
      async ({ fetch }, i) =>
        decodeJson(await get(fetch, account, signal, "search-news-sources", { name: i.name }), json()),
    ),
    getGeoCoordinates: query(
      {
        description:
          "Geocode a location name or address (for example Paris, France) to latitude and longitude, for use in searchNews locationFilter.",
        input: object({ location: string() }),
      },
      async ({ fetch }, i) =>
        decodeJson(await get(fetch, account, signal, "geo-coordinates", { location: i.location }), json()),
    ),
    retrieveFrontPage: query(
      {
        description:
          "Retrieve a newspaper front page image. All parameters are optional; with none, a random front page is returned. sourceCountry is a country code such as us, date is YYYY-MM-DD (past editions are available), sourceName is the newspaper name. Returns front_page with name, date, language, country and image URL.",
        input: object({
          sourceCountry: string().optional(),
          date: string().optional(),
          sourceName: string().optional(),
        }),
      },
      async ({ fetch }, i) =>
        decodeJson(
          await get(fetch, account, signal, "retrieve-front-page", {
            "source-country": i.sourceCountry,
            date: i.date,
            "source-name": i.sourceName,
          }),
          json(),
        ),
    ),
    websiteToRssFeed: query(
      {
        description:
          "Turn a news website or blog page into an RSS 2.0 feed. Returns the feed XML as rss. extractNews also extracts each article (costs extra quota).",
        input: object({ url: string(), extractNews: boolean().optional() }),
      },
      async ({ fetch }, i) => {
        const response = await get(fetch, account, signal, "feed.rss", { url: i.url, "extract-news": i.extractNews });
        if (!response.ok) throw new Error(`World News API responded ${response.status}: ${await response.text()}`);
        return { rss: await response.text() };
      },
    ),
  });

export default defineApp({ user: { accounts: { worldnewsapi: worldnewsapi.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.worldnewsapi ?? [], (account) => worldnewsapiTools(account, signal), { signal }), {
    title: "World News API",
    description: "Search news from thousands of sources worldwide, get top news, extract articles and links, find sources and geocode locations.",
    icons,
  }),
}));
