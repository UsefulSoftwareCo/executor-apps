import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

// Stannp runs two regions with separate accounts: US/CA accounts on api-us1, EU/UK on api-eu1.
const hosts = { us: "api-us1.stannp.com", eu: "api-eu1.stannp.com" } as const;

function base(region: string): string {
  const key = region.trim().toLowerCase();
  if (key === "us" || key === "eu") return `https://${hosts[key]}/v1`;
  throw new Error(`Stannp region must be "us" (US/CA accounts) or "eu" (EU/UK accounts), got "${region}".`);
}

// The API key is the Basic username with an empty password.
function authorization(token: string) {
  return { Authorization: `Basic ${btoa(`${token}:`)}` };
}

const stannp = defineProvider({
  name: "Stannp",
  hosts: [hosts.us, hosts.eu],
  auth: {
    // The key is at the bottom of Settings > API in the Stannp dashboard.
    apiKey: secrets({
      label: "API key",
      fields: object({
        region: plain(string({ minLength: 2 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base(account.fields.region)}/accounts/balance`, {
      signal,
      headers: authorization(account.fields.token),
    });
    await decodeJson(response, object({}));
  },
});

type Params = Record<string, unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([A-Za-z_]+)\}/g)].map((match) => match[1]!);
}

function appendForm(form: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    for (const item of value) appendForm(form, `${key}[]`, item);
  } else if (typeof value === "object") {
    for (const [sub, item] of Object.entries(value)) appendForm(form, `${key}[${sub}]`, item);
  } else {
    form.append(key, typeof value === "boolean" ? (value ? "true" : "false") : String(value));
  }
}

function paramSchema(type: "s" | "n" | "b" | "j", required: boolean | undefined) {
  const schema = type === "s" ? string() : type === "n" ? number() : type === "b" ? boolean() : json();
  return required ? schema : schema.optional();
}

function resolvePath(op: Operation, args: Params): string {
  const segments: string[] = [];
  let skipped = false;
  for (const part of op.path.split("/")) {
    const match = /^\{([A-Za-z_]+)\}$/.exec(part);
    if (!match) {
      segments.push(part);
      continue;
    }
    const value = args[match[1]!];
    if (value === undefined || value === null || value === "") {
      skipped = true;
      continue;
    }
    if (skipped) throw new Error(`${match[1]} requires the preceding optional path parameter to be set.`);
    segments.push(encodeURIComponent(String(value)));
  }
  return segments.join("/");
}

function tool(op: Operation, call: (method: "GET" | "POST", path: string, fields: Params) => Promise<unknown>) {
  const ids = new Set(pathParams(op.path));
  const input = object(Object.fromEntries(op.params.map((p) => [p.name, paramSchema(p.type, p.required)])));
  const run = async (_ctx: unknown, args: Params) => {
    const fields: Params = {};
    for (const [key, value] of Object.entries(args)) if (!ids.has(key)) fields[key] = value;
    // Custom merge fields are top-level form fields in Stannp.
    if (fields.custom && typeof fields.custom === "object") {
      Object.assign(fields, fields.custom);
      delete fields.custom;
    }
    return call(op.method, resolvePath(op, args), fields);
  };
  const description = op.description;
  return op.method === "GET" || op.readOnly ? query({ description, input }, run) : mutation({ description, input }, run);
}

function rest(region: string, token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const root = base(region);
  const call = async (method: "GET" | "POST", path: string, fields: Params) => {
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(fields)) appendForm(form, key, value);
    const target = method === "GET" && form.size > 0 ? `${root}${path}?${form}` : `${root}${path}`;
    const response = await fetcher(target, {
      method,
      signal,
      headers: {
        ...authorization(token),
        ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      ...(method === "POST" ? { body: form.toString() } : {}),
    });
    return decodeJson(response, json());
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { stannp: stannp.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.stannp ?? [],
        (account) =>
          withApprovals(rest(account.fields.region, account.fields.token, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Stannp",
        description:
          "Stannp direct mail: send postcards, letters and SMS, manage recipients, groups and campaigns, validate addresses and report on delivery.",
        icons,
        instructions:
          "Use test: true on postcards.create, letters.create, letters.post and sms.create to get a sample without dispatch or charge. Mailpieces are billed to the account balance. Account region (us or eu) must match where the Stannp account lives.",
      },
    ),
  }),
);
