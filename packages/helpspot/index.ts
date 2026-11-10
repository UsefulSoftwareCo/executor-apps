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
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

// HelpSpot is self-hosted (or HelpSpot-hosted on a customer domain), so the install URL is part of
// the account. The provider declares no `hosts`: install domains are arbitrary and the framework
// only accepts static host lists. Tool calls only ever go to the account's own origin.
function installUrl(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your HelpSpot URL, for example https://help.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The HelpSpot URL must use https.");
  if (url.search !== "" || url.hash !== "") throw new Error("The HelpSpot URL must not include a query or fragment.");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

type Account =
  | { method: "token"; fields: { url: string; token: string } }
  | { method: "password"; fields: { url: string; email: string; password: string } };

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function authorization(account: Account): string {
  return account.method === "token"
    ? `Bearer ${account.fields.token}`
    : `Basic ${toBase64(new TextEncoder().encode(`${account.fields.email}:${account.fields.password}`))}`;
}

const helpspot = defineProvider({
  name: "HelpSpot",
  auth: {
    // Tokens are created by each staff member in the staff preferences area of their HelpSpot profile and carry that
    // user's rights. They are the only option with SAML2 or two-factor authentication.
    token: secrets({
      label: "API token",
      fields: object({ url: plain(string({ minLength: 1 })), token: string({ minLength: 1 }) }),
    }),
    // HTTP Basic with a staff login. Unavailable under SAML2 or two-factor authentication.
    password: secrets({
      label: "Staff email and password",
      fields: object({
        url: plain(string({ minLength: 1 })),
        email: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = installUrl(account.fields.url);
    const response = await fetch(`${base}/api/index.php?method=private.user.preferences&output=json`, {
      signal,
      headers: { Authorization: authorization(account), Accept: "application/json" },
    });
    // Only proves a 2xx JSON body from the preferences endpoint; no fields are decoded because the
    // response shape is unverified without a live instance.
    await decodeJson(response, json());
    return { accountInfo: { externalId: base, displayName: new URL(base).host } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function tool(op: Operation, call: (op: Operation, params: Params) => Promise<unknown>) {
  const parts = [op.description];
  if (op.required?.length) parts.push(`Required params: ${op.required.join(", ")}.`);
  if (op.optional?.length) parts.push(`Optional params: ${op.optional.join(", ")}.`);
  parts.push("Pass them in params using HelpSpot's own names (see the HelpSpot web service API manual).");
  const input = object({ params: record(json()).optional() });
  const run = async (_ctx: unknown, args: { params?: Params }) => call(op, args.params ?? {});
  const description = parts.join(" ");
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  const base = installUrl(account.fields.url);
  const call = async (op: Operation, params: Params) => {
    const missing = (op.required ?? []).filter((name) => params[name] === undefined || params[name] === null);
    if (missing.length > 0) throw new Error(`${op.api} needs: ${missing.join(", ")}`);
    const search = new URLSearchParams();
    const add = (target: URLSearchParams) => {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || key === "method" || key === "output") continue;
        if (Array.isArray(value)) for (const item of value) target.append(`${key}[]`, String(item));
        else target.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
      }
    };
    search.set("method", op.api);
    const isDocument = op.api === "private.document.get";
    if (!isDocument) search.set("output", "json");
    const url = new URL(`${base}/api/index.php`);
    const headers: Record<string, string> = { Authorization: authorization(account), Accept: "application/json" };
    let body: string | undefined;
    if (op.method === "GET") {
      add(search);
    } else {
      const form = new URLSearchParams();
      add(form);
      body = form.toString();
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }
    url.search = search.toString();
    const response = await fetcher(url.toString(), {
      method: op.method,
      signal,
      headers,
      ...(body === undefined ? {} : { body }),
    });
    if (isDocument) {
      // Attachments are usually binary: return JSON bodies parsed, anything else as base64.
      const contentType = response.headers.get("content-type") ?? "application/octet-stream";
      if (!response.ok) throw new Error(`HelpSpot document.get failed with HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
      if (/json/i.test(contentType)) return JSON.parse(await response.text());
      return { contentType, encoding: "base64", data: toBase64(new Uint8Array(await response.arrayBuffer())) };
    }
    return decodeJson(response, json());
  };

  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { helpspot: helpspot.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.helpspot ?? [],
        (account) =>
          withApprovals(build(account as Account, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "HelpSpot",
        description:
          "Help desk requests, notes, time tracking, filters, canned responses, staff and address book in HelpSpot's private web service API.",
        instructions:
          "Every tool takes a params object using HelpSpot's own parameter names. Results depend on the rights of the staff member who owns the credentials. The private API must be enabled under Admin > Settings > Web Services API.",
        icons,
      },
    ),
  }),
);
