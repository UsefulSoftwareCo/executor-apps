import {
  accountRouter,
  boolean,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { functions, type Arg, type Fn } from "./functions.js";

const base = "https://procfu.com/exe";

const procfu = defineProvider({
  name: "ProcFu",
  hosts: ["procfu.com"],
  auth: {
    apiKey: secrets({
      label: "Auth token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // whoami returns the email of the token's owner and changes nothing.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/whoami.pf`, {
      method: "POST",
      signal,
      headers: authorization(account.fields.token),
    });
    const text = (await response.text()).trim();
    if (response.status === 401)
      throw new Error("ProcFu rejected the auth token (HTTP 401). Copy it again from the Security & Keys page.");
    if (response.status === 403)
      throw new Error(
        "ProcFu refused the request (HTTP 403). The token may be wrong, or this server's IP address is not on the IP whitelist on the Account page of your ProcFu account.",
      );
    if (!response.ok) throw new Error(`ProcFu whoami.pf failed (HTTP ${response.status}): ${text.slice(0, 200)}`);
    // whoami.pf is documented to return the logged-in user's email address as plain text.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
      throw new Error(
        `ProcFu whoami.pf did not return an email address (check the auth token and the IP whitelist on the Account page): ${text.slice(0, 200)}`,
      );
  },
});

// The Security & Keys page shows the token the Authorization header expects; accept it with or without the scheme.
const authorization = (token: string) => ({
  Authorization: /^basic /i.test(token) ? token : `Basic ${token}`,
});

const schemaFor = (arg: Arg) =>
  arg.type === "number"
    ? number().optional()
    : arg.type === "boolean"
      ? boolean().optional()
      : arg.type === "json"
        ? json().optional()
        : string().optional();

const describe = (fn: Fn) => {
  const args = fn.args.map((a) => `${a.name} (${a.type}${a.doc === "" ? "" : `: ${a.doc}`})`).join("; ");
  return [
    `${fn.title}: ${fn.doc}`,
    args === "" ? "No arguments." : `Arguments, all sent as form fields: ${args}.`,
    fn.returns === "" ? "" : `Returns: ${fn.returns}.`,
  ]
    .filter((part) => part !== "")
    .join(" ");
};

const encode = (value: unknown) =>
  typeof value === "boolean" ? (value ? "1" : "0") : typeof value === "string" ? value : JSON.stringify(value);

const parseBody = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

type Account = { fields: { token: string } };

const tool = (account: Account, signal: AbortSignal, fn: Fn) => {
  const options = {
    description: describe(fn),
    input: object(Object.fromEntries(fn.args.map((a) => [a.name, schemaFor(a)]))),
  };
  const handler = async ({ fetch }: { fetch: typeof globalThis.fetch }, input: Record<string, unknown>) => {
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) if (value !== undefined) form.set(key, encode(value));
    const response = await fetch(`${base}/${fn.name}.pf`, {
      method: "POST",
      signal,
      headers: { ...authorization(account.fields.token), "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`ProcFu ${fn.name}.pf failed (HTTP ${response.status}): ${text.slice(0, 500)}`);
    const parsed = parseBody(text);
    return parsed === undefined ? null : parsed;
  };
  // Every function is a POST, so only functions that read or compute are queries; the rest need approval.
  return fn.kind === "query"
    ? query(options, handler as never)
    : mutation({ ...options, approval: always() }, handler as never);
};

// "podio_item_get" is mounted as podio.item_get; names without a prefix go under "general".
const group = (name: string) => (name.includes("_") ? name.slice(0, name.indexOf("_")) : "general");
const leaf = (name: string) => (name.includes("_") ? name.slice(name.indexOf("_") + 1) : name);

const descriptions: Record<string, string> = {
  podio: "Read and write Podio apps, items, comments, tasks, files, spaces, organizations and views.",
  flow: "Fetch Podio items, views and related items in the simplified GlobiFlow format.",
  pwa: "Manage Podio Workflow Automation flows, webhooks and logs.",
  notion: "Read Notion pages, blocks, tables and search.",
  google: "Google Drive and Sheets helpers.",
  var: "Per-account saved variables.",
  vars: "Per-account saved variables.",
  shared: "Variables shared across accounts.",
};

const procfuTools = (account: Account, signal: AbortSignal) => {
  const groups = new Map<string, Record<string, ReturnType<typeof tool>>>();
  for (const fn of functions) {
    const key = group(fn.name);
    const entries = groups.get(key) ?? {};
    entries[leaf(fn.name)] = tool(account, signal, fn);
    groups.set(key, entries);
  }
  return router(
    Object.fromEntries(
      [...groups].map(([key, entries]) => [
        key,
        router(entries, {
          title: key,
          description: descriptions[key] ?? `ProcFu ${key} functions.`,
        }),
      ]),
    ),
  );
};

export default defineApp({ user: { accounts: { procfu: procfu.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.procfu ?? [], (account) => procfuTools(account, signal), { signal }), {
    title: "ProcFu",
    description:
      "ProcFu's Functions API: 301 hosted functions for Podio, Podio Workflow Automation, Notion, Google, databases, storage, email and data utilities.",
    instructions:
      "Each tool calls one ProcFu function (POST https://procfu.com/exe/<function>.pf). ProcFu only accepts calls from GlobiFlow servers and IP addresses whitelisted on the Account page of the ProcFu account, so a call from an unlisted address fails until its IP is added.",
    icons,
  }),
}));
