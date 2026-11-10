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
type Fields = { tenantId: string; instanceSubdomain: string; clientId: string; clientSecret: string };
type Params = Record<string, unknown>;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Every ImmyBot instance lives at https://<subdomain>.immy.bot. Credentials only ever go to that origin.
function originOf(raw: string): string {
  const text = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\.immy\.bot\/?$/, "");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(text)) throw new Error("Enter your ImmyBot instance subdomain, for example contoso.");
  return `https://${text}.immy.bot`;
}

// The Microsoft Entra app registration authenticates with the client credentials grant; the scope is the instance URL.
async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  if (!/^[0-9a-f-]{36}$/i.test(fields.tenantId.trim())) throw new Error("The Microsoft Entra tenant ID must be a GUID.");
  const response = await fetcher(`https://login.microsoftonline.com/${fields.tenantId.trim()}/oauth2/v2.0/token`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: fields.clientId.trim(),
      client_secret: fields.clientSecret,
      scope: `${origin}/.default`,
    }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(origin, fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 120, 60) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const immybot = defineProvider({
  name: "ImmyBot",
  hosts: ["*.immy.bot", "login.microsoftonline.com"],
  auth: {
    clientCredentials: secrets({
      label: "Entra app registration",
      fields: object({
        tenantId: plain(string({ minLength: 1 })),
        instanceSubdomain: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.instanceSubdomain);
    const authed = authorizedFetch(origin, account.fields, fetch);
    const response = await authed(`${origin}/api/v1/tenants`, { signal, headers: { Accept: "application/json" } });
    await decodeJson(response, json());
    return {
      accountInfo: {
        externalId: `${origin}:${account.fields.clientId}`,
        displayName: new URL(origin).host,
      },
    };
  },
});

function client(origin: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: unknown) => {
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
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();

// GET tool: `ids` fill {placeholders} in the path; every other input goes to the query string.
function read(call: Call, path: string, description: string, ids: readonly string[] = []) {
  return query(
    {
      description,
      input: object({
        ...Object.fromEntries(ids.map((id) => [id, number()])),
        query: filters,
      }),
    },
    async (_ctx, input: Params) => {
      let resolved = path;
      for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
      return call("GET", resolved, (input.query as Params | undefined) ?? {});
    },
  );
}

const sieve =
  "Sieve query: filters (e.g. name@=acme), sorts (e.g. -name), page, pageSize.";

function build(call: Call) {
  return router({
    tenants: router(
      {
        list: read(call, "/api/v1/tenants", "List tenants (customers) in this ImmyBot instance."),
        get: read(call, "/api/v1/tenants/{tenantId}", "Retrieve one tenant.", ["tenantId"]),
        preferences: read(call, "/api/v1/preferences/tenants/{tenantId}", "Retrieve a tenant's preferences.", ["tenantId"]),
        latestActions: read(
          call,
          "/api/v1/maintenance-actions/latest-for-tenant/{tenantId}",
          "Latest maintenance actions for a tenant.",
          ["tenantId"],
        ),
        nonCompliantActions: read(
          call,
          "/api/v1/maintenance-actions/latest-non-compliant-actions-for-tenant/{tenantId}",
          "Latest non-compliant maintenance actions for a tenant.",
          ["tenantId"],
        ),
      },
      { title: "Tenants", description: "Customer tenants and their compliance." },
    ),
    computers: router(
      {
        paged: read(
          call,
          "/api/v1/computers/paged",
          "List computers. Query: filter, sort, sortDesc, skip, take, tenantId, onboardingOnly, staleOnly, devLabOnly, includeOffline, licensedOnly, deletedOnly.",
        ),
        get: read(
          call,
          "/api/v1/computers/{computerId}",
          "Retrieve a computer. Query: includeSessions, includeAdditionalPersons, includePrimaryPerson, includeProviderAgents.",
          ["computerId"],
        ),
        status: read(call, "/api/v1/computers/{computerId}/status", "Current status of a computer.", ["computerId"]),
        inventory: read(call, "/api/v1/computers/inventory", "Computer inventory. Pass computerId and other filters in query."),
        dx: read(call, "/api/v1/computers/dx", "DevExtreme-style computer listing. Query: take, skip, sort, filter, requireTotalCount."),
      },
      { title: "Computers", description: "Managed endpoints and their inventory." },
    ),
    maintenance: router(
      {
        sessions: read(
          call,
          "/api/v1/maintenance-sessions/dx",
          "List maintenance sessions. Query: computerId, tenantId, personId, sessionType, take, skip, sort, filter.",
        ),
        session: read(
          call,
          "/api/v1/maintenance-sessions/{sessionId}",
          "Retrieve a session. Query: includeActions, includeStages, includeActionActivities.",
          ["sessionId"],
        ),
        sessionLogs: read(call, "/api/v1/maintenance-sessions/{sessionId}/logs", "Logs of a maintenance session.", ["sessionId"]),
        statusCounts: read(call, "/api/v1/maintenance-sessions/status-counts", "Counts of sessions by status."),
        schedules: read(call, "/api/v1/schedules", "List maintenance schedules. Query: tenantId."),
        schedule: read(call, "/api/v1/schedules/{scheduleId}", "Retrieve a schedule.", ["scheduleId"]),
      },
      { title: "Maintenance", description: "Maintenance sessions and schedules." },
    ),
    software: router(
      {
        local: read(call, "/api/v1/software/local", "List local (your own) software. Query: include."),
        global: read(call, "/api/v1/software/global", "List global (ImmyBot library) software."),
        localTasks: read(call, "/api/v1/maintenance-tasks/local", `List local maintenance tasks. ${sieve}`),
        globalTasks: read(call, "/api/v1/maintenance-tasks/global", `List global maintenance tasks. ${sieve}`),
        globalTargetAssignments: read(call, "/api/v1/target-assignments/global", "List global deployments (target assignments)."),
      },
      { title: "Software", description: "Software, maintenance tasks and deployments." },
    ),
    people: router(
      {
        persons: read(call, "/api/v1/persons", `List people. ${sieve}`),
        users: read(call, "/api/v1/users", "List ImmyBot users."),
        user: read(call, "/api/v1/users/{userId}", "Retrieve an ImmyBot user.", ["userId"]),
        roles: read(call, "/api/v1/roles", "List roles."),
        tags: read(call, "/api/v1/tags", "List tags."),
      },
      { title: "People", description: "People, users, roles and tags." },
    ),
    api: router(
      {
        get: query(
          {
            description:
              "GET any ImmyBot API path, for endpoints without a dedicated tool. path starts with /api/v1/ (your instance serves the full list at /swagger).",
            input: object({ path: string({ minLength: 1 }), query: filters }),
          },
          async (_ctx, input: { path: string; query?: Params }) => call("GET", checkedPath(input.path), input.query ?? {}),
        ),
        request: mutation(
          {
            description:
              "Send a POST, PUT, PATCH or DELETE to any ImmyBot API path, for example running maintenance or editing a computer. path starts with /api/v1/; body is the JSON payload from your instance's /swagger.",
            input: object({
              method: string({ minLength: 1 }),
              path: string({ minLength: 1 }),
              query: filters,
              body: record(json()).optional(),
            }),
          },
          async (_ctx, input: { method: string; path: string; query?: Params; body?: unknown }) => {
            const method = input.method.toUpperCase();
            if (method !== "POST" && method !== "PUT" && method !== "PATCH" && method !== "DELETE")
              throw new Error("method must be POST, PUT, PATCH or DELETE.");
            return call(method, checkedPath(input.path), input.query ?? {}, input.body);
          },
        ),
      },
      { title: "Raw API", description: "Call any ImmyBot API path directly." },
    ),
  });
}

function checkedPath(path: string): string {
  if (!path.startsWith("/api/") || path.includes("..") || path.includes("//") || path.includes("?") || path.includes("#"))
    throw new Error("path must start with /api/, with no query string; pass query separately.");
  return path;
}

export default defineApp(
  { user: { accounts: { immybot: immybot.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.immybot ?? [],
        (account) => {
          const origin = originOf(account.fields.instanceSubdomain);
          const call = client(origin, authorizedFetch(origin, account.fields, fetch), signal);
          return withApprovals(build(call), (tool) => (tool.kind === "mutation" ? always() : undefined));
        },
        { signal },
      ),
      {
        title: "ImmyBot",
        description:
          "Tenants, computers, maintenance sessions and schedules, software, deployments, people and users in an ImmyBot instance, plus a raw API caller.",
        instructions:
          "List endpoints use Sieve: filters, sorts, page and pageSize (or skip/take on computers). The instance's full API reference is at https://<subdomain>.immy.bot/swagger.",
        icons,
      },
    ),
  }),
);
