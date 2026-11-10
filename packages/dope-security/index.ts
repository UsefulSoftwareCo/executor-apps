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
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

const base = "https://api.flightdeck.dope.security/v1";

const dope = defineProvider({
  name: "dope.security",
  hosts: ["api.flightdeck.dope.security"],
  auth: {
    // Client ID and secret are created by an admin in the dope console (Settings > API Client Credentials).
    // Flightdeck takes the JSON client-credentials request and ignores scopes.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.flightdeck.dope.security/v1/partner/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/policies?first=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: "dope-security", displayName: "dope.security Flightdeck" } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function tool(op: Operation, call: (op: Operation, args: Params) => Promise<unknown>) {
  const params = op.params ?? [];
  const input = object({
    ...Object.fromEntries(params.map((name) => [name, string()])),
    ...(op.method === "GET" ? { query: record(json()).optional() } : {}),
    ...(op.body === true ? { body: record(json()) } : {}),
  });
  const run = async (_ctx: unknown, args: Params) => call(op, args);
  return op.method === "GET" ? query({ description: op.description, input }, run) : mutation({ description: op.description, input }, run);
}

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, args: Params) => {
    let path = op.path;
    for (const name of op.params ?? []) path = path.replace(`{${name}}`, encodeURIComponent(String(args[name])));
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries((args.query as Params | undefined) ?? {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    const body = op.body === true ? (args.body as Params) : undefined;
    const response = await fetcher(url.toString(), {
      method: op.method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };

  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { dope: dope.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dope ?? [],
        (account) =>
          withApprovals(build(account.fields.access_token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "dope.security",
        description: "Manage dope.security Flightdeck: endpoints, policies, category restrictions and exceptions, assignments, URL and application bypass, SSL inspection, and custom URL categories.",
        instructions: "Lists are cursor-paginated: pass query.first and query.after (the previous pageInfo.endCursor). Write bodies wrap their payload in a data object, except policy assignments. The Base Policy is named in the API like any other policy.",
        icons,
      },
    ),
  }),
);
