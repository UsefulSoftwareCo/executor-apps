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

const base = "https://my.demio.com/api/v1";

const demio = defineProvider({
  name: "Demio",
  hosts: ["my.demio.com"],
  auth: {
    // Account owners create the key and secret under Account Settings > API.
    apiKey: secrets({
      label: "API key and secret",
      fields: object({ key: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/ping`, { signal, headers: headers(account.fields) });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function headers(fields: { key: string; secret: string }) {
  return { "Api-Key": fields.key, "Api-Secret": fields.secret };
}

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-zA-Z]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (op: Operation, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "PUT";
  const hasQuery = op.method === "GET" && op.name !== "ping";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    ...(hasQuery ? { query: record(json()).optional() } : {}),
    ...(hasBody ? { body: record(json()) } : {}),
  });
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op, path, (args.query as Params | undefined) ?? {}, hasBody ? (args.body as Params) : undefined);
  };
  const description = op.description;
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function rest(fields: { key: string; secret: string }, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, path: string, search: Params, body: Params | undefined) => {
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method: op.method,
      signal,
      headers: { ...headers(fields), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { demio: demio.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.demio ?? [],
        (account) =>
          withApprovals(rest(account.fields, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Demio",
        description: "Demio webinars: list events, read event sessions, register attendees and report on session participants.",
        icons,
      },
    ),
  }),
);
