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

const base = "https://api.pexels.com/v1";

const pexels = defineProvider({
  name: "Pexels",
  hosts: ["api.pexels.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // One curated photo is the cheapest read-only call; it counts against the hourly quota.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/curated?per_page=1`, {
      signal,
      headers: { Authorization: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const paging = {
  page: number().optional(),
  perPage: number().optional(),
};

const pexelsTools = (account: Account, signal: AbortSignal) => {
  // Pexels takes the raw key in Authorization, with no Bearer prefix.
  const get = (fetch: typeof globalThis.fetch, path: string, params: Record<string, string | number | undefined> = {}) =>
    fetch(`${base}${path}?${search(params)}`, { signal, headers: { Authorization: account.fields.token } }).then(
      (response) => decodeJson(response, json()),
    );
  const page = ({ page, perPage }: { page?: number; perPage?: number }) => ({ page, per_page: perPage });

  return router({
    photos: router(
      {
        search: query(
          {
            description:
              "Search Pexels photos by keyword. orientation: landscape, portrait or square. size: large (24MP), medium (12MP) or small (4MP). color: a named color or hex code without #. locale: e.g. en-US. perPage is 1-80 (default 15). Credit the photographer and link to Pexels when showing results.",
            input: object({
              query: string(),
              orientation: string().optional(),
              size: string().optional(),
              color: string().optional(),
              locale: string().optional(),
              ...paging,
            }),
          },
          async ({ fetch }, { query, orientation, size, color, locale, ...p }) =>
            get(fetch, "/search", { query, orientation, size, color, locale, ...page(p) }),
        ),
        curated: query(
          {
            description: "List photos curated by the Pexels team, refreshed hourly. perPage is 1-80 (default 15).",
            input: object({ ...paging }),
          },
          async ({ fetch }, input) => get(fetch, "/curated", page(input)),
        ),
        get: query(
          {
            description: "Get one photo by id: dimensions, photographer, average color, alt text and download URLs for each size.",
            input: object({ id: number() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/photos/${id}`),
        ),
      },
      { title: "Photos", description: "Search and fetch Pexels photos." },
    ),
    videos: router(
      {
        search: query(
          {
            description:
              "Search Pexels videos by keyword. orientation: landscape, portrait or square. size: large (4K), medium (Full HD) or small (HD). locale: e.g. en-US. perPage is 1-80 (default 15).",
            input: object({
              query: string(),
              orientation: string().optional(),
              size: string().optional(),
              locale: string().optional(),
              ...paging,
            }),
          },
          async ({ fetch }, { query, orientation, size, locale, ...p }) =>
            get(fetch, "/videos/search", { query, orientation, size, locale, ...page(p) }),
        ),
        popular: query(
          {
            description:
              "List popular Pexels videos, optionally filtered by minimum width/height (pixels) and duration range (seconds).",
            input: object({
              minWidth: number().optional(),
              minHeight: number().optional(),
              minDuration: number().optional(),
              maxDuration: number().optional(),
              ...paging,
            }),
          },
          async ({ fetch }, { minWidth, minHeight, minDuration, maxDuration, ...p }) =>
            get(fetch, "/videos/popular", {
              min_width: minWidth,
              min_height: minHeight,
              min_duration: minDuration,
              max_duration: maxDuration,
              ...page(p),
            }),
        ),
        get: query(
          {
            description: "Get one video by id: duration, creator, preview pictures and downloadable files by quality.",
            input: object({ id: number() }),
          },
          async ({ fetch }, { id }) => get(fetch, `/videos/videos/${id}`),
        ),
      },
      { title: "Videos", description: "Search and fetch Pexels videos." },
    ),
    collections: router(
      {
        featured: query(
          {
            description: "List Pexels featured collections.",
            input: object({ ...paging }),
          },
          async ({ fetch }, input) => get(fetch, "/collections/featured", page(input)),
        ),
        mine: query(
          {
            description: "List the collections owned by the account that owns the API key.",
            input: object({ ...paging }),
          },
          async ({ fetch }, input) => get(fetch, "/collections", page(input)),
        ),
        media: query(
          {
            description:
              "List the photos and videos in a collection (id is a string such as 8xntnhb). type: photos or videos to filter, otherwise both. sort: asc or desc by add time.",
            input: object({ id: string(), type: string().optional(), sort: string().optional(), ...paging }),
          },
          async ({ fetch }, { id, type, sort, ...p }) =>
            get(fetch, `/collections/${encodeURIComponent(id)}`, { type, sort, ...page(p) }),
        ),
      },
      { title: "Collections", description: "Featured collections and the key owner's own collections (read-only)." },
    ),
  });
};

export default defineApp({ user: { accounts: { pexels: pexels.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.pexels ?? [], (account) => pexelsTools(account, signal), { signal }), {
    title: "Pexels",
    description: "Free stock photos, videos and collections from Pexels.",
    icons,
  }),
}));
