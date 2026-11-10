import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  object,
  plain,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { liveOpenapiRouter } from "apps/openapi";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { environments, options } from "./openapi.js";

const url = "https://mcp.cashfree.com/mcp";

type Environment = keyof typeof environments;

const environmentOf = (value: string): Environment => {
  const environment = value.trim().toLowerCase();
  if (environment === "production" || environment === "sandbox") return environment;
  throw new Error('Environment must be "production" or "sandbox".');
};

// Payment Gateway REST API: app id and secret key from Developers > API Keys in the Merchant Dashboard.
const cashfree = defineProvider({
  name: "Cashfree",
  hosts: ["api.cashfree.com", "sandbox.cashfree.com"],
  auth: {
    apiKey: secrets({
      label: "Payment Gateway app ID and secret key",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        client_id: string({ minLength: 1 }),
        client_secret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = environments[environmentOf(account.fields.environment)];
    // Read-only lookup of an order id that does not exist: 404 means the keys were accepted.
    const response = await fetch(`${origin}/pg/orders/executor_health_check`, {
      signal,
      headers: {
        "x-api-version": "2026-01-01",
        "x-client-id": account.fields.client_id,
        "x-client-secret": account.fields.client_secret,
        Accept: "application/json",
      },
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Cashfree rejected the app ID and secret key (HTTP ${response.status}).`);
    }
    return {
      accountInfo: {
        externalId: `${account.fields.environment}:${account.fields.client_id}`,
        displayName: `${account.fields.client_id} (${account.fields.environment})`,
      },
    };
  },
});

// Cashfree's MCP server: dashboard, settlement and report tools that are not in the REST document.
// OAuth with dynamic client registration; the token endpoint advertises client_secret_post only.
const cashfreeMcp = defineProvider({
  name: "Cashfree MCP",
  hosts: ["mcp.cashfree.com"],
  auth: {
    oauth: oauth2({
      discover: url,
      tokenEndpointAuthMethod: "client_secret_post",
    }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { cashfree: cashfree.many(), cashfreeMcp: cashfreeMcp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: router(
          await accountRouter(
            user?.accounts.cashfree ?? [],
            (account) => {
              const origin = environments[environmentOf(account.fields.environment)];
              return withApprovals(
                liveOpenapiRouter({
                  ...options,
                  allowedOrigin: origin,
                  baseUrl: `${origin}/pg`,
                  cache,
                  fetch,
                  signal,
                  account,
                }),
                (tool) => (tool.kind === "mutation" ? always() : undefined),
              );
            },
            { signal },
          ),
          {
            title: "Cashfree Payment Gateway API",
            description:
              "Orders, payments, payment links, refunds, disputes, settlements, reconciliation, subscriptions, customers, offers and easy-split from the Payment Gateway REST API.",
            instructions:
              "The account's environment (production or sandbox) is fixed when it is connected. Mutations ask for approval.",
          },
        ),
        mcp: router(
          await accountRouter(
            user?.accounts.cashfreeMcp ?? [],
            async (account) =>
              withApprovals(
                await mcpRouter({
                  url,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              ),
            { signal },
          ),
          {
            title: "Cashfree MCP",
            description:
              "Cashfree's remote MCP server: transaction search, settlement and reconciliation reports and workflows.",
          },
        ),
      },
      {
        title: "Cashfree",
        description:
          "Cashfree Payments: the Payment Gateway REST API (api) plus the dashboard, settlement and report tools of Cashfree's MCP server (mcp).",
        icons,
      },
    ),
  }),
);
