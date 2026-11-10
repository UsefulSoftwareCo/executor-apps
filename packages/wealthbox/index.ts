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

const base = "https://api.crmworkspace.com";

type Fields = { token: string } | { access_token: string };

function authHeaders(method: string, fields: Fields): Record<string, string> {
  if (method === "oauth") return { Authorization: `Bearer ${(fields as { access_token: string }).access_token}` };
  return { ACCESS_TOKEN: (fields as { token: string }).token };
}

const wealthbox = defineProvider({
  name: "Wealthbox",
  hosts: ["api.crmworkspace.com"],
  auth: {
    // Personal access token: Wealthbox > Settings > API Access (https://app.crmworkspace.com/settings/access_tokens).
    apiKey: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Wealthbox issues OAuth client credentials on request (support@wealthbox.com); the connect page asks for the client.
    oauth: oauth2({
      authorizationUrl: "https://app.crmworkspace.com/oauth/authorize",
      tokenUrl: "https://app.crmworkspace.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["login", "data"],
    }),
  },
  async health({ account, fetch, signal }) {
    const fields = account.fields as Fields;
    const response = await fetch(`${base}/v1/me`, {
      signal,
      headers: { ...authHeaders(account.method, fields), Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ id: number(), name: string(), email: string() }));
    return { accountInfo: { externalId: String(me.id), displayName: me.name, email: me.email } };
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
  const readOnly = op.method === "GET";
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
  { user: { accounts: { wealthbox: wealthbox.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wealthbox ?? [],
        (account) =>
          withApprovals(build(account.method, account.fields as Fields, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Wealthbox",
        description:
          "Contacts, households, tasks, events, notes, opportunities, projects, workflows, comments and category lists in the Wealthbox CRM.",
        instructions:
          "Filters go in query, JSON write fields in body. Look up ids first: categories.* lists tags, stages, types and custom fields; account.listUsers lists users. Link records with linked_to: [{ id, type: \"Contact\" }]. Dates are ISO 8601 or \"yyyy-mm-dd hh:mm AM -0400\". The API allows about one request per second.",
        icons,
      },
    ),
  }),
);
