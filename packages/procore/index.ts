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
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

const base = "https://api.procore.com";

const procore = defineProvider({
  name: "Procore",
  hosts: ["api.procore.com", "login.procore.com"],
  auth: {
    // Procore apps are created in the Developer Portal (developers.procore.com > My Apps); the connect page asks for the client.
    // Procore has no OAuth scopes: access follows the app's permission template and the user's own permissions.
    oauth: oauth2({
      authorizationUrl: "https://login.procore.com/oauth/authorize",
      tokenUrl: "https://login.procore.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/rest/v1.0/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ id: number(), login: string(), name: string() }));
    return { accountInfo: { externalId: String(me.id), username: me.login, displayName: me.name, email: me.login } };
  },
});

type Params = Record<string, unknown>;
type Call = (method: string, path: string, search: Params, body: Params | undefined, companyId: unknown) => Promise<unknown>;

// Procore company id, sent as the Procore-Company-Id header; most project-level endpoints require it.
const companyIdField = string().optional();

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-zA-Z_]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: Call) {
  const ids = pathParams(op.path);
  const hasBody = op.method !== "GET" && op.method !== "DELETE";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    companyId: companyIdField,
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description}${hasBody ? " Pass JSON fields as body." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op.method, path, (args.query as Params | undefined) ?? {}, hasBody ? ((args.body as Params | undefined) ?? {}) : undefined, args.companyId);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call: Call = async (verb, path, search, body, companyId) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(`${key}[]`, String(item));
      else url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method: verb,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(typeof companyId === "string" && companyId ? { "Procore-Company-Id": companyId } : {}),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  const request = mutation(
    {
      description:
        "Call any Procore REST endpoint not covered by the other tools. path starts with /rest/ (for example /rest/v1.0/projects/123/daily_logs). method is GET, POST, PUT, PATCH or DELETE; JSON fields go in body, filters in query.",
      input: object({
        method: string(),
        path: string(),
        companyId: companyIdField,
        query: record(json()).optional(),
        body: record(json()).optional(),
      }),
    },
    async (_ctx, args) => {
      const path = args.path.startsWith("/") ? args.path : `/${args.path}`;
      if (!path.startsWith("/rest/")) throw new Error("path must start with /rest/");
      const verb = args.method.toUpperCase();
      return call(verb, path, args.query ?? {}, verb === "GET" || verb === "DELETE" ? undefined : (args.body ?? {}), args.companyId);
    },
  );
  return router({
    ...Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])),
    raw: router({ request }),
  });
}

export default defineApp(
  { user: { accounts: { procore: procore.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.procore ?? [],
        (account) =>
          withApprovals(build(account.fields.access_token, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Procore",
        description:
          "Procore construction management: companies, projects, users, vendors, RFIs, submittals, observations, punch items, meetings, documents and commitments.",
        instructions:
          "Start with companies.list, then pass the company id as companyId (Procore-Company-Id header) on project-level calls. Many list endpoints take company_id or project_id in query. Pagination uses page and per_page in query. raw.request reaches any other /rest/ endpoint.",
        icons,
      },
    ),
  }),
);
