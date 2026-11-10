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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

// Every store lives under https://api.bigcommerce.com/stores/<store hash>.
const storeHashPattern = /^[a-z0-9]{4,20}$/;

function storeHash(account: { fields: { storeHash: string } }) {
  const hash = account.fields.storeHash.trim().toLowerCase();
  if (!storeHashPattern.test(hash)) {
    throw new Error("Enter the store hash: the code in https://api.bigcommerce.com/stores/<store hash>/v3/.");
  }
  return hash;
}

const bigcommerce = defineProvider({
  name: "BigCommerce",
  hosts: ["api.bigcommerce.com"],
  auth: {
    // Access token of an API account created in the store's control panel. BigCommerce's OAuth flow only
    // serves marketplace apps installed from the store, so it is not offered here.
    accessToken: secrets({
      label: "Store hash and API account access token",
      fields: object({
        storeHash: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("X-Auth-Token", token),
    }),
  },
  async health({ account, fetch, signal }) {
    const hash = storeHash(account);
    const response = await fetch(`https://api.bigcommerce.com/stores/${hash}/v2/store`, {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    const store = await decodeJson(response, object({ id: string(), name: string(), domain: string() }));
    return {
      accountInfo: {
        externalId: store.id,
        displayName: store.name,
        profileUrl: `https://store-${hash}.mybigcommerce.com/manage`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { bigcommerce: bigcommerce.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bigcommerce ?? [],
        (account) => {
          const hash = storeHash(account);
          const mount = (key: keyof typeof apis) => {
            const options = apis[key];
            return withApprovals(
              liveOpenapiRouter({
                ...options,
                baseUrl: options.baseUrl.replace("/stores/store_hash/", `/stores/${hash}/`),
                cache,
                fetch,
                signal,
                account,
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          };
          return router(
            Object.fromEntries((Object.keys(apis) as (keyof typeof apis)[]).map((key) => [key, mount(key)])) as Record<
              keyof typeof apis,
              ReturnType<typeof mount>
            >,
            { title: "BigCommerce store", description: "BigCommerce store." },
          );
        },
        { signal },
      ),
      {
        title: "BigCommerce",
        description:
          "BigCommerce store management. catalog*: products, variants, modifiers, categories, brands. orders, carts, checkouts, abandonedCarts, customers, priceLists, channels, sites, pages, redirects, scripts, themes, widgets, emailTemplates, settings, shipping, tax*, currencies, geography, marketing (coupons, promotions, banners), webhooks, wishlists, storefrontTokens, subscribers, payment methods.",
        icons,
      },
    ),
  }),
);
