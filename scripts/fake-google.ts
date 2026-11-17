// Test support: runs a package in-process through the pinned `apps` host handler, with Google
// replaced by a recording HTTP server on loopback. Requests to Google's API hosts are sent to that
// server unchanged (method, path, query, headers and body bytes); any other host is refused, so a
// test never reaches the network. Accounts and tokens are synthetic. Run tests with `bun test`,
// which resolves the packages' "./x.js" imports to their .ts files.
import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { createAppHandler, hostContext, isolatedCacheSession } from "apps/host";

/** One request as the fake Google received it. */
export interface Recorded {
  readonly method: string;
  /** The Google host the app addressed. */
  readonly host: string;
  readonly path: string;
  readonly query: URLSearchParams;
  readonly contentType: string | undefined;
  readonly authorization: string | undefined;
  readonly body: Buffer;
}

/** What the fake answers a request with: a JSON value (200) or a full response. */
export type Answer = (request: Recorded) => unknown;

const googleHosts = new Set(["gmail.googleapis.com", "www.googleapis.com"]);

const read = (request: IncomingMessage) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });

/** A recording HTTP server standing in for Google, and the fetch that routes Google's hosts to it. */
const fakeGoogle = async () => {
  const requests: Recorded[] = [];
  let answer: Answer = () => ({});
  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? "/", "http://loopback");
    const recorded: Recorded = {
      method: request.method ?? "",
      host: String(request.headers["x-google-host"]),
      path: url.pathname,
      query: url.searchParams,
      contentType: request.headers["content-type"],
      authorization: request.headers.authorization,
      body: await read(request),
    };
    requests.push(recorded);
    const value = answer(recorded);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(value ?? {}));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const send = globalThis.fetch;
  const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.protocol !== "https:" || !googleHosts.has(url.hostname)) throw new Error(`fake Google refused ${url.origin}`);
    const headers = new Headers(request.headers);
    headers.set("x-google-host", url.hostname);
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
    return send(`http://127.0.0.1:${port}${url.pathname}${url.search}`, { method: request.method, headers, body });
  };
  return {
    requests,
    fetch,
    answer: (next: Answer) => {
      answer = next;
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
};

/** A host cache kept in memory for one test process. */
const memoryCache = () => {
  const store = new Map<string, unknown>();
  const reply = (command: any): unknown => {
    switch (command.operation) {
      case "read":
        return command.keys.map((key: string) => store.get(key) ?? null);
      case "acquire":
        return { entry: store.get(command.key) ?? null, lease: "lease", reads: (command.reads ?? []).map((key: string) => store.get(key) ?? null) };
      case "claim":
        return "lease";
      case "publish":
        store.set(command.key, command.entry);
        return true;
      case "write":
        for (const entry of command.entries) store.set(entry.key, entry.entry);
        return null;
      case "invalidate":
        store.delete(command.key);
        return null;
      default:
        return null;
    }
  };
  return isolatedCacheSession(async (command) => ({ ok: true, value: reply(command) })).cache;
};

export const accountId = "acc_test1";
export const token = "synthetic-token";

/** A host result: `{ ok: true, value }` or `{ ok: false, error: { _tag, ... } }`. */
export type Result = { readonly ok: true; readonly value: any } | { readonly ok: false; readonly error: { readonly _tag: string } & Record<string, unknown> };

/**
 * Loads `packages/<name>` as the host does, with one synthetic account in each of its user
 * slots, and answers Google from a recording server. `call` runs a tool; with `approve` the host
 * passes the exact-call approval a user would have given.
 */
export const hostPackage = async (name: string) => {
  const app = (await import(new URL(`../packages/${name}/index.ts`, import.meta.url).href)).default;
  const handler = createAppHandler(app);
  const google = await fakeGoogle();
  const realFetch = globalThis.fetch;
  globalThis.fetch = Object.assign(google.fetch, { preconnect: () => {} }) as typeof fetch;
  const cache = memoryCache();
  const post = async (command: unknown, context: unknown): Promise<Result> =>
    (await handler(new Request("http://app.invalid/", { method: "POST", body: JSON.stringify(command) }), context as never)).json();
  const declared = await post({ operation: "requirements" }, hostContext({ app: {}, user: {} } as never));
  assert.ok(declared.ok, "requirements failed");
  const user = Object.fromEntries(
    Object.entries(declared.value.accounts.user as Record<string, { definition: unknown }>).map(([slot, { definition }]) => [
      slot,
      [{ id: accountId, provider: definition, method: "oauth", fields: { access_token: token } }],
    ]),
  );
  const context = { ...hostContext({ app: {}, user } as never), cache };
  return {
    requests: google.requests,
    answer: google.answer,
    /** Every tool's name and whether it only reads. */
    tools: async (): Promise<readonly { name: string; readOnly: boolean }[]> => {
      const listed = await post({ operation: "inspect", detail: "summary" }, context);
      assert.ok(listed.ok, "inspect failed");
      return listed.value.tools;
    },
    call: (tool: string, input: unknown, options: { approve?: boolean } = {}) =>
      post({ operation: "call", tool, input }, options.approve ? { ...context, approval: { tool, input } } : context),
    close: async () => {
      globalThis.fetch = realFetch;
      await google.close();
    },
  };
};

export type Host = Awaited<ReturnType<typeof hostPackage>>;
