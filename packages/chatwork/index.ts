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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

const base = "https://api.chatwork.com/v2";

type Fields = { token: string } | { access_token: string };

function authHeaders(method: string, fields: Fields): Record<string, string> {
  return method === "oauth"
    ? { Authorization: `Bearer ${(fields as { access_token: string }).access_token}` }
    : { "X-ChatWorkToken": (fields as { token: string }).token };
}

const chatwork = defineProvider({
  name: "Chatwork",
  hosts: ["api.chatwork.com", "www.chatwork.com", "oauth.chatwork.com"],
  auth: {
    // Personal API token: Chatwork > profile menu > Service integration > API.
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Chatwork OAuth clients are created at
    // https://www.chatwork.com/service/packages/chatwork/subpackages/oauth/client_create.php
    oauth: oauth2({
      authorizationUrl: "https://www.chatwork.com/packages/oauth2/login.php",
      tokenUrl: "https://oauth.chatwork.com/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["users.all:read", "rooms.all:read_write", "contacts.all:read_write", "offline_access"],
    }),
  },
  async health({ account, fetch, signal }) {
    const fields = account.fields as Fields;
    const response = await fetch(`${base}/me`, {
      signal,
      headers: { ...authHeaders(account.method, fields), Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ account_id: number(), name: string() }));
    return { accountInfo: { externalId: String(me.account_id), displayName: me.name } };
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
  const hasBody = op.method !== "GET";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    ...(op.method === "GET" ? { query: record(json()).optional() } : {}),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description}${hasBody ? " Pass the form fields as body." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op.method, path, (args.query as Params | undefined) ?? {}, hasBody ? ((args.body as Params | undefined) ?? {}) : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function camel(value: string): string {
  return value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function build(method: string, fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (verb: string, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(body ?? {})) {
      if (value === undefined || value === null) continue;
      form.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    const response = await fetcher(url.toString(), {
      method: verb,
      signal,
      headers: {
        ...authHeaders(method, fields),
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/x-www-form-urlencoded" }),
      },
      ...(body === undefined ? {} : { body: form.toString() }),
    });
    // Chatwork answers some successful calls (empty lists, marking read) with 204 and no body.
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[camel(op.group)] ??= {})[camel(op.name)] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { chatwork: chatwork.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.chatwork ?? [],
        (account) =>
          withApprovals(build(account.method, account.fields as Fields, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Chatwork",
        description: "Chats, messages, tasks, files, members, invite links and contacts in Chatwork.",
        instructions:
          "Call rooms.list to find room_id values. Message bodies use Chatwork notation ([To:account_id], [rp aid=.. to=..], [info]...). Write fields go in body as plain key/value pairs; lists of account ids are comma-separated strings. rooms.updateMembers replaces the entire member list.",
        icons,
      },
    ),
  }),
);
