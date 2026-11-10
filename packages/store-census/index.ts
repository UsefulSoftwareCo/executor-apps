import {
  accountRouter,
  array,
  boolean,
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

const base = "https://www.storecensus.com/api/v1";

const storecensus = defineProvider({
  name: "StoreCensus",
  hosts: ["www.storecensus.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Read-only call that needs a valid key and an active subscription; 401 means a bad key or no subscription.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/apps?page=1&pageSize=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`StoreCensus rejected the API key (${response.status})`);
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST", path: string, params?: Record<string, string | number | undefined>, body?: unknown) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) if (value !== undefined) search.set(key, String(value));
    const query = search.size > 0 ? `?${search}` : "";
    const response = await fetcher(`${base}${path}${query}`, {
      method,
      signal,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

function build(call: ReturnType<typeof client>) {
  return router({
    getWebsite: query(
      {
        description:
          "Get e-commerce intelligence for one store by domain (example-store.com) or numeric lead_id. Optionally limit the response with sections: basic_info, contact_info, location_info, social_media, ecommerce_info, financial_info, traffic_analytics, technical_info, apps_integrations, activity_signals, crm, data_metadata, payments_info (Professional+), shipping_info (Professional+). Omit sections for everything.",
        input: object({ domain: string({ minLength: 1 }), sections: array(string()).optional() }),
      },
      async (_ctx, { domain, sections }) =>
        call("GET", `/website/${encodeURIComponent(domain)}`, {
          sections: sections === undefined || sections.length === 0 ? undefined : sections.join(","),
        }),
    ),
    searchStores: query(
      {
        description:
          "List Shopify and WooCommerce stores matching filters, with cursor pagination. `filters` is the vendor's filter object (country, vertical, apps, technology, traffic and 100+ others; see https://www.storecensus.com/api). `sort` is {column, direction}. `selectionLogic` is {mode: include|exclude, operator: and|or} for multi-value filters. `historicalConstraints` is an array of {attribute, value, event, dateFrom, dateTo} timing filters. pageSize is 50-500 (default 50); pass the returned cursor for the next page (cursors last 5 minutes). `sections` limits the data returned per store.",
        input: object({
          filters: record(json()).optional(),
          sort: record(json()).optional(),
          pageSize: number().optional(),
          cursor: string().optional(),
          sections: array(string()).optional(),
          selectionLogic: record(json()).optional(),
          historicalConstraints: array(record(json())).optional(),
        }),
      },
      async (_ctx, input) => call("POST", "/stores", undefined, input),
    ),
    listApps: query(
      {
        description:
          "List the Shopify app directory with ratings and categories. Filter by app_id, minRating (0-5), a search string (name, description or developer) or categoryId. page starts at 1; pageSize is 1-500 (default 100).",
        input: object({
          page: number().optional(),
          pageSize: number().optional(),
          app_id: number().optional(),
          minRating: number().optional(),
          search: string().optional(),
          categoryId: number().optional(),
        }),
      },
      async (_ctx, input) => call("GET", "/apps", input),
    ),
    listAppCategories: query(
      { description: "List the Shopify app categories that have active apps, with counts.", input: object({}) },
      async () => call("GET", "/app-categories"),
    ),
    enrichLeads: mutation(
      {
        description:
          "Get emails (with deliverability scores) and phone numbers for up to 1,000 lead_ids. Spends credits for each lead that has contact information; returns 402 when credits run out. Set decision_makers to also unlock founder/CEO-style contacts, optionally filtered by roles (founder, co-founder, ceo, cto, cfo, coo, marketing, sales, operations, product, engineering, design), capped by max_per_store (default 1), with include_fallback (default true) returning the first contacts when no role matches.",
        input: object({
          lead_ids: array(number()),
          decision_makers: boolean().optional(),
          roles: array(string()).optional(),
          max_per_store: number().optional(),
          include_fallback: boolean().optional(),
        }),
      },
      async (_ctx, input) => call("POST", "/enrich", undefined, input),
    ),
  });
}

export default defineApp(
  { user: { accounts: { storecensus: storecensus.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.storecensus ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "StoreCensus",
        description: "Look up Shopify and WooCommerce stores, filter store lists, browse Shopify apps and enrich leads with contacts.",
        icons,
      },
    ),
  }),
);
