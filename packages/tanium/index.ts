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
import { parse } from "graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

type Fields = { hostname: string; token: string };
type Params = Record<string, unknown>;

// Every Tanium server has its own host (example.cloud.tanium.com, or an on-prem FQDN). The API token only
// ever goes to that origin: every request URL is built from originOf(account hostname) in this file.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Tanium server hostname, for example example.cloud.tanium.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Tanium server must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the Tanium server hostname, with no path.");
  return url.origin;
}

const tanium = defineProvider({
  name: "Tanium",
  auth: {
    // An API token: Tanium Console > Administration > Permissions > API Tokens > New API Token.
    // Sent in the `session` header. The server host is part of the account, so the provider declares no
    // static `hosts`, so the platform does not restrict where the token can go. The restriction is in this
    // code: accountRouter only combines per-account routers, and each one sends requests solely to its own
    // account's origin (https only, no path).
    apiToken: secrets({
      label: "API token",
      fields: object({
        hostname: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.hostname);
    const response = await fetch(`${origin}/api/v2/session/current`, {
      signal,
      headers: { session: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: `${origin}`, displayName: new URL(origin).host } };
  },
});

// The Gateway cannot tell a query from a mutation on the wire, so enforce it here: only documents made of
// query operations (and fragments) may go through the unapproved tool.
function assertQueryOnly(document: string): void {
  let parsed;
  try {
    parsed = parse(document);
  } catch (error) {
    throw new Error(`Invalid GraphQL document: ${error instanceof Error ? error.message : String(error)}`);
  }
  for (const def of parsed.definitions) {
    if (def.kind === "OperationDefinition" && def.operation !== "query")
      throw new Error(`gateway.query only runs query operations; use gateway.mutate for a ${def.operation}.`);
  }
}

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-zA-Z_]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (op: Operation, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
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
    return call(op, path, (args.query as Params | undefined) ?? {}, hasBody ? ((args.body as Params | undefined) ?? {}) : undefined);
  };
  return op.method === "GET" || op.readOnly === true ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const origin = originOf(fields.hostname);
  const send = async (url: URL, init: { method: string; body?: unknown }) => {
    const response = await fetcher(url.toString(), {
      method: init.method,
      signal,
      headers: {
        session: fields.token,
        Accept: "application/json",
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  const call = (op: Operation, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${origin}/api/v2${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    return send(url, { method: op.method, body });
  };

  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);

  // Tanium Gateway: the GraphQL API of the Tanium platform (endpoints, assets, modules).
  const gatewayInput = object({ query: string({ minLength: 1 }), variables: record(json()).optional() });
  const gateway = (query_: string, variables: Params | undefined) =>
    send(new URL(`${origin}/plugin/products/gateway/graphql`), {
      method: "POST",
      body: { query: query_, ...(variables === undefined ? {} : { variables }) },
    });
  const gatewayRouter = router({
    query: query(
      {
        description:
          "Run a read-only GraphQL query against the Tanium Gateway (/plugin/products/gateway/graphql), for example endpoints { edges { node { name ipAddress } } }. Use introspection to discover the schema. Mutations and subscriptions are rejected; use gateway.mutate.",
        input: gatewayInput,
      },
      async (_ctx, args) => {
        assertQueryOnly(args.query);
        return gateway(args.query, args.variables as Params | undefined);
      },
    ),
    mutate: mutation(
      {
        description: "Run a GraphQL mutation against the Tanium Gateway. This can change live platform state.",
        input: gatewayInput,
      },
      async (_ctx, args) => gateway(args.query, args.variables as Params | undefined),
    ),
  });
  return router({
    ...Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])),
    gateway: gatewayRouter,
  });
}

export default defineApp(
  { user: { accounts: { tanium: tanium.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tanium ?? [],
        (account) =>
          withApprovals(build(account.fields, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Tanium",
        description:
          "Ask questions of endpoints, read results, manage computer groups, deploy packages as actions, and query the Gateway GraphQL API on a Tanium platform.",
        instructions:
          "Typical flow: questions.parse (text to structure), questions.create, then questions.getResults once the question has data; or read an existing saved question with savedQuestions.getResults. Asking questions and deploying actions touch live endpoints. Filters go in query, JSON write fields in body.",
        icons,
      },
    ),
  }),
);
