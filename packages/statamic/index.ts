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

// Every Statamic site is self-hosted on its own domain.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Statamic site domain, for example mysite.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Statamic site must be reached over https.");
  if (url.pathname.replace(/\/+$/, "") !== "" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the Statamic site domain, with no path.");
  return url.origin;
}

const statamic = defineProvider({
  name: "Statamic",
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.domain);
    const response = await fetch(`${origin}/api/ping`, {
      signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ ping: string() }));
    return { accountInfo: { externalId: new URL(origin).hostname, displayName: new URL(origin).hostname } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | undefined>;

function client(origin: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(`${origin}/api${path}`);
    for (const [name, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(name, String(value));
    }
    const response = await fetcher(url.toString(), {
      signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;
const seg = encodeURIComponent;

// filter[field:condition]=value is passed through as a ready-made query string fragment.
const listInput = object({
  limit: number().optional(),
  page: number().optional(),
  sort: string().optional(),
  fields: string().optional(),
  site: string().optional(),
  filter: string().optional(),
});
const listDoc =
  "Optional: limit (default 25), page, sort (field, prefix - to reverse, comma-separated), fields (comma-separated), site, filter (a query fragment such as title:contains=hello, where the left side is field:condition; needs allowed_filters enabled on the site).";

function withFilter(input: { filter?: string | undefined } & Params): Params {
  const { filter, ...rest } = input;
  if (!filter) return rest;
  const eq = filter.indexOf("=");
  if (eq < 0) return { ...rest, ["filter[" + filter + "]"]: "" };
  return { ...rest, ["filter[" + filter.slice(0, eq) + "]"]: filter.slice(eq + 1) };
}

function build(call: Call) {

  const req = (_s: string) => string({ minLength: 1 });
  const page = object({ limit: number().optional(), page: number().optional(), sort: string().optional(), fields: string().optional(), site: string().optional(), filter: string().optional() });
  const none = object({});
  const siteOnly = object({ site: string().optional() });

  return router({
    ping: query({ description: "Check that the REST API is enabled and reachable.", input: none }, () => call("/ping")),
    sites: query({ description: "List the sites configured in the Statamic install.", input: none }, () => call("/sites")),
    collections: router(
      {
        list: query({ description: "List collections.", input: page }, (_c, i) => call("/collections", withFilter(i))),
        get: query({ description: "Get a collection by handle.", input: object({ collection: req("Collection handle") }) }, (_c, { collection }) =>
          call(`/collections/${seg(collection)}`),
        ),
        entries: query(
          { description: `List entries in a collection. ${listDoc}`, input: object({ collection: req("Collection handle"), limit: number().optional(), page: number().optional(), sort: string().optional(), fields: string().optional(), site: string().optional(), filter: string().optional() }) },
          (_c, { collection, ...rest }) => call(`/collections/${seg(collection)}/entries`, withFilter(rest)),
        ),
        entry: query(
          { description: "Get an entry by id or slug.", input: object({ collection: req("Collection handle"), entry: req("Entry id or slug"), fields: string().optional(), site: string().optional() }) },
          (_c, { collection, entry, ...rest }) => call(`/collections/${seg(collection)}/entries/${seg(entry)}`, rest),
        ),
        tree: query(
          { description: "Get a structured collection's page tree. Optional: fields, max_depth, site.", input: object({ collection: req("Collection handle"), fields: string().optional(), max_depth: number().optional(), site: string().optional() }) },
          (_c, { collection, ...rest }) => call(`/collections/${seg(collection)}/tree`, rest),
        ),
      },
      { title: "Collections", description: "Collections and their entries." },
    ),
    navs: router(
      {
        list: query({ description: "List navigations.", input: none }, () => call("/navs")),
        get: query({ description: "Get a navigation by handle.", input: object({ nav: req("Navigation handle") }) }, (_c, { nav }) => call(`/navs/${seg(nav)}`)),
        tree: query(
          { description: "Get a navigation's tree. Optional: fields, max_depth, site.", input: object({ nav: req("Navigation handle"), fields: string().optional(), max_depth: number().optional(), site: string().optional() }) },
          (_c, { nav, ...rest }) => call(`/navs/${seg(nav)}/tree`, rest),
        ),
      },
      { title: "Navigation", description: "Navigations and their trees." },
    ),
    taxonomies: router(
      {
        list: query({ description: "List taxonomies.", input: none }, () => call("/taxonomies")),
        get: query({ description: "Get a taxonomy by handle.", input: object({ taxonomy: req("Taxonomy handle") }) }, (_c, { taxonomy }) =>
          call(`/taxonomies/${seg(taxonomy)}`),
        ),
        terms: query(
          { description: `List terms in a taxonomy. ${listDoc}`, input: object({ taxonomy: req("Taxonomy handle"), limit: number().optional(), page: number().optional(), sort: string().optional(), fields: string().optional(), site: string().optional(), filter: string().optional() }) },
          (_c, { taxonomy, ...rest }) => call(`/taxonomies/${seg(taxonomy)}/terms`, withFilter(rest)),
        ),
        term: query(
          { description: "Get a taxonomy term by slug.", input: object({ taxonomy: req("Taxonomy handle"), slug: req("Term slug") }) },
          (_c, { taxonomy, slug }) => call(`/taxonomies/${seg(taxonomy)}/terms/${seg(slug)}`),
        ),
      },
      { title: "Taxonomies", description: "Taxonomies and their terms." },
    ),
    assets: router(
      {
        containers: query({ description: "List asset containers.", input: none }, () => call("/asset-containers")),
        container: query({ description: "Get an asset container by handle.", input: object({ container: req("Container handle") }) }, (_c, { container }) =>
          call(`/asset-containers/${seg(container)}`),
        ),
        list: query(
          { description: `List assets in a container. ${listDoc}`, input: object({ container: req("Container handle"), limit: number().optional(), page: number().optional(), sort: string().optional(), fields: string().optional(), filter: string().optional() }) },
          (_c, { container, ...rest }) => call(`/assets/${seg(container)}`, withFilter(rest)),
        ),
        get: query(
          { description: "Get an asset by its path relative to the container root.", input: object({ container: req("Container handle"), path: req("Asset path, for example photos/cat.jpg"), fields: string().optional() }) },
          (_c, { container, path, ...rest }) => call(`/assets/${seg(container)}/${path.split("/").map(seg).join("/")}`, rest),
        ),
      },
      { title: "Assets", description: "Asset containers and files." },
    ),
    globals: router(
      {
        list: query({ description: "List global sets.", input: siteOnly }, (_c, i) => call("/globals", i)),
        get: query({ description: "Get a global set by handle.", input: object({ handle: req("Global set handle"), site: string().optional() }) }, (_c, { handle, ...rest }) =>
          call(`/globals/${seg(handle)}`, rest),
        ),
      },
      { title: "Globals", description: "Global sets." },
    ),
    forms: router(
      {
        list: query({ description: "List forms.", input: none }, () => call("/forms")),
        get: query({ description: "Get a form by handle.", input: object({ handle: req("Form handle") }) }, (_c, { handle }) => call(`/forms/${seg(handle)}`)),
      },
      { title: "Forms", description: "Form definitions." },
    ),
    users: router(
      {
        list: query({ description: `List users. ${listDoc}`, input: page }, (_c, i) => call("/users", withFilter(i))),
        get: query({ description: "Get a user by id.", input: object({ id: req("User id") }) }, (_c, { id }) => call(`/users/${seg(id)}`)),
      },
      { title: "Users", description: "Users." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { statamic: statamic.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.statamic ?? [],
        (account) => build(client(originOf(account.fields.domain), account.fields.token, fetch, signal)),
        { signal },
      ),
      {
        title: "Statamic",
        description: "Read a Statamic site's collections, entries, taxonomies, navigation, globals, assets, forms and users.",
        icons,
      },
    ),
  }),
);
