import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

const loop = defineProvider({
  name: "Loop Returns",
  hosts: ["api.loopreturns.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Returns the shop and the scopes granted to the key, whatever those scopes are.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.loopreturns.com/api/v1/auth/me", {
      signal,
      headers: { "X-Authorization": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { loopreturns: loop.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.loopreturns ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              returns: mount(apis.returns),
              draftReturns: mount(apis.draftReturns),
              dispositioning: mount(apis.dispositioning),
              fraudReports: mount(apis.fraudReports),
              orders: mount(apis.orders),
              products: mount(apis.products),
              customers: mount(apis.customers),
              collections: mount(apis.collections),
              inventories: mount(apis.inventories),
              locations: mount(apis.locations),
              bulkOperations: mount(apis.bulkOperations),
              listings: mount(apis.listings),
              destinations: mount(apis.destinations),
              carts: mount(apis.carts),
              labels: mount(apis.labels),
              happyReturns: mount(apis.happyReturns),
              webhooks: mount(apis.webhooks),
              checkoutPlus: mount(apis.checkoutPlus),
            },
            { title: "Loop Returns", description: "Loop Returns shop." },
          );
        },
        { signal },
      ),
      {
        title: "Loop Returns",
        description:
          "Loop Returns. returns: list, inspect, process, cancel, flag and close returns, notes, deep links, ASN. draftReturns: build and submit a return step by step. dispositioning: grade items and assess dispositions. fraudReports. Commerce data: orders, products, customers, collections, inventories, locations, bulkOperations. listings: allowlist and blocklist. destinations, carts, labels, happyReturns. webhooks: programmatic webhook subscriptions. checkoutPlus: Checkout+ storefront analyze and session APIs.",
        icons,
      },
    ),
  }),
);
