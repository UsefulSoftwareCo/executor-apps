import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
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

const base = "https://api.stormboard.com";

const stormboard = defineProvider({
  name: "Stormboard",
  hosts: ["api.stormboard.com"],
  auth: {
    // OAuth 2.0 exists but clients are registered by Stormboard support, so only API keys are offered.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/test`, {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    // decodeJson throws on non-2xx; the docs only promise a 200 (valid key) or 403, so decode no fields.
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// Idea, comment and connector references accept a numeric ID or a UUID, so they are strings.
const stringIds = new Set(["id", "idea_id", "comment_id", "connector_id"]);

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const isRead = op.method === "GET";
  const isDelete = op.method === "DELETE";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, stringIds.has(id) ? string() : number()])),
    ...(isRead || isDelete ? { query: record(json()).optional() } : { body: record(json()).optional() }),
  });
  const where = isRead || isDelete ? "Any parameters listed go in query." : "Pass the listed parameters as the JSON body.";
  const description = `${op.method} ${op.path}. ${op.description} ${where}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op.method, path, isRead || isDelete ? ((args.query as Params | undefined) ?? {}) : {}, isRead || isDelete ? undefined : (args.body as Params | undefined));
  };
  return isRead ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        "X-API-Key": token,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) {
    (groups[op.group] ??= {})[op.name] = tool(op, call);
  }
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { stormboard: stormboard.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.stormboard ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Stormboard",
        description: "Stormboard online sticky-note whiteboards: Storms, ideas, comments, votes, tags, connectors, chat, folders and templates.",
        instructions: "Idea, comment and connector ids may be numeric ids or UUIDs; pass them as strings. Storm ids are the numeric id from a Storm's share dialog (storms.list returns them). Some endpoints need a team plan and answer 401 otherwise. Rate limits are reported in RateLimit-* headers; 429 means wait.",
        icons,
      },
    ),
  }),
);
