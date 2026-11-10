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
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

const hostnames = ["app.workramp.com", "app.eu.workramp.com"];

const workramp = defineProvider({
  name: "WorkRamp",
  hosts: hostnames,
  auth: {
    // Keys are generated in the WorkRamp admin settings and sent as a Bearer token.
    apiKey: secrets({
      label: "API key",
      fields: object({
        token: string({ minLength: 1 }),
        // app.workramp.com for US accounts, app.eu.workramp.com for EU accounts.
        hostname: string({ minLength: 1 }).default("app.workramp.com"),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${baseUrl(account.fields.hostname)}/users?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function baseUrl(hostname: string): string {
  if (!hostnames.includes(hostname)) throw new Error(`hostname must be one of ${hostnames.join(", ")}`);
  return `https://${hostname}/api/v1`;
}

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method !== "GET";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description}${hasBody ? " Pass the JSON request body as body." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op.method, path, (args.query as Params | undefined) ?? {}, hasBody ? (args.body as Params | undefined) : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function rest(account: { fields: { token: string; hostname: string } }, fetcher: Fetch, signal: AbortSignal | undefined) {
  const base = baseUrl(account.fields.hostname);
  const call = async (method: string, path: string, search: Params, body: Params | undefined) => {
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
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
  { user: { accounts: { workramp: workramp.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.workramp ?? [],
        (account) =>
          withApprovals(rest(account, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "WorkRamp",
        description:
          "WorkRamp (Confirm) learning platform: users, groups, guides, training series, SCORM, events, webhooks, and Academy contacts, registrations, paths and certifications.",
        icons,
      },
    ),
  }),
);
