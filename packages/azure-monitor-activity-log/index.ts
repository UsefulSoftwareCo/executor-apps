import {
  accountRouter,
  defineApp,
  defineProvider,
  json,
  decodeJson,
  oauth2,
  query,
  router,
  string,
  object,
} from "apps";
import { icons } from "./icon.js";

const base = "https://management.azure.com";
const apiVersion = "2015-04-01";

const azure = defineProvider({
  name: "Azure Monitor Activity Log",
  hosts: ["management.azure.com"],
  auth: {
    // Microsoft Entra v2 publishes OIDC metadata; the connect page asks for an app registration's client.
    oauth: oauth2({
      discover: "https://login.microsoftonline.com/common/v2.0",
      scopes: ["offline_access", "https://management.azure.com/user_impersonation"],
    }),
  },
  // Listing tenants is read-only and needs no subscription id.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/tenants?api-version=2022-12-01`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    await decodeJson(response, object({ value: json() }));
    return { accountInfo: {} };
  },
});

type Account = { fields: { access_token: string } };

const get = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  path: string,
  params: Record<string, string | undefined> = {},
) => {
  const search = new URLSearchParams({ "api-version": apiVersion });
  for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, value);
  return decodeJson(
    await fetch(`${base}${path}?${search}`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    }),
    json(),
  );
};

const filterHelp =
  "filter is an OData expression and is required: it must include eventTimestamp ge/le bounds (for example eventTimestamp ge '2026-10-01T00:00:00Z' and eventTimestamp le '2026-10-02T00:00:00Z'), and may add one more condition from eventChannels, resourceGroupName, resourceUri, resourceProvider, correlationId, status, caller, level, or eventName (joined with and). The window is at most 90 days back. select is a comma-separated list of fields to return (for example eventName,eventTimestamp,caller,status,resourceId).";

const tools = (account: Account, signal: AbortSignal) =>
  router({
    listEvents: query(
      {
        description: `List Activity Log management events for one Azure subscription, newest first. Follow nextLink for more. ${filterHelp}`,
        input: object({
          subscriptionId: string(),
          filter: string(),
          select: string().optional(),
        }),
      },
      async ({ fetch }, { subscriptionId, filter, select }) =>
        get(fetch, account, signal, `/subscriptions/${encodeURIComponent(subscriptionId)}/providers/Microsoft.Insights/eventtypes/management/values`, {
          $filter: filter,
          $select: select,
        }),
    ),
    listTenantEvents: query(
      {
        description: `List Activity Log management events at tenant scope (tenant-level operations such as root management group changes). Needs a role at the tenant root. ${filterHelp}`,
        input: object({ filter: string().optional(), select: string().optional() }),
      },
      async ({ fetch }, { filter, select }) =>
        get(fetch, account, signal, "/providers/Microsoft.Insights/eventtypes/management/values", {
          $filter: filter,
          $select: select,
        }),
    ),
    listEventCategories: query(
      {
        description:
          "List the localized Activity Log event categories (Administrative, Security, ServiceHealth, Alert, Recommendation, Policy, Autoscale, ResourceHealth).",
        input: object({}),
      },
      async ({ fetch }) => get(fetch, account, signal, "/providers/Microsoft.Insights/eventcategories"),
    ),
  });

export default defineApp(
  { user: { accounts: { azure: azure.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.azure ?? [], (account) => tools(account, signal), { signal }),
      {
        title: "Azure Monitor Activity Log",
        description:
          "Query Azure Monitor Activity Log events for one subscription or the whole tenant (OData filter on time, resource, caller, level) and list activity log event categories.",
        icons,
      },
    ),
  }),
);
