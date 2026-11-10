import {
  accountRouter,
  array,
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

const v1 = "https://apis.helpwise.io";
const v0 = "https://app.helpwise.io/dev-apis";

const helpwise = defineProvider({
  name: "Helpwise",
  hosts: ["apis.helpwise.io", "app.helpwise.io"],
  auth: {
    // Created under Settings > API Key in the Helpwise dashboard.
    apiKey: secrets({
      label: "API key and secret",
      fields: object({ key: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${v1}/tags`, { signal, headers: headers(account.fields) });
    await decodeJson(response, array(json()));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
type Creds = { key: string; secret: string };

// V1 takes `Basic base64(key:secret)`; V0 takes `key:secret` as the raw Authorization value
// (every V0 request in the Postman collection sets `Authorization: {API_KEY}:{API_SECRET}`).
function headers(creds: Creds, api: "v1" | "v0" = "v1") {
  const pair = `${creds.key}:${creds.secret}`;
  return { Authorization: api === "v1" ? `Basic ${btoa(pair)}` : pair };
}

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-zA-Z]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (op: Operation, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method !== "GET" && op.method !== "DELETE";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    ...(op.method === "GET" ? { query: record(json()).optional() } : {}),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description}${hasBody ? " Pass the JSON request body as body." : ""}${op.method === "GET" ? " Pass query parameters as query." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op, path, (args.query as Params | undefined) ?? {}, hasBody ? ((args.body as Params | undefined) ?? {}) : undefined);
  };
  // V0 reads are POST requests but change nothing, so they are queries; only writes need approval.
  const readOnly = op.method === "GET" || /^(list|get|search|me|listTemplates)$/.test(op.name);
  return readOnly ? query({ description, input }, run) : mutation({ description, input }, run);
}

function rest(creds: Creds, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, path: string, search: Params, body: Params | undefined) => {
    const target = new URL(`${op.api === "v1" ? v1 : v0}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) target.searchParams.append(`${key}[]`, String(item));
      else target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method: op.method,
      signal,
      headers: { ...headers(creds, op.api), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
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
  { user: { accounts: { helpwise: helpwise.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.helpwise ?? [],
        (account) =>
          withApprovals(rest(account.fields, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Helpwise",
        description:
          "Helpwise shared inbox: conversations, contacts, tags, custom fields, SMS, WhatsApp and email sending, notes, mailboxes, users and reports.",
        icons,
      },
    ),
  }),
);
