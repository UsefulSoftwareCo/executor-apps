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
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every shop lives on its own host: https://<shop>.myshopify.com.
const apiVersion = "2026-07";

const shopHost = (shop: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*[a-z0-9])(?:\.myshopify\.com)?\/?$/.exec(
    shop.trim().toLowerCase(),
  );
  if (match === null) throw new Error("Enter the <shop> of <shop>.myshopify.com (letters, digits, hyphens).");
  return `${match[1]}.myshopify.com`;
};

const endpoint = (shop: string) => `https://${shopHost(shop)}/admin/api/${apiVersion}/graphql.json`;

const shopify = defineProvider({
  name: "Shopify",
  hosts: ["*.myshopify.com"],
  auth: {
    // Admin API access token (shpat_...) of a custom app created in the shop admin.
    // OAuth is not declared: Shopify's authorize and token endpoints are per-shop
    // (https://<shop>.myshopify.com/admin/oauth/...) and the framework only takes static endpoint strings.
    accessToken: secrets({
      label: "Admin API access token",
      fields: object({
        shop: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("x-shopify-access-token", token),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(endpoint(account.fields.shop), {
      method: "POST",
      signal,
      headers: { ...account.headers(), "content-type": "application/json" },
      body: JSON.stringify({ query: "{ shop { id name myshopifyDomain } }" }),
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ shop: object({ id: string(), name: string(), myshopifyDomain: string() }) }) }),
    );
    return {
      accountInfo: {
        externalId: data.shop.id,
        displayName: data.shop.name,
        profileUrl: `https://${data.shop.myshopifyDomain}/admin`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { shopify: shopify.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shopify ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({
              url: endpoint(account.fields.shop),
              account,
              headers: account.headers(),
              cache,
              signal,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Shopify",
        description:
          "Products, orders, customers, inventory, collections, discounts and the rest of Shopify's Admin GraphQL API.",
        icons,
      },
    ),
  }),
);
