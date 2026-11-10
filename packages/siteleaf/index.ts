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

const base = "https://api.siteleaf.com/v2";

const siteleaf = defineProvider({
  name: "Siteleaf",
  hosts: ["api.siteleaf.com"],
  auth: {
    // Shown on the account page at https://manage.v2.siteleaf.com/account.
    apiKey: secrets({
      label: "API key and secret",
      fields: object({ key: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/me`, { signal, headers: headers(account.fields) });
    const user = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: user.id } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
type Creds = { key: string; secret: string };

function headers(creds: Creds) {
  return { Authorization: `Basic ${btoa(`${creds.key}:${creds.secret}`)}` };
}

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (op: Operation, path: string, search: Params, body: Params | undefined, file: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PUT";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    ...(op.method === "GET" ? { query: record(json()).optional() } : {}),
    ...(hasBody && !op.upload ? { body: record(json()).optional() } : {}),
    ...(op.upload ? { content: string(), filename: string().optional() } : {}),
  });
  const description = `${op.description}${hasBody && !op.upload ? " Pass the JSON request body as body." : ""}${op.method === "GET" ? " Pass query parameters as query." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) {
      // Collection paths and source names may be nested; keep their slashes.
      const value = String(args[id] ?? "").split("/").map(encodeURIComponent).join("/");
      path = path.replace(`{${id}}`, value);
    }
    if (path.endsWith("/source/")) path = path.slice(0, -1);
    const file = op.upload ? { content: String(args.content), filename: String(args.filename ?? path.split("/").pop() ?? "file") } : undefined;
    return call(op, path, (args.query as Params | undefined) ?? {}, hasBody && !op.upload ? ((args.body as Params | undefined) ?? {}) : undefined, file);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

// GET /jobs/{id} is a text/event-stream. Read it for a bounded time and return the last `data:` event.
async function readLastEvent(fetcher: Fetch, url: string, hdrs: Record<string, string>, signal: AbortSignal | undefined) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  signal?.addEventListener("abort", () => controller.abort(), { once: true });
  let text = "";
  let status = 0;
  try {
    const response = await fetcher(url, { method: "GET", headers: { ...hdrs, Accept: "text/event-stream" }, signal: controller.signal });
    status = response.status;
    const reader = response.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
    }
  } catch (error) {
    if (!controller.signal.aborted || signal?.aborted) throw error;
  } finally {
    clearTimeout(timer);
  }
  const lines = text.split("\n").filter((line) => line.startsWith("data:"));
  const last = lines.at(-1);
  if (!last) throw new Error(`Siteleaf job stream returned no events (HTTP ${status || "unknown"})`);
  return JSON.parse(last.slice(5).trim()) as unknown;
}

function rest(creds: Creds, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, path: string, search: Params, body: Params | undefined, file: Params | undefined) => {
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      target.searchParams.set(key, String(value));
    }
    let init: { body?: string | FormData; headers: Record<string, string> } = { headers: headers(creds) };
    if (file) {
      const form = new FormData();
      form.append("file", new Blob([String(file.content)]), String(file.filename));
      init = { headers: headers(creds), body: form };
    } else if (body !== undefined) {
      init = { headers: { ...headers(creds), "Content-Type": "application/json" }, body: JSON.stringify(body) };
    }
    if (op.sse) return readLastEvent(fetcher, target.toString(), init.headers, signal);
    const response = await fetcher(target.toString(), { method: op.method, signal, ...init });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { siteleaf: siteleaf.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.siteleaf ?? [],
        (account) =>
          withApprovals(rest(account.fields, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Siteleaf",
        description: "Siteleaf CMS for Jekyll sites: sites, pages, collections, documents, source files, publish jobs, users and roles.",
        icons,
      },
    ),
  }),
);
