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
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

const url = "https://graphql.buildkite.com/v1";
const rest = "https://api.buildkite.com/v2";

const buildkite = defineProvider({
  name: "Buildkite",
  hosts: ["graphql.buildkite.com", "api.buildkite.com"],
  auth: {
    // Only API access tokens are offered; Buildkite OAuth was not checked or implemented.
    apiKey: secrets({
      label: "API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // Needs no scope; uuid is always present.
    const response = await fetch(`${rest}/access-token`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const token = await decodeJson(response, object({ uuid: string() }));
    return { accountInfo: { externalId: token.uuid, displayName: "Buildkite API token" } };
  },
});

type Params = Record<string, unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PUT" || op.method === "PATCH";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description} Path IDs are slugs, numbers or UUIDs.${hasBody ? " Pass the JSON request body as body." : ""}${op.method === "GET" ? " Pagination (page, per_page) and filters go in query." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op.method, path, (args.query as Params | undefined) ?? {}, hasBody ? (args.body as Params | undefined) : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function buildRest(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${rest}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
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
  { user: { accounts: { buildkite: buildkite.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.buildkite ?? [],
        async (account) =>
          router({
            graphql: withApprovals(
              await graphqlRouter({
                url,
                account,
                headers: { Authorization: `Bearer ${account.fields.token}` },
                cache,
                signal,
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            ),
            rest: withApprovals(buildRest(account.fields.token, fetch, signal), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          }),
        { signal },
      ),
      {
        title: "Buildkite",
        description: "Pipelines, builds, jobs, agents, clusters and more through Buildkite's REST API (rest.*) and GraphQL API (graphql.*).",
        instructions: "Use rest.* for common operations (builds, jobs, logs, artifacts, annotations, agents, clusters, queues). Use graphql.* for anything else in the GraphQL schema.",
        icons,
      },
    ),
  }),
);
