import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
  query,
  record,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

const mcpUrl = "https://mcp.gocardless.com";
const apiVersion = "2015-07-06";

const gocardless = defineProvider({
  name: "GoCardless",
  hosts: ["mcp.gocardless.com", "api.gocardless.com", "api-sandbox.gocardless.com"],
  auth: {
    // Dashboard-issued access token (Developers > Create > Access token), sandbox or live.
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The MCP server publishes OAuth metadata with dynamic client registration.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, {
        url: mcpUrl,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
    }
    const response = await fetch(`${apiBase(account.fields.token)}/creditors?limit=1`, {
      signal,
      headers: restHeaders(account.fields.token),
    });
    await decodeJson(response, json());
  },
});

// Sandbox tokens are prefixed "sandbox_", live tokens "live_".
function apiBase(token: string) {
  return token.startsWith("sandbox_") ? "https://api-sandbox.gocardless.com" : "https://api.gocardless.com";
}

function restHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, "GoCardless-Version": apiVersion, Accept: "application/json" };
}

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function camel(value: string): string {
  return value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (op: Operation, path: string, search: Params, body: Params | undefined, idempotencyKey: string | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PUT";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
    ...(op.method === "POST" ? { idempotencyKey: string().optional() } : {}),
  });
  const description = `${op.description}${op.method === "GET" ? " Filters and cursor/limit go in query." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(
      op,
      path,
      (args.query as Params | undefined) ?? {},
      hasBody ? (args.body as Params | undefined) : undefined,
      args.idempotencyKey as string | undefined,
    );
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function restRouter(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const base = apiBase(token);
  const call = async (op: Operation, path: string, search: Params, body: Params | undefined, idempotencyKey: string | undefined) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (typeof value === "object") {
        // Nested filters such as created_at[gte].
        for (const [inner, innerValue] of Object.entries(value as Params)) url.searchParams.set(`${key}[${inner}]`, String(innerValue));
      } else url.searchParams.set(key, String(value));
    }
    const payload = body === undefined && op.method !== "POST" ? undefined : op.envelope ? { [op.envelope]: body ?? {} } : (body ?? {});
    const response = await fetcher(url.toString(), {
      method: op.method,
      signal,
      headers: {
        ...restHeaders(token),
        ...(payload === undefined ? {} : { "Content-Type": "application/json" }),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[camel(op.group)] ??= {})[camel(op.name)] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { gocardless: gocardless.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gocardless ?? [],
        async (account) =>
          account.method === "apiKey"
            ? withApprovals(restRouter(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined))
            : withApprovals(
                await mcpRouter({
                  url: mcpUrl,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (t) => (toolAnnotations(t)?.readOnlyHint === true ? undefined : always()),
              ),
        { signal },
      ),
      {
        title: "GoCardless",
        description: "Direct debit and bank payments: customers, mandates, payments, subscriptions, payouts, refunds, events and billing requests.",
        instructions:
          "An access token account uses the REST API (sandbox_ tokens go to the sandbox, live_ tokens to live); an OAuth account uses GoCardless's MCP server. Lists are cursor-paginated: pass after/limit in query. Create and update bodies are the resource fields; the API envelope is added for you.",
        icons,
      },
    ),
  }),
);
