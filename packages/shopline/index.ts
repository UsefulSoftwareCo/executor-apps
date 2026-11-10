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
  type AppContext,
  type RouterChild,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { apiVersion, endpoints, type EndpointRow } from "./endpoints.js";

// Every SHOPLINE store lives on its own host: https://<handle>.myshopline.com.
function normalizeHandle(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*)(?:\.myshopline\.com)?(?:\/.*)?$/.exec(raw.trim().toLowerCase());
  if (match === null) throw new Error("Enter the store handle: the <handle> of <handle>.myshopline.com.");
  return match[1]!;
}

const shopline = defineProvider({
  name: "SHOPLINE",
  hosts: ["*.myshopline.com"],
  auth: {
    // The Admin API access token issued when an app is authorized for a store (Partner Portal custom/private app).
    // SHOPLINE's OAuth flow signs every token request with the app secret and uses non-standard parameters, so only the token is offered.
    apiKey: secrets({
      label: "Admin API access token",
      fields: object({
        handle: plain(string({ minLength: 1 })),
        accessToken: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const handle = normalizeHandle(account.fields.handle);
    const response = await fetch(`https://${handle}.myshopline.com/admin/openapi/${apiVersion}/merchants/shop.json`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.accessToken}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: handle, displayName: `${handle}.myshopline.com` } };
  },
});

type Params = Record<string, unknown>;

const filters = record(json()).optional();
const payload = record(json());

function client(handle: string, token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const origin = `https://${normalizeHandle(handle)}.myshopline.com`;
  return async (row: EndpointRow, input: Params) => {
    const [, , , , method, template] = row;
    const path = template.replace(/:([a-z_]+)/g, (_, name: string) => encodeURIComponent(String(input[name])));
    const url = new URL(`${origin}/admin/openapi/${apiVersion}${path}`);
    for (const [key, value] of Object.entries((input.query as Params | undefined) ?? {})) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const body = input.body as Params | undefined;
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json; charset=utf-8" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

function tool(call: ReturnType<typeof client>, row: EndpointRow) {
  const [, , , kind, method, path, scope, description] = row;
  const ids = [...path.matchAll(/:([a-z_]+)/g)].map((m) => m[1]!);
  const hasBody = method === "POST" || method === "PUT" || method === "PATCH";
  const text = `${description}${scope === "" ? "" : ` Requires the ${scope} access scope.`} ${method} ${path.replace(/:([a-z_]+)/g, "{$1}")}. Pagination: pass the page_info token from the response link header in query.`;
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    query: filters,
    ...(hasBody ? { body: payload } : {}),
  });
  const run = async (_ctx: unknown, args: Params) => call(row, args);
  return kind === "q" ? query({ description: text, input }, run) : mutation({ description: text, input }, run);
}

const titles: Record<string, string> = {
  access: "Access tokens",
  appOpenApi: "App APIs",
  customer: "Customers",
  marketing: "Marketing",
  metaobjects: "Metaobjects",
  order: "Orders",
  onlineStore: "Online store",
  product: "Products",
  salesChannels: "Sales channels",
  shoplineMetafields: "Metafields",
  shoplinePayments: "SHOPLINE Payments",
  store: "Store",
  webhook: "Webhooks",
};

const humanize = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

function build(call: ReturnType<typeof client>) {
  const families = new Map<string, Map<string, Record<string, ReturnType<typeof tool>>>>();
  for (const row of endpoints) {
    const [family, group, key] = row;
    const groups = families.get(family) ?? new Map<string, Record<string, ReturnType<typeof tool>>>();
    families.set(family, groups);
    const tools = groups.get(group) ?? {};
    groups.set(group, tools);
    tools[key] = tool(call, row);
  }
  const out: Record<string, RouterChild<AppContext, AppContext>> = {};
  for (const [family, groups] of families) {
    const title = titles[family] ?? humanize(family);
    const children: Record<string, RouterChild<AppContext, AppContext>> = {};
    for (const [group, tools] of groups) {
      if (group === "_") Object.assign(children, tools);
      else children[group] = router(tools, { title: humanize(group), description: `${title}: ${humanize(group).toLowerCase()}.` });
    }
    out[family] = router(children, {
      title,
      description: `SHOPLINE Admin REST API: ${title.toLowerCase()}.`,
    });
  }
  return router(out);
}

export default defineApp(
  { user: { accounts: { shopline: shopline.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shopline ?? [],
        (account) =>
          withApprovals(build(client(account.fields.handle, account.fields.accessToken, fetch, signal)), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SHOPLINE",
        description:
          "SHOPLINE e-commerce stores: products, variants, collections, inventory, orders, fulfillments, returns, customers, discounts, marketing events, online store content, metafields and webhooks.",
        instructions:
          "Every tool takes the path ids it needs as strings, an optional `query` object for filters, and for writes a JSON `body` following the SHOPLINE Admin REST API reference. List endpoints are cursor-paged: pass the page_info token from the response link header as query.page_info. Tokens only work for the access scopes the store granted the app.",
        icons,
      },
    ),
  }),
);
