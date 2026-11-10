import {
  accountRouter,
  base64,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  number,
  json,
  mutation,
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

// Every ConnectSecure tenant lives on a numbered pod (pod123.myconnectsecure.com) that serves its own API.
const podUrl = (raw: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9-]+\.myconnectsecure\.com)\/?$/.exec(raw.trim().toLowerCase());
  if (match === null) throw new Error("Enter your pod host, for example pod123.myconnectsecure.com (Profile > API Documentation in the portal).");
  return `https://${match[1]}`;
};

const Authorized = object({ data: object({ access_token: string(), user_id: string() }) });

const connectsecure = defineProvider({
  name: "ConnectSecure",
  hosts: ["*.myconnectsecure.com"],
  auth: {
    // ConnectSecure has no OAuth: an API key is a client id and secret that a tenant user generates.
    // POST /w/authorize trades base64(tenant+clientId:clientSecret) for a short-lived bearer token.
    apiKey: secrets({
      label: "Client ID and secret",
      fields: object({
        pod: plain(string({ minLength: 1 })),
        tenant: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
      request: ({ tenant, clientId, clientSecret }) =>
        header("client-auth-token", base64(t`${tenant}+${clientId}:${clientSecret}`)),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = podUrl(account.fields.pod);
    const response = await fetch(`${base}/w/authorize`, {
      method: "POST",
      signal,
      headers: { ...account.headers(), accept: "application/json" },
    });
    await decodeJson(response, Authorized);
    return {
      accountInfo: {
        externalId: `${new URL(base).host}/${account.fields.tenant}`,
        displayName: `${account.fields.tenant} (${new URL(base).host})`,
      },
    };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
type Session = { token: string; userId: string; expires: number };

// Tokens last at most two hours and the API allows 300 requests a minute, so reuse one per account.
const sessions = new Map<string, Session>();
const lifetimeMs = 90 * 60 * 1000;

async function authorize(
  key: string,
  base: string,
  headers: Record<string, string>,
  fetcher: Fetch,
  signal: AbortSignal | undefined,
  force: boolean,
): Promise<Session> {
  const cached = sessions.get(key);
  if (!force && cached !== undefined && cached.expires > Date.now()) return cached;
  const response = await fetcher(`${base}/w/authorize`, {
    method: "POST",
    signal,
    headers: { ...headers, accept: "application/json" },
  });
  const { data } = await decodeJson(response, Authorized);
  const session = { token: data.access_token, userId: data.user_id, expires: Date.now() + lifetimeMs };
  sessions.set(key, session);
  return session;
}

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (op: Operation, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PATCH";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    ...(op.list
      ? {
          condition: string().optional(),
          skip: number().optional(),
          limit: number().optional(),
          order_by: string().optional(),
        }
      : {}),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const notes = [
    op.list ? "Page with skip and limit; condition is a SQL-like filter string and order_by a sort expression." : "",
    hasBody ? "Pass the JSON request body as body (see the ConnectSecure API reference)." : "",
    "Other query parameters go in query.",
  ].filter((text) => text !== "");
  const description = `${op.description} ${notes.join(" ")}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    const search: Params = { ...((args.query as Params | undefined) ?? {}) };
    for (const key of ["condition", "skip", "limit", "order_by"]) if (args[key] !== undefined) search[key] = args[key];
    return call(op, path, search, hasBody ? (args.body as Params | undefined) : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(
  key: string,
  base: string,
  headers: () => Record<string, string>,
  fetcher: Fetch,
  signal: AbortSignal | undefined,
) {
  const call = async (op: Operation, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${base}${path}`);
    for (const [name, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(name, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const send = async (force: boolean) => {
      const session = await authorize(key, base, headers(), fetcher, signal, force);
      return fetcher(url.toString(), {
        method: op.method,
        signal,
        headers: {
          accept: "application/json",
          authorization: `Bearer ${session.token}`,
          "x-user-id": session.userId,
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    };
    let response = await send(false);
    if (response.status === 401) response = await send(true);
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { connectsecure: connectsecure.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.connectsecure ?? [],
        (account) =>
          withApprovals(
            build(String(account.id), podUrl(account.fields.pod), () => account.headers(), fetch, signal),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "ConnectSecure",
        description:
          "ConnectSecure vulnerability and compliance management for MSPs: companies, agents, assets, vulnerabilities, patches, reports, compliance, Active Directory, attack surface and external scans.",
        instructions:
          "Reads live under /r, writes under /w and deletes under /d on the account's pod. Lists page with skip and limit (use condition for SQL-like filters, for example \"name like 'acme%'\"). Many reports sit under reportQueries. The API allows 300 requests a minute, 2,000 an hour and 30,000 a day.",
        icons,
      },
    ),
  }),
);
