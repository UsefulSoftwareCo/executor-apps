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

const base = "https://api.crawlbase.com";

const crawlbase = defineProvider({
  name: "Crawlbase",
  hosts: ["api.crawlbase.com"],
  auth: {
    // Both tokens are on the Crawlbase account dashboard (https://crawlbase.com/console, with a Reset token button); the JavaScript token is optional.
    apiKey: secrets({
      label: "Crawlbase tokens",
      fields: object({ token: string({ minLength: 1 }), jsToken: string().optional() }),
    }),
  },
  // Cloud Storage count is free and has no rate limit, unlike the account endpoint.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/storage/total_count?token=${encodeURIComponent(account.fields.token)}`, { signal });
    await decodeJson(response, object({ totalCount: number() }));
  },
});

type Params = Record<string, unknown>;
type Tokens = { token: string; jsToken?: string | undefined };

function tool(op: Operation, call: (op: Operation, input: Params) => Promise<unknown>) {
  const input = object({ params: record(json()).optional() });
  const run = async (_ctx: unknown, args: Params) => call(op, (args.params as Params | undefined) ?? {});
  const spec = { description: op.description, input };
  return op.kind === "query" ? query(spec, run) : mutation(spec, run);
}

function rest(tokens: Tokens, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, input: Params) => {
    const missing = (op.required ?? []).filter((key) => input[key] === undefined);
    if (missing.length > 0) throw new Error(`Missing required field(s) in params: ${missing.join(", ")}`);
    const rest = { ...input };
    let token = tokens.token;
    if (op.auth === "crawl") {
      if (rest.token_type === "javascript") {
        if (op.method !== "GET") throw new Error(`crawl.${op.name} works with the Normal token only; the JavaScript token is GET-only`);
        if (tokens.jsToken === undefined) throw new Error("This account has no JavaScript token configured");
        token = tokens.jsToken;
      }
      delete rest.token_type;
    }
    let path = op.path.replace("{token}", encodeURIComponent(token));
    for (const key of ["crawler", "rid"]) {
      if (path.includes(`{${key}}`)) {
        path = path.replace(`{${key}}`, encodeURIComponent(String(rest[key])));
        delete rest[key];
      }
    }
    const target = new URL(`${base}${path}`);
    if (op.auth !== "path") target.searchParams.set("token", token);
    if (op.name === "pushToCrawler") target.searchParams.set("callback", "true");
    // Crawler deleteJob takes the rid in the query string of a POST with no body.
    if (op.name === "deleteJob") {
      target.searchParams.set("rid", String(rest.rid));
      delete rest.rid;
    }
    // Where the remaining params travel: query string for GET/DELETE and for crawl requests; JSON body otherwise.
    const inQuery = op.method === "GET" || op.method === "DELETE" || op.auth === "crawl" || op.name === "deleteJob";
    let body: string | undefined;
    const headers: Record<string, string> = {};
    if (op.group === "crawl" && (op.method === "POST" || op.method === "PUT")) {
      body = rest.body === undefined ? undefined : String(rest.body);
      delete rest.body;
      if (typeof rest.post_content_type === "string") headers["Content-Type"] = rest.post_content_type;
    } else if (!inQuery) {
      body = JSON.stringify(rest);
      headers["Content-Type"] = "application/json";
    }
    if (inQuery || (op.group === "crawl" && body !== undefined)) {
      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
      }
    }
    const response = await fetcher(target.toString(), { method: op.method, signal, headers, ...(body === undefined ? {} : { body }) });
    const text = await response.text();
    if (op.group === "crawl" && op.name !== "pushToCrawler") {
      const pick = ["cb_status", "pc_status", "original_status", "url", "rid", "screenshot_url", "storage_url", "domain_complexity", "content-type"];
      const meta: Record<string, string> = {};
      for (const name of pick) {
        const value = response.headers.get(name);
        if (value !== null) meta[name] = value;
      }
      return { httpStatus: response.status, headers: meta, body: text };
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { httpStatus: response.status, body: text };
    }
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { crawlbase: crawlbase.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.crawlbase ?? [],
        (account) =>
          withApprovals(rest(account.fields, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Crawlbase",
        description:
          "Crawl web pages with Crawlbase: proxy-backed fetching with JavaScript rendering, screenshots and Markdown output, Cloud Storage, account usage and Enterprise Crawler queues.",
        icons,
      },
    ),
  }),
);
