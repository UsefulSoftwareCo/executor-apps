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

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
type Account =
  | { method: "basicAuth"; fields: { siteUrl: string; username: string; password: string } }
  | { method: "clientCredentials"; fields: { siteUrl: string; clientId: string; clientSecret: string } };

// Every Drupal site has its own origin, so credentials only ever go to the origin the account names.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Drupal site address, for example https://example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Drupal site must be reached over https.");
  if (url.search !== "" || url.hash !== "") throw new Error("Enter only the site address, with no query or fragment.");
  // A site installed in a subdirectory keeps its path prefix.
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

async function authorization(account: Account, origin: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  if (account.method === "basicAuth")
    return `Basic ${btoa(`${account.fields.username}:${account.fields.password}`)}`;
  // Simple OAuth (the de facto OAuth 2 server for Drupal) serves its token endpoint at /oauth/token.
  const response = await fetcher(`${origin}/oauth/token`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: account.fields.clientId,
      client_secret: account.fields.clientSecret,
    }).toString(),
  });
  const token = await decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
  return `Bearer ${token.access_token}`;
}

const drupal = defineProvider({
  name: "Drupal",
  auth: {
    // Drupal core's Basic Authentication module, with the JSON:API module enabled and the user allowed to use it.
    basicAuth: secrets({
      label: "Username and password (core Basic Authentication)",
      fields: object({
        siteUrl: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
    // The Simple OAuth contrib module: a consumer with the client credentials grant.
    clientCredentials: secrets({
      label: "Simple OAuth client credentials",
      fields: object({
        siteUrl: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.siteUrl);
    const response = await fetch(`${origin}/jsonapi`, {
      signal,
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: await authorization(account as Account, origin, fetch, signal),
      },
    });
    await decodeJson(response, object({}));
    const who = account.method === "basicAuth" ? account.fields.username : account.fields.clientId;
    return { accountInfo: { externalId: `${origin}:${who}`, displayName: new URL(origin).host } };
  },
});

function client(account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  const origin = originOf(account.fields.siteUrl);
  let cached: { value: string; expires: number } | undefined;
  const header = async () => {
    if (account.method === "basicAuth") return authorization(account, origin, fetcher, signal);
    if (cached !== undefined && cached.expires > Date.now()) return cached.value;
    const value = await authorization(account, origin, fetcher, signal);
    cached = { value, expires: Date.now() + 240_000 };
    return value;
  };
  const call = async (method: string, path: string, search: Params = {}, body?: unknown) => {
    const url = new URL(`${origin}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: await header(),
        ...(body === undefined ? {} : { "Content-Type": "application/vnd.api+json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  return { call };
}

type Client = ReturnType<typeof client>;

const queryParams = record(json()).optional();
const attributes = record(json());
const relationships = record(json()).optional();

const queryHelp =
  "query holds raw JSON:API parameters by name, for example {\"filter[status]\": 1, \"sort\": \"-changed\", \"page[limit]\": 50, \"page[offset]\": 0, \"include\": \"uid\", \"fields[node--article]\": \"title,body\"}. Lists return at most 50 items; follow links.next.";

// "node--article" is the resource type; its JSON:API path is /jsonapi/node/article.
function pathFor(type: string): string {
  const parts = type.split("--");
  if (parts.length !== 2 || parts.some((part) => part === "" || !/^[A-Za-z0-9_]+$/.test(part)))
    throw new Error(`Resource type "${type}" must look like entityType--bundle, for example node--article or user--user.`);
  return `/jsonapi/${parts[0]}/${parts[1]}`;
}

// Tools for one entity type. Fixed bundles (users) take no bundle input; others take `bundle`.
function entity(c: Client, entityType: string, noun: string, fixedBundle?: string) {
  const typeOf = (input: Params) => `${entityType}--${fixedBundle ?? String(input.bundle)}`;
  const bundleInput: Record<string, ReturnType<typeof string>> = fixedBundle === undefined ? { bundle: string({ minLength: 1 }) } : {};
  const where = fixedBundle === undefined ? ` bundle is the machine name of the ${noun} bundle.` : "";
  return router(
    {
      list: query(
        { description: `List ${noun} entities.${where} ${queryHelp}`, input: object({ ...bundleInput, query: queryParams }) },
        async (_ctx, input: Params) => c.call("GET", pathFor(typeOf(input)), (input.query as Params | undefined) ?? {}),
      ),
      get: query(
        { description: `Retrieve one ${noun} by UUID.${where}`, input: object({ ...bundleInput, id: string({ minLength: 1 }), query: queryParams }) },
        async (_ctx, input: Params) =>
          c.call("GET", `${pathFor(typeOf(input))}/${encodeURIComponent(String(input.id))}`, (input.query as Params | undefined) ?? {}),
      ),
      create: mutation(
        {
          description: `Create a ${noun}.${where} attributes holds its fields (for example title, body: {value, format}); relationships links other entities, as {field: {data: {type, id}}}.`,
          input: object({ ...bundleInput, attributes, relationships }),
        },
        async (_ctx, input: Params) => {
          const type = typeOf(input);
          return c.call("POST", pathFor(type), {}, { data: { type, attributes: input.attributes, ...(input.relationships === undefined ? {} : { relationships: input.relationships }) } });
        },
      ),
      update: mutation(
        {
          description: `Update a ${noun} by UUID.${where} Only the attributes and relationships given change.`,
          input: object({ ...bundleInput, id: string({ minLength: 1 }), attributes: attributes.optional(), relationships }),
        },
        async (_ctx, input: Params) => {
          const type = typeOf(input);
          const id = String(input.id);
          return c.call("PATCH", `${pathFor(type)}/${encodeURIComponent(id)}`, {}, {
            data: {
              type,
              id,
              ...(input.attributes === undefined ? {} : { attributes: input.attributes }),
              ...(input.relationships === undefined ? {} : { relationships: input.relationships }),
            },
          });
        },
      ),
      delete: mutation(
        { description: `Delete a ${noun} by UUID.${where}`, input: object({ ...bundleInput, id: string({ minLength: 1 }) }) },
        async (_ctx, input: Params) => c.call("DELETE", `${pathFor(typeOf(input))}/${encodeURIComponent(String(input.id))}`),
      ),
    },
    { title: noun.charAt(0).toUpperCase() + noun.slice(1), description: `${noun} entities through JSON:API.` },
  );
}

function build(c: Client) {
  return router({
    index: query(
      { description: "List every JSON:API resource type the site exposes, with its collection link (the 'resource type' is entityType--bundle).", input: object({}) },
      async () => c.call("GET", "/jsonapi"),
    ),
    resources: router(
      {
        list: query(
          { description: `List entities of any resource type, such as node--article or taxonomy_term--tags. ${queryHelp}`, input: object({ type: string({ minLength: 1 }), query: queryParams }) },
          async (_ctx, input) => c.call("GET", pathFor(input.type), input.query ?? {}),
        ),
        get: query(
          { description: "Retrieve one entity of any resource type by UUID.", input: object({ type: string({ minLength: 1 }), id: string({ minLength: 1 }), query: queryParams }) },
          async (_ctx, input) => c.call("GET", `${pathFor(input.type)}/${encodeURIComponent(input.id)}`, input.query ?? {}),
        ),
        create: mutation(
          { description: "Create an entity of any resource type. attributes holds its fields; relationships links other entities.", input: object({ type: string({ minLength: 1 }), attributes, relationships }) },
          async (_ctx, input) =>
            c.call("POST", pathFor(input.type), {}, { data: { type: input.type, attributes: input.attributes, ...(input.relationships === undefined ? {} : { relationships: input.relationships }) } }),
        ),
        update: mutation(
          { description: "Update an entity of any resource type by UUID.", input: object({ type: string({ minLength: 1 }), id: string({ minLength: 1 }), attributes: attributes.optional(), relationships }) },
          async (_ctx, input) =>
            c.call("PATCH", `${pathFor(input.type)}/${encodeURIComponent(input.id)}`, {}, {
              data: {
                type: input.type,
                id: input.id,
                ...(input.attributes === undefined ? {} : { attributes: input.attributes }),
                ...(input.relationships === undefined ? {} : { relationships: input.relationships }),
              },
            }),
        ),
        delete: mutation(
          { description: "Delete an entity of any resource type by UUID.", input: object({ type: string({ minLength: 1 }), id: string({ minLength: 1 }) }) },
          async (_ctx, input) => c.call("DELETE", `${pathFor(input.type)}/${encodeURIComponent(input.id)}`),
        ),
      },
      { title: "Resources", description: "Any JSON:API resource type the site exposes." },
    ),
    node: entity(c, "node", "content item"),
    term: entity(c, "taxonomy_term", "taxonomy term"),
    user: entity(c, "user", "user", "user"),
    media: entity(c, "media", "media item"),
    comment: entity(c, "comment", "comment"),
    blockContent: entity(c, "block_content", "custom block"),
    menuLink: entity(c, "menu_link_content", "custom menu link"),
    file: router(
      {
        list: query(
          { description: `List file entities (metadata only; uploads are not supported). ${queryHelp}`, input: object({ query: queryParams }) },
          async (_ctx, input) => c.call("GET", "/jsonapi/file/file", input.query ?? {}),
        ),
        get: query(
          { description: "Retrieve one file entity by UUID.", input: object({ id: string({ minLength: 1 }), query: queryParams }) },
          async (_ctx, input) => c.call("GET", `/jsonapi/file/file/${encodeURIComponent(input.id)}`, input.query ?? {}),
        ),
      },
      { title: "Files", description: "File entity metadata." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { drupal: drupal.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.drupal ?? [],
        (account) => withApprovals(build(client(account as Account, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Drupal",
        description: "Content, taxonomy terms, users, media, comments, blocks, menu links and any other entity of a Drupal site through its core JSON:API.",
        instructions:
          "Entities are addressed by UUID and resource type (entityType--bundle). Call index first to see the types the site exposes. What each call may do depends on the Drupal permissions of the connected user or OAuth consumer; JSON:API must be enabled, and write access is read-only unless the site allows it.",
        icons,
      },
    ),
  }),
);
