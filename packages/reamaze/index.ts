import {
  accountRouter,
  decodeJson,
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

// Each brand lives on its own host, {brand}.reamaze.io (Brand Settings lists it).
const hostPattern = /^[a-z0-9][a-z0-9-]*\.reamaze\.(io|com)$/;

type Fields = { brand: string; email: string; token: string };

function origin(brand: string): string {
  const host = brand
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const full = host.includes(".") ? host : `${host}.reamaze.io`;
  if (!hostPattern.test(full))
    throw new Error("Enter your Re:amaze brand, for example mybrand or mybrand.reamaze.io.");
  return `https://${full}`;
}

function authHeaders(fields: Fields): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${fields.email}:${fields.token}`)}`,
    Accept: "application/json",
  };
}

const reamaze = defineProvider({
  name: "Re:amaze",
  hosts: ["*.reamaze.io", "*.reamaze.com"],
  auth: {
    // Settings > Developer > API Token > Generate New Token. Tokens belong to a user.
    apiKey: secrets({
      label: "API token",
      fields: object({
        brand: plain(string({ minLength: 1 })),
        email: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account.fields.brand);
    const response = await fetch(`${base}/api/v1/channels`, { signal, headers: authHeaders(account.fields) });
    await decodeJson(response, object({}));
    const host = new URL(base).hostname;
    return { accountInfo: { externalId: host, displayName: host, username: account.fields.email } };
  },
});

type Params = Record<string, unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1]!);
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
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op.method, path, (args.query as Params | undefined) ?? {}, hasBody ? ((args.body as Params | undefined) ?? {}) : undefined);
  };
  return op.method === "GET"
    ? query({ description: op.description, input }, run)
    : mutation({ description: op.description, input }, run);
}

function appendQuery(url: URL, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) for (const item of value) url.searchParams.append(`${key}[]`, String(item));
  else if (typeof value === "object") for (const [k, v] of Object.entries(value)) appendQuery(url, `${key}[${k}]`, v);
  else url.searchParams.set(key, String(value));
}

function build(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = origin(fields.brand);
  const call = async (verb: string, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${base}/api/v1${path}`);
    for (const [key, value] of Object.entries(search)) appendQuery(url, key, value);
    const response = await fetcher(url.toString(), {
      method: verb,
      signal,
      headers: { ...authHeaders(fields), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Re:amaze ${verb} ${path} failed with ${response.status}: ${text.slice(0, 500)}`);
    return text.trim() === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { reamaze: reamaze.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.reamaze ?? [],
        (account) =>
          withApprovals(build(account.fields as Fields, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Re:amaze",
        description:
          "Re:amaze customer support: conversations, messages, contacts, notes, help articles, channels, response templates, staff, reports and status page incidents.",
        instructions:
          "Call channels.list to find channel slugs (the category of a conversation). Write bodies are JSON objects wrapped in their resource key, e.g. {conversation: {...}}. Message visibility 1 is an internal note. List results are paginated with the page query; contacts and staff belong to the account, everything else to the brand.",
        icons,
      },
    ),
  }),
);
