import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { mounts } from "./openapi.js";

const accountPattern = /^[a-zA-Z0-9_-]+$/;

function accountName(account: { fields: { accountName: string } }) {
  const name = account.fields.accountName.trim();
  if (!accountPattern.test(name)) throw new Error("Enter your VTEX account name, for example mystore.");
  return name;
}

const origin = (account: { fields: { accountName: string } }) =>
  `https://${accountName(account)}.vtexcommercestable.com.br`;

const vtex = defineProvider({
  name: "VTEX",
  hosts: ["*.vtexcommercestable.com.br", "api.vtex.com"],
  auth: {
    apiKey: secrets({
      label: "Account name, app key and app token",
      fields: object({
        accountName: plain(string({ minLength: 1 })),
        appKey: string({ minLength: 1 }),
        appToken: string({ minLength: 1 }),
      }),
    }),
  },
  // The License Manager account endpoint answers any valid key pair for the store.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin(account)}/api/vlm/account`, {
      signal,
      headers: {
        Accept: "application/json",
        "X-VTEX-API-AppKey": account.fields.appKey,
        "X-VTEX-API-AppToken": account.fields.appToken,
      },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: accountName(account), displayName: accountName(account) } };
  },
});

export default defineApp(
  { user: { accounts: { vtex: vtex.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vtex ?? [],
        (account) => {
          const mount = (options: (typeof mounts)[keyof typeof mounts]) => {
            const url = new URL(options.baseUrl);
            // Pricing is served from api.vtex.com/<account>; every other API from the account's own host.
            const isPricing = options === mounts.pricing;
            const base = isPricing ? `https://api.vtex.com/${accountName(account)}` : `${origin(account)}${url.pathname === "/" ? "" : url.pathname}`;
            const allowed = isPricing ? "https://api.vtex.com" : origin(account);
            return withApprovals(
              liveOpenapiRouter({ ...options, allowedOrigin: allowed, baseUrl: base, cache, fetch, signal, account }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          };
          return router(
            Object.fromEntries(Object.entries(mounts).map(([key, options]) => [key, mount(options)])) as {
              [K in keyof typeof mounts]: ReturnType<typeof mount>;
            },
            { title: "VTEX", description: "VTEX store." },
          );
        },
        { signal },
      ),
      {
        title: "VTEX",
        description:
          "VTEX commerce platform. catalog: products, SKUs, brands, categories. checkout: carts and orderForms. orders: order management. pricing: prices and fixed prices. logistics: warehouses, docks, inventory. masterdata: custom data entities. licenseManager: roles and users. promotions: promotions and taxes. search, subscriptions, customerCredit, profile, giftcard, skuBindings, marketplace, policies.",
        icons,
      },
    ),
  }),
);
