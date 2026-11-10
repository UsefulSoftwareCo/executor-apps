import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  oauth2,
  object,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const sellsy = defineProvider({
  name: "Sellsy",
  hosts: ["api.sellsy.com"],
  auth: {
    // A private or public OAuth client created in Sellsy's developer portal (PKCE is required and handled by Executor).
    // Sellsy fixes the scopes on the client itself, so none are requested here.
    oauth: oauth2({
      authorizationUrl: "https://login.sellsy.com/oauth2/authorization",
      tokenUrl: "https://login.sellsy.com/oauth2/access-tokens",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [],
    }),
    // A personal OAuth client can use the client credentials grant without a user sign-in.
    machine: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://login.sellsy.com/oauth2/access-tokens",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.sellsy.com/v2/staffs?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    // The list response always carries pagination and data; only the shape is checked.
    await decodeJson(response, object({ pagination: json(), data: json() }));
    return { accountInfo: { externalId: "sellsy", displayName: "Sellsy", profileUrl: "https://www.sellsy.com" } };
  },
});

export default defineApp(
  { user: { accounts: { sellsy: sellsy.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sellsy ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Sellsy",
        description:
          "Sellsy CRM and invoicing: companies, contacts, opportunities, estimates, invoices, orders, products, tasks, calendars and the rest of the Sellsy API v2.",
        icons,
      },
    ),
  }),
);
