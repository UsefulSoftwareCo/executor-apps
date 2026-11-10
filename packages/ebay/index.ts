import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
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
import { apis } from "./openapi.js";

const ebay = defineProvider({
  name: "eBay",
  hosts: ["api.ebay.com", "apiz.ebay.com", "apix.ebay.com", "apim.ebay.com"],
  auth: {
    // Application token: the connect page asks for the keyset's App ID (client ID) and Cert ID (client
    // secret) from developer.ebay.com and exchanges them. Covers the Buy, Commerce and Developer APIs
    // that need no seller or buyer consent.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.ebay.com/identity/v1/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["https://api.ebay.com/oauth/api_scope"],
    }),
    // eBay's authorization-code flow takes a RuName in redirect_uri instead of a URL, so a user token
    // generated in the developer console is pasted instead.
    token: secrets({
      label: "User access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "oauth") {
      const response = await fetch(
        "https://api.ebay.com/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_US",
        { signal, headers: { Authorization: `Bearer ${account.fields.access_token}` } },
      );
      await decodeJson(response, object({ categoryTreeId: string() }));
      return;
    }
    const response = await fetch("https://api.ebay.com/sell/account/v1/privilege", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { ebay: ebay.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ebay ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            Object.fromEntries(Object.entries(apis).map(([key, options]) => [key, mount(options)])),
            { title: "eBay", description: "eBay APIs." },
          );
        },
        { signal },
      ),
      {
        title: "eBay",
        description:
          "eBay Buy, Commerce, Developer and Sell REST APIs. browse/deal/buyFeed/buyMarketing/buyOffer/buyOrder: item search, deals and checkout; catalog/taxonomy/charity/translation/identity/media/notification/vero: commerce services; inventory (inventory items, offers, publish)/account/fulfillment/disputes (payment disputes)/finances/logistics/negotiation/recommendation/metadata/stores/sellFeed/sellMarketing/sellAnalytics: seller operations; developerAnalytics: API rate limits.",
        icons,
      },
    ),
  }),
);
