import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  object,
  plain,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { lightspeedOptions, siteUrl } from "./openapi.js";

const lightspeed = defineProvider({
  name: "Lightspeed Retail X-Series",
  hosts: ["*.retail.lightspeed.app"],
  auth: {
    // OAuth is not declared: the token endpoint is per-retailer
    // (https://<domain_prefix>.retail.lightspeed.app/api/1.0/token) and the framework only takes static endpoint strings.
    personalToken: secrets({
      label: "Personal token",
      fields: object({
        domainPrefix: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("authorization", t`Bearer ${token}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.domainPrefix)}/api/2026-07/retailer`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { lightspeed: lightspeed.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lightspeed ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...lightspeedOptions(account.fields.domainPrefix),
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
        title: "Lightspeed Retail X-Series",
        description:
          "Lightspeed Retail (X-Series) point of sale: products, inventory, sales, customers, registers, outlets, suppliers, consignments, gift cards, store credit, promotions and webhooks.",
        icons,
      },
    ),
  }),
);
