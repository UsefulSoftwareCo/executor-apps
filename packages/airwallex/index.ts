import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
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
import { options } from "./openapi.js";

const url = "https://mcp.airwallex.com/mcp";

const Login = object({ token: string(), expires_at: string() });

const login = async (
  fields: { client_id: string; api_key: string },
  fetch: typeof globalThis.fetch,
  signal?: AbortSignal,
) => {
  const response = await fetch("https://api.airwallex.com/api/v1/authentication/login", {
    method: "POST",
    signal,
    headers: { "x-client-id": fields.client_id, "x-api-key": fields.api_key },
  });
  return decodeJson(response, Login);
};

const airwallex = defineProvider({
  name: "Airwallex",
  hosts: ["mcp.airwallex.com", "api.airwallex.com"],
  auth: {
    // REST API: the client ID and API key are exchanged for a 30 minute bearer token.
    apiKey: secrets({
      label: "Client ID and API key",
      fields: object({ client_id: string({ minLength: 1 }), api_key: string({ minLength: 1 }) }),
    }),
    // AgentOS MCP: OAuth with dynamic client registration. Explicit read-only scopes, because
    // omitting them requests every advertised scope including billing, issuing and payment writes.
    oauth: oauth2({
      discover: url,
      scopes: [
        "r:awx_action:balances_view",
        "r:awx_action:contact_management_view",
        "r:awx_action:conversions_view",
        "r:awx_action:global_accounts_view",
        "r:awx_action:issuing_cardholders_view",
        "r:awx_action:issuing_cards_view",
        "r:awx_action:issuing_transactions_view",
        "r:awx_action:pa_view",
        "r:awx_action:payment_links_view",
        "r:awx_action:settings.account_details_view",
        "r:awx_action:transfers_view",
        "r:org_action:billing.customer_view",
        "r:org_action:billing.discount_view",
        "r:org_action:billing.invoice_view",
        "r:org_action:billing.payment_source_view",
        "r:org_action:billing.price_view",
        "r:org_action:billing.product_view",
        "r:org_action:billing.subscription_view",
        "r:org_action:billing.transaction_view",
        "r:org_action:billing.usage_metering_view",
        "r:org_action:expense_management.expense:api_view",
        "r:org_action:spend.bills:api_view",
        "r:org_action:spend.vendors:api_view",
      ],
    }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, {
        url,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
    }
    await login(account.fields, fetch, signal);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { airwallex: airwallex.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.airwallex ?? [],
        async (account) => {
          if (account.method === "oauth") {
            return withApprovals(
              await mcpRouter({
                url,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            );
          }
          const sessions = cache.forAccount(account);
          const token = () =>
            sessions.get({
              key: ["token"],
              schema: string(),
              freshFor: "25 minutes", // tokens last 30 minutes
              load: async ({ fetch, signal }) => (await login(account.fields, fetch, signal)).token,
            });
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              signal,
              account,
              fetch: async (input, init) => {
                const headers = new Headers(init?.headers);
                headers.set("authorization", `Bearer ${await token()}`);
                const response = await fetch(input, { ...init, headers });
                if (response.status === 401) await sessions.invalidate(["token"]);
                return response;
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Airwallex",
        description:
          "Airwallex business finance: balances, global accounts, payments, transfers, FX conversions, cards, billing and spend.",
        icons,
      },
    ),
  }),
);
