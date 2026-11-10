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

const url = "https://api.dashboard.plaid.com/mcp/";

type Environment = keyof typeof environments;

const environmentOf = (value: string): Environment => {
  const environment = value.trim().toLowerCase();
  if (environment === "production" || environment === "sandbox") return environment;
  throw new Error('Environment must be "production" or "sandbox".');
};

// Plaid REST API: client ID and secret from Team Settings > Keys in the Plaid Dashboard.
const plaid = defineProvider({
  name: "Plaid",
  hosts: ["production.plaid.com", "sandbox.plaid.com"],
  auth: {
    apiKey: secrets({
      label: "Client ID and secret",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        client_id: string({ minLength: 1 }),
        secret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const environment = environmentOf(account.fields.environment);
    // Read-only institution listing: it needs valid keys and changes nothing.
    const response = await fetch(`${environments[environment]}/institutions/get`, {
      method: "POST",
      signal,
      headers: {
        "PLAID-CLIENT-ID": account.fields.client_id,
        "PLAID-SECRET": account.fields.secret,
        "content-type": "application/json",
      },
      body: JSON.stringify({ count: 1, offset: 0, country_codes: ["US"] }),
    });
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new Error(`Plaid rejected the client ID and secret (HTTP ${response.status}).`);
    }
    if (!response.ok) throw new Error(`Plaid health check failed (HTTP ${response.status}).`);
    return {
      accountInfo: {
        externalId: `${environment}:${account.fields.client_id}`,
        displayName: `${account.fields.client_id} (${environment})`,
      },
    };
  },
});

// The Dashboard MCP server publishes OAuth metadata with dynamic client registration (PKCE, public client).
const plaidMcp = defineProvider({
  name: "Plaid Dashboard MCP",
  hosts: ["api.dashboard.plaid.com"],
  auth: {
    oauth: oauth2({ discover: url, scopes: ["mcp:dashboard"] }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { plaid: plaid.many(), plaidMcp: plaidMcp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: router(
          await accountRouter(
            user?.accounts.plaid ?? [],
            (account) => {
              const origin = environments[environmentOf(account.fields.environment)];
              return withApprovals(
                liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
                (tool) => (tool.kind === "mutation" ? always() : undefined),
              );
            },
            { signal },
          ),
          {
            title: "Plaid API",
            description:
              "Link, Items, Auth, Balance, Transactions, Identity, Investments, Liabilities, Income, Transfer, Signal and the rest of the Plaid REST API.",
            instructions:
              "The account's environment (production or sandbox) is fixed when it is connected. Most Plaid endpoints take an access_token in the request body. Operations that create or change data ask for approval.",
          },
        ),
        mcp: router(
          await accountRouter(
            user?.accounts.plaidMcp ?? [],
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
            title: "Plaid Dashboard MCP",
            description:
              "Plaid's Dashboard MCP server: read-only Production diagnostics for Items, Link conversion analytics, product usage and team discovery.",
          },
        ),
      },
      {
        title: "Plaid",
        description:
          "Plaid: the REST API for bank connectivity and financial data (api) plus the Dashboard MCP server for Item diagnostics and analytics (mcp).",
        icons,
      },
    ),
  }),
);
