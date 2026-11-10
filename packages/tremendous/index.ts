import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const tremendous = defineProvider({
  name: "Tremendous",
  hosts: ["api.tremendous.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Admins register an app under Team settings > Developers; the connect page asks for its client.
    oauth: oauth2({
      authorizationUrl: "https://api.tremendous.com/oauth/authorize",
      tokenUrl: "https://api.tremendous.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["default", "team_management", "fraud_prevention"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.tremendous.com/api/v2/organizations", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, json());
  },
});

export default defineApp(
  { user: { accounts: { tremendous: tremendous.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tremendous ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Tremendous",
        description:
          "Send rewards and payouts with Tremendous: orders, rewards, products, campaigns, funding sources, invoices, topups, webhooks and fraud controls.",
        icons,
      },
    ),
  }),
);
