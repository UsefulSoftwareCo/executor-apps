import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
  query,
  record,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.chartmogul.com";
const api = "https://api.chartmogul.com/v1";

// ChartMogul REST auth: HTTP Basic with the API key as username and an empty password.
const basic = (token: string) => `Basic ${btoa(`${token}:`)}`;

type Params = Record<string, unknown>;
type Op = { method: "GET" | "POST" | "PATCH" | "DELETE"; path: string; description: string };

const ops: Record<string, Op> = {
  account: { method: "GET", path: "/account", description: "Retrieve the ChartMogul account details (name, currency, time zone)." },
  dataSourcesList: { method: "GET", path: "/data_sources", description: "List data sources." },
  plansList: { method: "GET", path: "/plans", description: "List plans. Filter with query: data_source_uuid, external_id, system; paginate with page and per_page." },
  plansGet: { method: "GET", path: "/plans/{uuid}", description: "Retrieve a plan by UUID." },
  planGroupsList: { method: "GET", path: "/plan_groups", description: "List plan groups." },
  customersList: { method: "GET", path: "/customers", description: "List customers. Filter with query: data_source_uuid, external_id, status, system; paginate with page and per_page." },
  customersSearch: { method: "GET", path: "/customers/search", description: "Search customers by email. Pass query.email." },
  customersGet: { method: "GET", path: "/customers/{uuid}", description: "Retrieve a customer by UUID." },
  customersCreate: { method: "POST", path: "/customers", description: "Create a customer. Pass the JSON body (data_source_uuid, external_id, name, email, ...)." },
  customersUpdate: { method: "PATCH", path: "/customers/{uuid}", description: "Update a customer. Pass the fields to change as body." },
  customersDelete: { method: "DELETE", path: "/customers/{uuid}", description: "Delete a customer and its subscriptions and invoices." },
  customersSubscriptions: { method: "GET", path: "/customers/{uuid}/subscriptions", description: "List a customer's subscriptions." },
  customersActivities: { method: "GET", path: "/customers/{uuid}/activities", description: "List a customer's MRR movement activities." },
  invoicesList: { method: "GET", path: "/invoices", description: "List invoices. Filter with query: customer_uuid, data_source_uuid, external_id, date range; paginate with page and per_page." },
  activitiesList: { method: "GET", path: "/activities", description: "List MRR movement activities across customers." },
  metricsAll: { method: "GET", path: "/metrics/all", description: "All key metrics for a period. Query: start-date, end-date (YYYY-MM-DD), interval (day, week, month, quarter), geo, plans." },
  metricsMrr: { method: "GET", path: "/metrics/mrr", description: "MRR over time. Query: start-date, end-date, interval, geo, plans." },
  metricsArr: { method: "GET", path: "/metrics/arr", description: "ARR over time. Query: start-date, end-date, interval, geo, plans." },
  metricsArpa: { method: "GET", path: "/metrics/arpa", description: "Average revenue per account over time. Query: start-date, end-date, interval, geo, plans." },
  metricsAsp: { method: "GET", path: "/metrics/asp", description: "Average sale price over time. Query: start-date, end-date, interval, geo, plans." },
  metricsCustomerCount: { method: "GET", path: "/metrics/customer-count", description: "Customer count over time. Query: start-date, end-date, interval, geo, plans." },
  metricsCustomerChurnRate: { method: "GET", path: "/metrics/customer-churn-rate", description: "Customer churn rate over time. Query: start-date, end-date, interval, geo, plans." },
  metricsMrrChurnRate: { method: "GET", path: "/metrics/mrr-churn-rate", description: "MRR churn rate over time. Query: start-date, end-date, interval, geo, plans." },
  metricsLtv: { method: "GET", path: "/metrics/ltv", description: "Customer lifetime value over time. Query: start-date, end-date, interval, geo, plans." },
};

function restTools(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const tools = Object.entries(ops).map(([name, op]) => {
    const ids = [...op.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
    const hasBody = op.method === "POST" || op.method === "PATCH";
    const input = object({
      ...Object.fromEntries(ids.map((id) => [id, string()])),
      query: record(json()).optional(),
      ...(hasBody ? { body: record(json()).optional() } : {}),
    });
    const run = async (_ctx: unknown, args: Params) => {
      let path = op.path;
      for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
      const target = new URL(`${api}${path}`);
      for (const [key, value] of Object.entries((args.query as Params | undefined) ?? {})) {
        if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
      }
      const response = await fetcher(target.toString(), {
        method: op.method,
        signal,
        headers: {
          Authorization: basic(token),
          ...(hasBody ? { "Content-Type": "application/json" } : {}),
        },
        ...(hasBody && args.body !== undefined ? { body: JSON.stringify(args.body) } : {}),
      });
      if (response.status === 204) return { ok: true };
      return decodeJson(response, json());
    };
    const tool =
      op.method === "GET" ? query({ description: op.description, input }, run) : mutation({ description: op.description, input }, run);
    return [name, tool] as const;
  });
  return router(Object.fromEntries(tools));
}

const chartmogul = defineProvider({
  name: "ChartMogul",
  hosts: ["mcp.chartmogul.com", "api.chartmogul.com"],
  auth: {
    // Created under Profile > API keys in ChartMogul; sent as HTTP Basic (key as username).
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata and dynamic client registration; scope "mcp".
    oauth: oauth2({ discover: url }),
  },
  async health(check) {
    if (check.account.method === "oauth") {
      return mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } });
    }
    const response = await check.fetch(`${api}/ping`, {
      signal: check.signal,
      headers: { Authorization: basic(check.account.fields.token) },
    });
    await decodeJson(response, object({ data: string() }));
  },
});

export default defineApp(
  { user: { accounts: { chartmogul: chartmogul.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.chartmogul ?? [],
        async (account) =>
          account.method === "oauth"
            ? withApprovals(
                await mcpRouter({
                  url,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              )
            : withApprovals(restTools(account.fields.token, fetch, signal), (tool) =>
                tool.kind === "mutation" ? always() : undefined,
              ),
        { signal },
      ),
      {
        title: "ChartMogul",
        description: "Query and manage ChartMogul subscription analytics: customers, subscriptions, invoices, plans, revenue metrics and CRM data.",
        icons,
      },
    ),
  }),
);
