import {
  accountRouter,
  defineApp,
  defineProvider,
  json,
  mutation,
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
import { operations, type Operation } from "./operations.js";

const base = "https://manage.kontent.ai/v2/projects";

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

const kontent = defineProvider({
  name: "Kontent.ai",
  hosts: ["manage.kontent.ai"],
  auth: {
    // A Management API key (Environment settings > API keys > Management API) is scoped to one environment.
    apiKey: secrets({
      label: "Management API key",
      fields: object({
        environmentId: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const environmentId = account.fields.environmentId.trim();
    const response = await fetch(`${base}/${encodeURIComponent(environmentId)}/languages`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`Kontent.ai rejected the key or environment ID (HTTP ${response.status}).`);
    return { accountInfo: { externalId: environmentId, displayName: environmentId } };
  },
});

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-zA-Z]+)\}/g)].map((match) => match[1]!);
}

function tool(
  op: Operation,
  call: (method: string, path: string, search: Params, body: unknown, continuation: string | undefined) => Promise<unknown>,
) {
  const ids = pathParams(op.path);
  const hasBody = op.method !== "GET" && op.method !== "DELETE";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    query: record(json()).optional(),
    ...(op.paginated ? { continuation: string().optional() } : {}),
    ...(hasBody ? { body: json().optional() } : {}),
  });
  const description = `${op.description}${op.paginated ? " Paginated: pass the continuation value from the previous result to get the next page." : ""}${hasBody ? " Pass the JSON request body as body." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(
      op.method,
      path,
      (args.query as Params | undefined) ?? {},
      hasBody ? args.body : undefined,
      args.continuation as string | undefined,
    );
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function rest(environmentId: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const root = `${base}/${encodeURIComponent(environmentId.trim())}`;
  const call = async (method: string, path: string, search: Params, body: unknown, continuation: string | undefined) => {
    const target = new URL(`${root}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(continuation ? { "x-continuation": continuation } : {}),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Kontent.ai ${method} ${path} failed (HTTP ${response.status}): ${text}`);
    const data: unknown = text ? JSON.parse(text) : { ok: true };
    const next = response.headers.get("x-continuation");
    return next && typeof data === "object" && data !== null && !Array.isArray(data)
      ? { ...data, continuation: next }
      : data;
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { kontent: kontent.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kontent ?? [],
        async (account) =>
          withApprovals(rest(account.fields.environmentId, account.fields.token, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Kontent.ai",
        description:
          "Kontent.ai headless CMS: content items and language variants, publishing and workflows, content types, snippets, taxonomies, assets, languages, collections, spaces and webhooks.",
        icons,
      },
    ),
  }),
);
