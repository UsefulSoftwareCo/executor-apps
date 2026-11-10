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

const base = "https://api.lessonly.com/api";

type Fields = { subdomain: string; apiKey: string };

function authHeaders(fields: Fields): Record<string, string> {
  return { Authorization: `Basic ${btoa(`${fields.subdomain}:${fields.apiKey}`)}` };
}

const lessonly = defineProvider({
  name: "Lessonly",
  hosts: ["api.lessonly.com"],
  auth: {
    // Subdomain and API key: Lessonly > Company Settings > API & Webhook. HTTP Basic, subdomain as username.
    apiKey: secrets({
      label: "Subdomain and API key",
      fields: object({ subdomain: string({ minLength: 1 }), apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/tags?per_page=1`, {
      signal,
      headers: { ...authHeaders(account.fields), Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: account.fields.subdomain, displayName: account.fields.subdomain } };
  },
});

type Params = Record<string, unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-zA-Z_]+)\}/g)].map((match) => match[1]!);
}

function tool(
  op: Operation,
  call: (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>,
) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PUT";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description}${hasBody ? " Pass JSON fields as body." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op.method, path, (args.query as Params | undefined) ?? {}, hasBody ? ((args.body as Params | undefined) ?? {}) : undefined);
  };
  const readOnly = op.method === "GET" || op.path === "/availability/check-times";
  return readOnly ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (verb: string, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method: verb,
      signal,
      headers: {
        ...authHeaders(fields),
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
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
  { user: { accounts: { lessonly: lessonly.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lessonly ?? [],
        (account) =>
          withApprovals(build(account.fields, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Lessonly",
        description: "Lessonly (Seismic Learning): users, groups, lessons, paths, tags and assignments.",
        instructions:
          "Paths in operations carry the API version: tools ending in Detailed call v1.1 endpoints with richer output. Filters go in query, JSON write fields in body. Lists are paginated with page and per_page (max 1000); the rate limit is 500 requests per minute.",
        icons,
      },
    ),
  }),
);
