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
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { rows } from "./rows.js";
import type { Param } from "./rows.js";

const origin = "https://inventory.dearsystems.com/ExternalApi/v2";

type Account = { fields: { accountId: string; applicationKey: string } };

const headers = (account: Account) => ({
  "api-auth-accountid": account.fields.accountId,
  "api-auth-applicationkey": account.fields.applicationKey,
  Accept: "application/json",
});

const cin7 = defineProvider({
  name: "Cin7 Core",
  hosts: ["inventory.dearsystems.com"],
  auth: {
    // Created in Cin7 Core under Integrations > API: an Account ID plus an API Application Key.
    apiKey: secrets({
      label: "API application",
      fields: object({
        accountId: plain(string({ minLength: 1 })),
        applicationKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/me`, { signal, headers: headers(account) });
    // The company name is always present on /me.
    await decodeJson(response, object({ Company: string() }));
  },
});

type Account2 = Account;

function schemaFor(params: Param[], hasBody: boolean) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of params) {
    const base: Schema<unknown, boolean> = type === "number" ? number() : type === "boolean" ? boolean() : string();
    shape[name] = required ? base : base.optional();
  }
  if (hasBody) shape.body = json();
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(title: string, method: string, path: string, params: Param[], hasBody: boolean): string {
  const lines = params.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""}): query parameter`);
  if (hasBody) lines.push("- body (json, required): the request payload with the fields documented at https://dearinventory.docs.apiary.io");
  const verb = { GET: "Read", POST: "Create or run", PUT: "Update or run", DELETE: "Delete" }[method];
  const head = `${verb}: ${title} (${method} ${path}).`;
  return lines.length === 0 ? head : `${head}\n\nParameters:\n${lines.join("\n")}`;
}

function build(account: Account2, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, title, params, hasBody] of rows) {
    const options = { description: describe(title, method, path, params, hasBody), input: schemaFor(params, hasBody) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => {
      const search = new URLSearchParams();
      for (const [name] of params) {
        const value = input[name];
        if (value !== undefined && value !== null) search.set(name, String(value));
      }
      const response = await fetcher(`${origin}${path}${search.size > 0 ? `?${search.toString()}` : ""}`, {
        method,
        signal,
        headers: { ...headers(account), ...(hasBody ? { "Content-Type": "application/json" } : {}) },
        body: hasBody ? JSON.stringify(input.body ?? {}) : undefined,
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Cin7 Core answered ${response.status}: ${text.slice(0, 1000)}`);
      return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
    };
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { cin7: cin7.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cin7 ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Cin7 Core",
        description:
          "Cin7 Core (formerly DEAR Inventory): products, customers, suppliers, sales, purchases, stock, production, accounting references, CRM and webhooks.",
        instructions:
          "Lists take Page (from 1) and Limit (default 100, max 1000). Query parameters keep the capitalization Cin7 documents (Page, Limit, ID, Name, ModifiedSince). Write tools take body as the JSON the Cin7 Core API V2 documents. Sales, purchases and stock tasks are built from a header record plus tasks (quote, order, fulfilment, invoice, payment); each task has its own tool group.",
        icons,
      },
    ),
  }),
);
