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

const AccessibleCustomers = object({});

// Google Ads has no dynamic client registration: the connect page asks for a Google Cloud OAuth client.
const googleAds = defineProvider({
  name: "Google Ads",
  hosts: ["googleads.googleapis.com"],
  auth: {
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: ["https://www.googleapis.com/auth/adwords"],
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://googleads.googleapis.com/v25/customers:listAccessibleCustomers", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    await decodeJson(response, AccessibleCustomers);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { googleAds: googleAds.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.googleAds ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Google Ads",
        description:
          "Search campaigns, ad groups, ads and reporting with GAQL; mutate campaigns, budgets, assets and conversions; keyword ideas and forecasts, audience insights and account management.",
        icons,
        instructions:
          "Customer ids are digits without dashes (customersId). When acting on a client account through a manager (MCC) account, pass its 10-digit id as the login-customer-id header. Reads use customers.googleAds.search with a GAQL query; edits go through the customers.<resource>.mutate tools, which take an operations list.",
      },
    ),
  }),
);
