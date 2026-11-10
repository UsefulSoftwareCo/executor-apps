import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Decision: no `hosts`. A Ghost site lives on an arbitrary domain (*.ghost.io, a custom domain, or
// self-hosted, possibly under a sub-path), and the framework only accepts static host lists. The
// key therefore reaches app code raw; it is only ever used to sign a short-lived JWT, and requests
// are built from the account's own instance origin, so nothing leaves that origin.
function adminBase(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Ghost Admin API URL, for example https://mysite.ghost.io.");
  }
  if (url.protocol !== "https:") throw new Error("The Ghost site must use https.");
  if (url.search !== "" || url.hash !== "") throw new Error("The Ghost URL must not include a query or fragment.");
  const path = url.pathname.replace(/\/+$/, "").replace(/\/ghost(\/api(\/admin)?)?$/, "");
  return `${url.origin}${path}/ghost/api/admin`;
}

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// Admin API key: "{id}:{hex secret}". The JWT is HS256 over the decoded secret, valid for 5 minutes.
async function token(key: string): Promise<string> {
  const [id, secret] = key.trim().split(":");
  if (!id || !secret || !/^([0-9a-fA-F]{2})+$/.test(secret))
    throw new Error("The Admin API key must look like {id}:{secret}, as shown under Settings > Integrations.");
  const raw = new Uint8Array(secret.match(/../g)!.map((byte) => parseInt(byte, 16)));
  const encode = (value: unknown) => b64url(new TextEncoder().encode(JSON.stringify(value)));
  const iat = Math.floor(Date.now() / 1000);
  const input = `${encode({ alg: "HS256", kid: id, typ: "JWT" })}.${encode({ iat, exp: iat + 300, aud: "/admin/" })}`;
  const hmac = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", hmac, new TextEncoder().encode(input)));
  return `${input}.${b64url(signature)}`;
}

const ghost = defineProvider({
  name: "Ghost",
  auth: {
    adminKey: secrets({
      label: "Admin API key",
      fields: object({
        site: plain(string({ minLength: 1 })),
        key: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = adminBase(account.fields.site);
    const response = await fetch(`${base}/site/`, {
      signal,
      headers: { Accept: "application/json" },
    });
    const { site } = await decodeJson(response, object({ site: object({ title: string(), url: string() }) }));
    // /site/ is public; confirm the key signs a valid token by reading an authenticated endpoint.
    const authed = await fetch(`${base}/users/?limit=1`, {
      signal,
      headers: { Accept: "application/json", Authorization: `Ghost ${await token(account.fields.key)}` },
    });
    await decodeJson(authed, object({}));
    return { accountInfo: { externalId: new URL(site.url).hostname, displayName: site.title } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(base: string, key: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    if (path.includes("?") || path.includes("#")) throw new Error("path must not contain ? or #; use the query field");
    const url = new URL(`${base}${path}`);
    const origin = new URL(base).origin;
    if (url.origin !== origin || !url.pathname.startsWith(`${new URL(base).pathname}/`))
      throw new Error("path must stay under the Ghost Admin API of the account site");
    for (const [name, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(name, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Ghost ${await token(key)}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const id = () => string({ minLength: 1 });
const Query = record(string());

const browseInput = object({
  filter: string().optional(),
  limit: number().optional(),
  page: number().optional(),
  order: string().optional(),
  include: string().optional(),
  fields: string().optional(),
  query: Query.optional(),
});
const browseDoc =
  "filter is a NQL expression such as status:published+tag:news, limit defaults to 15 (use 'all' via query for everything), include is a comma list of relations, order is like published_at desc.";
const readInput = object({ id: id(), include: string().optional(), fields: string().optional(), query: Query.optional() });

function build(call: Call) {
  const browse = (path: string, description: string) =>
    query({ description: `${description} ${browseDoc}`, input: browseInput }, (_c, { query: q, ...p }) =>
      call("GET", path, { ...p, ...(q ?? {}) }),
    );
  const read = (path: (i: string) => string, description: string) =>
    query({ description, input: readInput }, (_c, { id: i, query: q, ...p }) => call("GET", path(i), { ...p, ...(q ?? {}) }));
  const readBy = (path: (v: string) => string, label: string, description: string) =>
    query(
      { description, input: object({ [label]: id(), include: string().optional(), fields: string().optional() }) },
      (_c, input) => {
        const { include, fields } = input as { include?: string; fields?: string };
        return call("GET", path((input as Record<string, string>)[label]!), { include, fields });
      },
    );
  const add = (path: string, wrapper: string, description: string) =>
    mutation(
      {
        description: `${description} Body is wrapped as {"${wrapper}": [{...}]}. Optional query params (for example source=html on posts and pages) go in query.`,
        input: object({ body: json(), query: Query.optional() }),
      },
      (_c, { body, query: q }) => call("POST", path, q ?? {}, body),
    );
  const edit = (path: (i: string) => string, wrapper: string, description: string) =>
    mutation(
      {
        description: `${description} Body is wrapped as {"${wrapper}": [{...}]}. ${
          wrapper === "posts" || wrapper === "pages" ? "The object must include the current updated_at to avoid edit collisions. " : ""
        }Optional query params go in query.`,
        input: object({ id: id(), body: json(), query: Query.optional() }),
      },
      (_c, { id: i, body, query: q }) => call("PUT", path(i), q ?? {}, body),
    );
  const remove = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("DELETE", path(i)));
  const copy = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("POST", path(i)));

  const posts = router(
    {
      browse: browse("/posts/", "List posts (include=tags,authors; formats=html,lexical,mobiledoc via query)."),
      get: read((i) => `/posts/${seg(i)}/`, "Get a post by id."),
      getBySlug: readBy((s) => `/posts/slug/${seg(s)}/`, "slug", "Get a post by slug."),
      create: add("/posts/", "posts", "Create a post. Add source=html in query to send HTML instead of Lexical."),
      update: edit((i) => `/posts/${seg(i)}/`, "posts", "Update a post, including publishing (status: published) or scheduling."),
      copy: copy((i) => `/posts/${seg(i)}/copy/`, "Duplicate a post as a new draft."),
      delete: remove((i) => `/posts/${seg(i)}/`, "Delete a post."),
    },
    { title: "Posts", description: "Posts, drafts and scheduled posts." },
  );

  const pages = router(
    {
      browse: browse("/pages/", "List pages."),
      get: read((i) => `/pages/${seg(i)}/`, "Get a page by id."),
      getBySlug: readBy((s) => `/pages/slug/${seg(s)}/`, "slug", "Get a page by slug."),
      create: add("/pages/", "pages", "Create a page. Add source=html in query to send HTML."),
      update: edit((i) => `/pages/${seg(i)}/`, "pages", "Update a page."),
      copy: copy((i) => `/pages/${seg(i)}/copy/`, "Duplicate a page as a new draft."),
      delete: remove((i) => `/pages/${seg(i)}/`, "Delete a page."),
    },
    { title: "Pages", description: "Static pages." },
  );

  const tags = router(
    {
      browse: browse("/tags/", "List tags (include=count.posts)."),
      get: read((i) => `/tags/${seg(i)}/`, "Get a tag by id."),
      getBySlug: readBy((s) => `/tags/slug/${seg(s)}/`, "slug", "Get a tag by slug."),
      create: add("/tags/", "tags", "Create a tag."),
      update: edit((i) => `/tags/${seg(i)}/`, "tags", "Update a tag."),
      delete: remove((i) => `/tags/${seg(i)}/`, "Delete a tag."),
    },
    { title: "Tags", description: "Tags used to organize posts." },
  );

  const members = router(
    {
      browse: browse("/members/", "List members (include=newsletters,labels; filter on status, label, subscribed)."),
      get: read((i) => `/members/${seg(i)}/`, "Get a member by id."),
      create: add("/members/", "members", "Create a member (email required). Add send_email=true in query to send a magic link."),
      update: edit((i) => `/members/${seg(i)}/`, "members", "Update a member, including labels, newsletters and subscription status."),
    },
    { title: "Members", description: "Site members and subscribers." },
  );

  const labels = router(
    {
      browse: browse("/labels/", "List member labels."),
      get: read((i) => `/labels/${seg(i)}/`, "Get a label by id."),
      create: add("/labels/", "labels", "Create a label."),
      update: edit((i) => `/labels/${seg(i)}/`, "labels", "Update a label."),
      delete: remove((i) => `/labels/${seg(i)}/`, "Delete a label."),
    },
    { title: "Labels", description: "Labels applied to members." },
  );

  const tiers = router(
    {
      browse: browse("/tiers/", "List membership tiers (include=monthly_price,yearly_price,benefits)."),
      get: read((i) => `/tiers/${seg(i)}/`, "Get a tier by id."),
      create: add("/tiers/", "tiers", "Create a tier."),
      update: edit((i) => `/tiers/${seg(i)}/`, "tiers", "Update a tier."),
    },
    { title: "Tiers", description: "Free and paid membership tiers." },
  );

  const newsletters = router(
    {
      browse: browse("/newsletters/", "List newsletters."),
      get: read((i) => `/newsletters/${seg(i)}/`, "Get a newsletter by id."),
      create: add("/newsletters/", "newsletters", "Create a newsletter."),
      update: edit((i) => `/newsletters/${seg(i)}/`, "newsletters", "Update a newsletter."),
    },
    { title: "Newsletters", description: "Email newsletters members can subscribe to." },
  );

  const offers = router(
    {
      browse: browse("/offers/", "List offers."),
      get: read((i) => `/offers/${seg(i)}/`, "Get an offer by id."),
      create: add("/offers/", "offers", "Create an offer."),
      update: edit((i) => `/offers/${seg(i)}/`, "offers", "Update an offer."),
    },
    { title: "Offers", description: "Discount offers for paid tiers." },
  );

  const users = router(
    {
      browse: browse("/users/", "List staff users (include=roles,count.posts)."),
      get: read((i) => `/users/${seg(i)}/`, "Get a staff user by id."),
      getBySlug: readBy((s) => `/users/slug/${seg(s)}/`, "slug", "Get a staff user by slug."),
    },
    { title: "Users", description: "Staff users and authors." },
  );

  const webhooks = router(
    {
      create: add("/webhooks/", "webhooks", "Create a webhook (event, target_url required)."),
      update: edit((i) => `/webhooks/${seg(i)}/`, "webhooks", "Update a webhook."),
      delete: remove((i) => `/webhooks/${seg(i)}/`, "Delete a webhook."),
    },
    { title: "Webhooks", description: "Webhooks the integration owns." },
  );

  const site = router(
    {
      get: query({ description: "Get the site title, description, URL and Ghost version.", input: object({}) }, () => call("GET", "/site/")),
      settings: query(
        { description: "Read site settings. Needs a staff access token or an Owner/Admin key; integration keys may be refused.", input: object({}) },
        () => call("GET", "/settings/"),
      ),
      themes: query(
        { description: "List installed themes. Needs a staff access token or an Owner/Admin key.", input: object({}) },
        () => call("GET", "/themes/"),
      ),
      activateTheme: mutation(
        { description: "Activate an installed theme by name.", input: object({ name: id() }) },
        (_c, { name }) => call("PUT", `/themes/${seg(name)}/activate/`),
      ),
    },
    { title: "Site", description: "Site info, settings and themes." },
  );

  return router({
    posts,
    pages,
    tags,
    members,
    labels,
    tiers,
    newsletters,
    offers,
    users,
    webhooks,
    site,
    request: mutation(
      {
        description:
          "Escape hatch: send any request to the Ghost Admin API. path is relative to /ghost/api/admin, for example /roles/ or /members/{id}/. Prefer the dedicated tools. File uploads (images, themes) are multipart and not supported.",
        input: object({
          method: string(),
          path: string({ minLength: 1 }),
          query: Query.optional(),
          body: json().optional(),
        }),
      },
      (_c, { method, path, query: q, body }) => {
        const m = method.toUpperCase();
        if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(m)) throw new Error("method must be GET, POST, PUT, PATCH or DELETE");
        if (!path.startsWith("/") || path.includes("..") || path.includes("//") || path.includes("?") || path.includes("#"))
          throw new Error("path must start with / and stay under the Admin API");
        return call(m, path, q ?? {}, body);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { ghost: ghost.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ghost ?? [],
        (account) =>
          withApprovals(build(client(adminBase(account.fields.site), account.fields.key, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Ghost",
        description: "Posts, pages, tags, members, labels, tiers, newsletters, offers, users, webhooks and site info on a Ghost publication.",
        icons,
        instructions:
          "Create and update bodies are wrapped in the resource name, for example {\"posts\": [{\"title\": \"Hi\"}]}. Updating a post or page needs its current updated_at. Browse tools take filter (NQL), limit, page, order, include and fields.",
      },
    ),
  }),
);
