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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

const base = "https://acuityscheduling.com/api/v1";

type Fields = { userId: string; apiKey: string } | { access_token: string };

function authHeaders(method: string, fields: Fields): Record<string, string> {
  if (method === "oauth") return { Authorization: `Bearer ${(fields as { access_token: string }).access_token}` };
  const { userId, apiKey } = fields as { userId: string; apiKey: string };
  return { Authorization: `Basic ${btoa(`${userId}:${apiKey}`)}` };
}

const acuity = defineProvider({
  name: "Acuity Scheduling",
  hosts: ["acuityscheduling.com"],
  auth: {
    // User ID and API key: Acuity > Integrations > API (https://secure.acuityscheduling.com/app.php?key=api&action=settings).
    apiKey: secrets({
      label: "User ID and API key",
      fields: object({ userId: string({ minLength: 1 }), apiKey: string({ minLength: 1 }) }),
    }),
    // Acuity OAuth apps are registered by emailing Acuity (see the developer docs); the connect page asks for the client.
    oauth: oauth2({
      authorizationUrl: "https://acuityscheduling.com/oauth2/authorize",
      tokenUrl: "https://acuityscheduling.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["api-v1"],
    }),
  },
  async health({ account, fetch, signal }) {
    const fields = account.fields as Fields;
    const response = await fetch(`${base}/me`, {
      signal,
      headers: { ...authHeaders(account.method, fields), Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ name: string(), email: string() }));
    return { accountInfo: { externalId: me.email, displayName: me.name, email: me.email } };
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

function build(method: string, fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
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
        ...authHeaders(method, fields),
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
  { user: { accounts: { acuityscheduling: acuity.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.acuityscheduling ?? [],
        (account) =>
          withApprovals(build(account.method, account.fields as Fields, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Acuity Scheduling",
        description:
          "Appointments, appointment types, availability, calendars, clients, blocks, labels, forms, products, certificates and webhooks in Acuity Scheduling.",
        instructions:
          "To book: appointmentTypes.list, then availability.listDates and availability.listTimes, then appointments.create with the chosen datetime. Dates are ISO 8601; filters go in query, JSON write fields in body. clients.update and clients.delete identify the client by firstName, lastName and phone in query.",
        icons,
      },
    ),
  }),
);
