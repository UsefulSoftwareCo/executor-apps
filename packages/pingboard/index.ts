import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://app.pingboard.com";
const base = `${origin}/api/v2`;

const pingboard = defineProvider({
  name: "Pingboard",
  hosts: ["app.pingboard.com"],
  auth: {
    // An API client created in Pingboard (Settings > Integrations > API) signs in with its client id and secret.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: `${origin}/oauth/token`,
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users?page_size=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: "pingboard", displayName: "Pingboard" } };
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Record<string, unknown> = {}, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Pingboard answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };
}

const enc = encodeURIComponent;
const List = object({
  page: number().optional(),
  page_size: number().optional(),
  sort: string().optional(),
  include: string().optional(),
  filters: json().optional(),
});
const Id = object({ id: number(), include: string().optional() });
const Create = object({ fields: json() });
const Update = object({ id: number(), fields: json() });
const Remove = object({ id: number() });

const listNote =
  " page and page_size paginate; sort is a field name (prefix with - for descending); include is a comma separated list of linked resources; filters is an object of extra query parameters (for example {\"email\":\"a@b.com\"}).";

type Send = ReturnType<typeof client>;

// Pingboard wraps a record in an object keyed by the plural resource name: { users: { ... } }.
function resource(send: Send, name: string, singular: string, opts: { write: boolean; remove?: boolean; extra?: Record<string, unknown> }) {
  const tools: Record<string, unknown> = {
    list: query({ description: `List ${name}.${listNote}`, input: List }, async (_c, i) =>
      send("GET", `/${name}`, {
        page: i.page,
        page_size: i.page_size,
        sort: i.sort,
        include: i.include,
        ...((i.filters ?? {}) as Record<string, unknown>),
      }),
    ),
    get: query({ description: `Get one ${singular} by id.`, input: Id }, async (_c, i) =>
      send("GET", `/${name}/${enc(String(i.id))}`, { include: i.include }),
    ),
  };
  if (opts.write) {
    tools.create = mutation(
      { description: `Create a ${singular}. fields holds the ${singular}'s attributes; it is sent as { "${name}": fields }.`, input: Create },
      async (_c, i) => send("POST", `/${name}`, {}, { [name]: i.fields }),
    );
    tools.update = mutation(
      { description: `Update a ${singular}. fields holds only the attributes to change; it is sent as { "${name}": fields }.`, input: Update },
      async (_c, i) => send("PATCH", `/${name}/${enc(String(i.id))}`, {}, { [name]: i.fields }),
    );
  }
  if (opts.remove === true) {
    tools.delete = mutation({ description: `Delete a ${singular} by id.`, input: Remove }, async (_c, i) =>
      send("DELETE", `/${name}/${enc(String(i.id))}`),
    );
  }
  return router({ ...tools, ...(opts.extra ?? {}) } as never);
}

const Search = object({ q: string() });
const Summary = object({ user_id: number() });

function build(send: Send) {
  return router({
    users: resource(send, "users", "user", { write: true, remove: true }),
    groups: resource(send, "groups", "group", { write: true, remove: true }),
    customFields: resource(send, "custom_fields", "custom field", { write: true, remove: true }),
    statuses: resource(send, "statuses", "status", {
      write: true,
      remove: true,
      extra: {
        summary: query({ description: "Get a user's status summary grouped by year.", input: Summary }, async (_c, i) =>
          send("GET", "/statuses/summary", { user_id: i.user_id }),
        ),
      },
    }),
    guests: resource(send, "guests", "guest", { write: false }),
    company: router({
      get: query({ description: "Get the company account (requires a company admin service account).", input: object({}) }, async () =>
        send("GET", "/companies/my_company"),
      ),
    }),
    statusTypes: router({
      list: query({ description: "List status types (Out of Office, Remote and so on).", input: object({}) }, async () => send("GET", "/status_types")),
    }),
    linkedAccountProviders: router({
      list: query({ description: "List linked account providers (LinkedIn, Facebook and so on).", input: object({}) }, async () =>
        send("GET", "/linked_account_providers"),
      ),
    }),
    linkedAccounts: router({
      get: query({ description: "Get one linked account by id.", input: Id }, async (_c, i) => send("GET", `/linked_accounts/${enc(String(i.id))}`)),
    }),
    search: router({
      users: query({ description: "Search users. Returns an Elasticsearch style hits document.", input: Search }, async (_c, i) =>
        send("GET", "/search/users", { q: i.q }),
      ),
      groups: query({ description: "Search groups (including virtual groups built from user attributes).", input: Search }, async (_c, i) =>
        send("GET", "/search/groups", { q: i.q }),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { pingboard: pingboard.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pingboard ?? [],
        (account) =>
          withApprovals(build(client(account.fields.access_token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Pingboard",
        description: "Pingboard org chart and employee directory: users, groups, statuses, custom fields, guests and search.",
        instructions:
          "Responses are keyed by the plural resource name, with related records under linked. Use include to side-load relations. Writes use PATCH and send the record under its plural key.",
        icons,
      },
    ),
  }),
);
