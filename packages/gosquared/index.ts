import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

const base = "https://api.gosquared.com";

const gosquared = defineProvider({
  name: "GoSquared",
  hosts: ["api.gosquared.com"],
  auth: {
    // GoSquared sends credentials as api_key and site_token query parameters.
    apiKey: secrets({
      label: "API key and site token",
      fields: object({ apiKey: string({ minLength: 1 }), siteToken: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/auth/v1/tokeninfo`);
    url.searchParams.set("api_key", account.fields.apiKey);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

type Params = Record<string, unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([A-Za-z_]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (op: Operation, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description}${op.method === "GET" ? " Filters such as from, to, limit, sort and interval go in query." : ""}${hasBody ? " Pass the JSON request body as body." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op, path, (args.query as Params | undefined) ?? {}, hasBody ? (args.body as Params | undefined) : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(fields: { apiKey: string; siteToken: string }, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    url.searchParams.set("api_key", fields.apiKey);
    url.searchParams.set("site_token", fields.siteToken);
    const response = await fetcher(url.toString(), {
      method: op.method,
      signal,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
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
  { user: { accounts: { gosquared: gosquared.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gosquared ?? [],
        (account) =>
          withApprovals(build(account.fields, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "GoSquared",
        description: "GoSquared analytics: realtime Now data, historical Trends, People, Chat, account settings, webhooks and event tracking.",
        instructions: "Groups: now (realtime), trends (historical; pass from/to/interval in query), people, chat, account, tracking (writes data). Pagination uses limit as \"count\" or \"offset,count\" (max 250 for People and Chat).",
        icons,
      },
    ),
  }),
);
