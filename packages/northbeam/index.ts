import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  oauth2,
  query,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const mcpUrl = "https://mcp.northbeam.io";
const exportsBase = "https://api.northbeam.io/v1/exports";
const ordersBase = "https://api.northbeam.io/v2";
const spendBase = "https://api.northbeam.io/v1";

type KeyAccount = { method: "apiKey"; fields: { apiKey: string; dataClientId: string } };

const restHeaders = (account: KeyAccount) => ({
  Authorization: account.fields.apiKey,
  "Data-Client-ID": account.fields.dataClientId,
  Accept: "application/json",
});

const northbeam = defineProvider({
  name: "Northbeam",
  hosts: ["mcp.northbeam.io", "api.northbeam.io"],
  auth: {
    apiKey: secrets({
      label: "API key and Data-Client-ID",
      fields: object({ apiKey: string({ minLength: 1 }), dataClientId: string({ minLength: 1 }) }),
    }),
    // The MCP server publishes OAuth metadata with dynamic client registration.
    // offline_access is requested explicitly so refresh tokens are issued.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const account = check.account;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await check.fetch(`${exportsBase}/attribution-models`, {
      signal: check.signal,
      headers: restHeaders(account),
    });
    await decodeJson(response, object({ attribution_models: array(object({ id: string() })) }));
  },
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const restTools = (account: KeyAccount, signal: AbortSignal) => {
  const headers = restHeaders(account);
  return router({
    orders: router(
      {
        list: query(
          {
            description:
              "List orders between two dates (YYYY-MM-DD, both required by the API) from the Orders API v2.",
            input: object({ start_date: string(), end_date: string() }),
          },
          async ({ fetch }, input) =>
            decodeJson(await fetch(`${ordersBase}/orders?${search(input)}`, { signal, headers }), json()),
        ),
      },
      { title: "Orders", description: "Read orders sent to Northbeam." },
    ),
    spend: router(
      {
        list: query(
          {
            description:
              "List daily spend records. Filter by a single date or a date_start/date_end range (not both), and by platform_account_id, campaign_id, adset_id or ad_id. page_size is at most 1000.",
            input: object({
              date: string().optional(),
              date_start: string().optional(),
              date_end: string().optional(),
              platform_account_id: string().optional(),
              campaign_id: string().optional(),
              adset_id: string().optional(),
              ad_id: string().optional(),
              page: number().optional(),
              page_size: number().optional(),
            }),
          },
          async ({ fetch }, input) =>
            decodeJson(await fetch(`${spendBase}/spend?${search(input)}`, { signal, headers }), json()),
        ),
      },
      { title: "Spend", description: "Read daily ad spend records." },
    ),
    exports: router(
      {
        attributionModels: query(
          { description: "List the attribution models usable in a data export.", input: object({}) },
          async ({ fetch }) =>
            decodeJson(await fetch(`${exportsBase}/attribution-models`, { signal, headers }), json()),
        ),
        metrics: query(
          { description: "List the metric ids usable in a data export.", input: object({}) },
          async ({ fetch }) => decodeJson(await fetch(`${exportsBase}/metrics`, { signal, headers }), json()),
        ),
        breakdowns: query(
          { description: "List the breakdown keys and values usable in a data export.", input: object({}) },
          async ({ fetch }) => decodeJson(await fetch(`${exportsBase}/breakdowns`, { signal, headers }), json()),
        ),
        result: query(
          {
            description:
              "Fetch a data export's status (PENDING, SUCCESS, ERROR) and, when finished, its download URLs.",
            input: object({ export_id: string() }),
          },
          async ({ fetch }, { export_id }) =>
            decodeJson(
              await fetch(`${exportsBase}/data-export/result/${encodeURIComponent(export_id)}`, { signal, headers }),
              json(),
            ),
        ),
        create: mutation(
          {
            description:
              "Create a Sales Attribution export stored in Northbeam documents. Body fields: attribution_options { attribution_models[], attribution_windows[] ('1','3','7','14','30','60','90'), accounting_modes[] ('cash','accrual') } and metrics [{ id, label? }] are required; optional level (platform|campaign|adset|ad), time_granularity (MONTHLY|WEEKLY|DAILY|HOURLY), period_type (e.g. LAST_7_DAYS, or FIXED with period_options { period_starting_at, period_ending_at }), breakdowns [{ key, values[] }], options and export_file_name. Valid ids come from attributionModels, metrics and breakdowns. Returns { id }; poll with result.",
            input: object({ body: json() }),
            approval: always(),
          },
          async ({ fetch }, { body }) =>
            decodeJson(
              await fetch(`${exportsBase}/data-export`, {
                method: "POST",
                signal,
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify(body),
              }),
              json(),
            ),
        ),
      },
      { title: "Data export", description: "Sales attribution exports: metrics, breakdowns, models and results." },
    ),
  });
};

export default defineApp(
  { user: { accounts: { northbeam: northbeam.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.northbeam ?? [],
        async (account) => {
          if (account.method === "apiKey") return restTools(account, signal);
          return withApprovals(
            await mcpRouter({
              url: mcpUrl,
              account,
              headers: { Authorization: `Bearer ${account.fields.access_token}` },
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          );
        },
        { signal },
      ),
      {
        title: "Northbeam",
        description:
          "Northbeam marketing attribution: spend, ROAS, orders and dashboards (OAuth, MCP) or Orders, Spend and Data Export REST APIs (API key).",
        icons,
      },
    ),
  }),
);
