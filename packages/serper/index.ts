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

const searchBase = "https://google.serper.dev";
const scrapeBase = "https://scrape.serper.dev";

const serper = defineProvider({
  name: "Serper",
  hosts: ["google.serper.dev", "scrape.serper.dev"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Serper has no free account endpoint. Assumed, not verified against a live key or the vendor docs
  // (serper.dev/api-reference was unreachable): an empty search body is rejected with 400 after the key is
  // checked, so 400 or any 2xx means the key was accepted. Every other status (401/403 bad key, 402 no
  // credits, 404, 429, 5xx) fails the check.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${searchBase}/search`, {
      method: "POST",
      signal,
      headers: { "X-API-KEY": account.fields.token, "Content-Type": "application/json" },
      body: "{}",
    });
    if (response.status === 400 || (response.status >= 200 && response.status < 300)) return;
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Serper rejected the API key (HTTP ${response.status})`);
    }
    throw new Error(`Serper health check failed (HTTP ${response.status})`);
  },
});

type Account = { fields: { token: string } };

const post =
  (account: Account, signal: AbortSignal, base: string, path: string) =>
  async ({ fetch }: { fetch: typeof globalThis.fetch }, input: Record<string, string | number | boolean | undefined>) => {
    const body = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
    return decodeJson(
      await fetch(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { "X-API-KEY": account.fields.token, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      json(),
    );
  };

const localize = {
  gl: string().optional(),
  hl: string().optional(),
  location: string().optional(),
};

const localizeNote =
  " gl is a lowercase two-letter country code (default us), hl a two-letter language code (default en), location a free-text place such as 'Austin, Texas, United States'.";
const creditNote = " Each call spends Serper credits (typically 1 for up to 10 results, 2 for 11-100).";

const serperTools = (account: Account, signal: AbortSignal) => {
  const google = (path: string) => post(account, signal, searchBase, path);
  const paged = { q: string(), ...localize, num: number().optional(), page: number().optional() };
  const vertical = (path: string, description: string, input: Parameters<typeof object>[0]) =>
    query({ description: description + localizeNote + creditNote, input: object(input) }, async (ctx, args) =>
      google(path)(ctx, args as Record<string, string | number | boolean | undefined>),
    );

  return router({
    search: vertical(
      "/search",
      "Search Google and return structured results: organic results, knowledge graph, answer box, people also ask and related searches. num is 1-100 results, page starts at 1, tbs is a time filter (qdr:h, qdr:d, qdr:w, qdr:m, qdr:y), autocorrect toggles query correction.",
      { ...paged, tbs: string().optional(), autocorrect: boolean().optional() },
    ),
    images: vertical("/images", "Search Google Images.", { ...paged, tbs: string().optional(), autocorrect: boolean().optional() }),
    news: vertical("/news", "Search Google News. tbs is a time filter (qdr:h, qdr:d, qdr:w, qdr:m, qdr:y).", {
      ...paged,
      tbs: string().optional(),
      autocorrect: boolean().optional(),
    }),
    videos: vertical("/videos", "Search Google Videos.", { ...paged, tbs: string().optional(), autocorrect: boolean().optional() }),
    places: vertical("/places", "Search Google Places for businesses and points of interest, with address, rating, phone and CID.", {
      ...paged,
      autocorrect: boolean().optional(),
    }),
    maps: vertical(
      "/maps",
      "Search Google Maps. ll centers the search as '@latitude,longitude,zoomz' (for example '@40.7504178,-73.9824837,14z').",
      { q: string(), ...localize, ll: string().optional(), page: number().optional() },
    ),
    reviews: vertical(
      "/reviews",
      "List Google reviews for one place, identified by fid, cid or placeId. sortBy is mostRelevant, newest, highestRating or lowestRating; topicId filters to a topic; pass nextPageToken from a previous response to continue.",
      {
        fid: string().optional(),
        cid: string().optional(),
        placeId: string().optional(),
        gl: string().optional(),
        hl: string().optional(),
        sortBy: string().optional(),
        topicId: string().optional(),
        nextPageToken: string().optional(),
      },
    ),
    shopping: vertical("/shopping", "Search Google Shopping for products with price, seller, rating and delivery.", paged),
    scholar: vertical("/scholar", "Search Google Scholar for papers with publication info, year and citation counts.", paged),
    patents: vertical("/patents", "Search Google Patents with dates, inventor, assignee and PDF links.", paged),
    autocomplete: vertical("/autocomplete", "Return Google autocomplete suggestions for a partial query.", { q: string(), ...localize }),
    scrape: query(
      {
        description:
          "Fetch a public webpage through Serper and return its text and metadata. Set includeMarkdown to also get the page as Markdown. Spends 2 credits per page, more for difficult pages.",
        input: object({ url: string(), includeMarkdown: boolean().optional() }),
      },
      async (ctx, input) => post(account, signal, scrapeBase, "")(ctx, input),
    ),
  });
};

export default defineApp({ user: { accounts: { serper: serper.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.serper ?? [], (account) => serperTools(account, signal), { signal }), {
    title: "Serper",
    description:
      "Real-time Google results as JSON: web, images, news, videos, places, maps, reviews, shopping, scholar, patents, autocomplete and webpage scraping.",
    icons,
  }),
}));
