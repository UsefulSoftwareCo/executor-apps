import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Read scopes for the stable endpoints; experimental scopes are granted by Spendesk per app and are not requested.
const scopes = [
  "analytical-field:read",
  "bank-fee:read",
  "cost-center:read",
  "cost-center:manage",
  "expense-category:read",
  "payable:read",
  "payable-attachment:read",
  "settlement:read",
  "supplier:read",
  "user:read",
  "wallet-load:read",
  "wallet-summary:read",
];

const spendesk = defineProvider({
  name: "Spendesk",
  hosts: ["public-api.spendesk.com"],
  auth: {
    // Public API credentials (client ID and secret) from Settings > Developers in Spendesk. The token endpoint
    // takes them as HTTP Basic and issues a short-lived bearer token; the credential's own scopes apply.
    credentials: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://public-api.spendesk.com/v1/auth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      tokenRequestFormat: "json",
      scopes: [],
    }),
    // OAuth app (PKCE authorization code), for partners. Spendesk publishes RFC 8414 metadata.
    oauth: oauth2({
      authorizationUrl: "https://public-api.spendesk.com/v1/oauth2/authorize",
      tokenUrl: "https://public-api.spendesk.com/v1/oauth2/token/create",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes,
    }),
  },
  // Any valid token can read the wallet summary only with its scope; the users list is the common read.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://public-api.spendesk.com/v1/users?size=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { spendesk: spendesk.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.spendesk ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Spendesk",
        description:
          "Spend management with Spendesk: payables, settlements, suppliers, users, cost centers, cards, purchase orders, invoices, accounting exports and webhooks.",
        icons,
      },
    ),
  }),
);
