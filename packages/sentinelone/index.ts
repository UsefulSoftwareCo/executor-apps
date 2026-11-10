import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  header,
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
  t,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

// Every SentinelOne tenant has its own management console host (usea1-acme.sentinelone.net). The API token only
// ever goes to that origin.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your management console hostname, for example your-tenant.sentinelone.net.");
  }
  if (url.protocol !== "https:") throw new Error("The management console must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the console hostname, with no path.");
  return url.origin;
}

const sentinelone = defineProvider({
  name: "SentinelOne",
  hosts: ["*.sentinelone.net"],
  auth: {
    // An API token generated for a console user or service user (Settings > Users > the user > Generate API token).
    apiToken: secrets({
      label: "API token",
      fields: object({
        hostname: plain(string({ minLength: 1 })),
        apiToken: string({ minLength: 1 }),
      }),
      request: ({ apiToken }) => header("Authorization", t`ApiToken ${apiToken}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.hostname);
    const response = await fetch(`${origin}/web/api/v2.1/user`, {
      signal,
      headers: { ...account.headers(), accept: "application/json" },
    });
    await decodeJson(response, object({ data: object({ id: string() }) }));
    return { accountInfo: { externalId: new URL(origin).host, displayName: new URL(origin).host } };
  },
});

type Params = Record<string, unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([A-Za-z]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (op: Operation, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PUT" || op.method === "DELETE";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    ...(op.list ? { limit: number().optional(), cursor: string().optional(), skip: number().optional() } : {}),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const notes = [
    op.list ? "Page with limit (max 1000) and the cursor from pagination.nextCursor." : "",
    "Filters go in query (for example ids, siteIds, accountIds, groupIds, computerName__contains, createdAt__gte).",
    hasBody ? 'Pass the JSON request body as body, usually { "data": {...}, "filter": {...} }.' : "",
  ].filter((text) => text !== "");
  const description = `${op.description} ${notes.join(" ")}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    const search: Params = { ...((args.query as Params | undefined) ?? {}) };
    for (const key of ["limit", "cursor", "skip"]) if (args[key] !== undefined) search[key] = args[key];
    return call(op, path, search, hasBody ? (args.body as Params | undefined) : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(origin: string, headers: () => Record<string, string>, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${origin}/web/api/v2.1${path}`);
    for (const [name, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(name, Array.isArray(value) ? value.join(",") : typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method: op.method,
      signal,
      headers: {
        ...headers(),
        accept: "application/json",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { sentinelone: sentinelone.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sentinelone ?? [],
        (account) =>
          withApprovals(
            build(originOf(account.fields.hostname), () => account.headers(), fetch, signal),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "SentinelOne",
        description:
          "SentinelOne Singularity management console: agents, threats, sites, accounts, groups, exclusions, Deep Visibility queries, activities and alerts.",
        instructions:
          "Scope queries with accountIds, siteIds or groupIds in query. Lists page with limit and cursor. Mutations take { data, filter } bodies; filter selects the agents or threats to act on, so always set one.",
        icons,
      },
    ),
  }),
);
