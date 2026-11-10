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

const base = "https://api.unisender.com/en/api";

const unisender = defineProvider({
  name: "Unisender",
  hosts: ["api.unisender.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/getLists?format=json`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ api_key: account.fields.token }).toString(),
    });
    // Unisender answers bad keys with HTTP 200 and an `error` field.
    const body = (await decodeJson(response, json())) as { error?: unknown };
    if (body.error !== undefined) throw new Error(`Unisender rejected the API key: ${String(body.error)}`);
  },
});

// Unisender's array syntax: nested values become name[0], name[key], name[0][1].
function flatten(out: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) value.forEach((item, index) => flatten(out, `${key}[${index}]`, item));
  else if (typeof value === "object") for (const [k, v] of Object.entries(value)) flatten(out, `${key}[${k}]`, v);
  else out.append(key, String(value));
}

function tool(op: Operation, call: (name: string, params: Record<string, unknown>) => Promise<unknown>) {
  const options = {
    description: op.description,
    input: object({ params: record(json()).optional() }),
  };
  const run = async (_ctx: unknown, args: { params?: Record<string, unknown> }) => call(op.path ?? op.name, args.params ?? {});
  return op.write ? mutation(options, run) : query(options, run);
}

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (path: string, params: Record<string, unknown>) => {
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) flatten(body, key, value);
    body.set("api_key", token);
    body.set("format", "json");
    const response = await fetcher(`${base}/${path}`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const result = (await decodeJson(response, json())) as { error?: unknown; code?: unknown };
    if (result.error !== undefined) throw new Error(`Unisender ${path} failed (${String(result.code)}): ${String(result.error)}`);
    return result;
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { unisender: unisender.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.unisender ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Unisender",
        description: "Unisender email and SMS marketing: contact lists, contacts, messages, campaigns, templates, custom fields, tags, notes and statistics.",
        instructions: "Every tool takes one `params` object holding the method's documented arguments (https://www.unisender.com/ru/support/api/). Arrays and objects are sent in Unisender's array syntax automatically. Typical flow: contacts.getLists, contacts.importContacts, messages.createEmailMessage (or createSmsMessage), messages.createCampaign, statistics.getCampaignCommonStats.",
        icons,
      },
    ),
  }),
);
