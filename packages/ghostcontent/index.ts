import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

// Every Ghost site serves its Content API from its own domain (a *.ghost.io address or a custom domain).
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Ghost site domain, for example mysite.ghost.io.");
  }
  if (url.protocol !== "https:") throw new Error("The Ghost site must be reached over https.");
  if (url.pathname.replace(/\/+$/, "") !== "" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the Ghost site domain, with no path.");
  return url.origin;
}

const ghost = defineProvider({
  name: "Ghost (Content API)",
  auth: {
    apiKey: secrets({
      label: "Content API key",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.domain);
    const url = new URL(`${origin}/ghost/api/content/settings/`);
    url.searchParams.set("key", account.fields.token);
    const response = await fetch(url.toString(), { signal, headers: { Accept: "application/json" } });
    const body = await decodeJson(response, object({ settings: object({ title: string() }) }));
    return { accountInfo: { externalId: new URL(origin).hostname, displayName: body.settings.title } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | undefined>;

function client(origin: string, key: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(`${origin}/ghost/api/content${path}`);
    for (const [name, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(name, String(value));
    }
    url.searchParams.set("key", key);
    const response = await fetcher(url.toString(), { signal, headers: { Accept: "application/json" } });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;
const seg = encodeURIComponent;

const browseInput = object({
  limit: number().optional(),
  page: number().optional(),
  filter: string().optional(),
  order: string().optional(),
  include: string().optional(),
  fields: string().optional(),
});
const readOptions = object({ include: string().optional(), fields: string().optional() });

const browseDoc =
  "Optional: limit (default 15), page, filter (NQL, for example tag:news+featured:true), order (for example published_at desc), include, fields.";

function build(call: Call) {
  const browse = (path: string, description: string) =>
    query({ description: `${description} ${browseDoc}`, input: browseInput }, (_c, input) => call(path, input));
  const byId = (base: string, description: string) =>
    query(
      { description, input: object({ id: string({ minLength: 1 }), include: string().optional(), fields: string().optional() }) },
      (_c, { id, ...rest }) => call(`${base}/${seg(id)}/`, rest),
    );
  const bySlug = (base: string, description: string) =>
    query(
      { description, input: object({ slug: string({ minLength: 1 }), include: string().optional(), fields: string().optional() }) },
      (_c, { slug, ...rest }) => call(`${base}/slug/${seg(slug)}/`, rest),
    );

  return router({
    posts: router(
      {
        browse: browse("/posts/", "List published posts. include accepts authors and tags; formats accepts html, plaintext."),
        read: byId("/posts", "Get a published post by id."),
        readBySlug: bySlug("/posts", "Get a published post by slug."),
      },
      { title: "Posts", description: "Published posts." },
    ),
    pages: router(
      {
        browse: browse("/pages/", "List published pages."),
        read: byId("/pages", "Get a published page by id."),
        readBySlug: bySlug("/pages", "Get a published page by slug."),
      },
      { title: "Pages", description: "Published static pages." },
    ),
    authors: router(
      {
        browse: browse("/authors/", "List authors with published posts. include=count.posts adds post counts."),
        read: byId("/authors", "Get an author by id."),
        readBySlug: bySlug("/authors", "Get an author by slug."),
      },
      { title: "Authors", description: "Authors of published content." },
    ),
    tags: router(
      {
        browse: browse("/tags/", "List tags. include=count.posts adds post counts."),
        read: byId("/tags", "Get a tag by id."),
        readBySlug: bySlug("/tags", "Get a tag by slug."),
      },
      { title: "Tags", description: "Tags used on published content." },
    ),
    tiers: router(
      {
        browse: browse("/tiers/", "List membership tiers. include accepts monthly_price, yearly_price, benefits."),
      },
      { title: "Tiers", description: "Membership tiers." },
    ),
    settings: query({ description: "Get the site's public settings (title, description, logo, navigation, timezone).", input: object({}) }, () =>
      call("/settings/"),
    ),
  });
}

export default defineApp(
  { user: { accounts: { ghost: ghost.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ghost ?? [],
        (account) => build(client(originOf(account.fields.domain), account.fields.token, fetch, signal)),
        { signal },
      ),
      {
        title: "Ghost (Content API)",
        description: "Read a Ghost site's published posts, pages, authors, tags, tiers and settings.",
        icons,
      },
    ),
  }),
);
