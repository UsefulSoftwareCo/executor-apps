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

const Me = object({ data: object({}) });

const redditAds = defineProvider({
  name: "Reddit Ads",
  hosts: ["ads-api.reddit.com", "www.reddit.com"],
  auth: {
    // Reddit offers no client registration: the connect page asks for a Reddit app's client.
    oauth: oauth2({
      authorizationUrl: "https://www.reddit.com/api/v1/authorize",
      tokenUrl: "https://www.reddit.com/api/v1/access_token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["adsread", "adsedit", "adsconversions"],
      authorizationParams: { duration: "permanent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://ads-api.reddit.com/api/v3/me", {
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.access_token}`,
        "User-Agent": "Executor (Reddit Ads app)",
      },
    });
    await decodeJson(response, Me);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { redditAds: redditAds.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.redditAds ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Reddit Ads",
        description:
          "Reddit Ads campaigns, ad groups, ads, audiences, pixels, catalogs and reporting from the Reddit Ads API v3.",
        icons,
      },
    ),
  }),
);
