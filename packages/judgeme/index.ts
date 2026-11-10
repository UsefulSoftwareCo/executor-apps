import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
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
import { options } from "./openapi.js";

const judgeme = defineProvider({
  name: "Judge.me",
  hosts: ["api.judge.me"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({
        shopDomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
    // Judge.me apps are created by the user at https://judge.me/profile/apps/new; the connect page
    // asks for that app's client. Tokens are permanent and the token endpoint takes a JSON body.
    oauth: oauth2({
      authorizationUrl: "https://app.judge.me/oauth/authorize",
      tokenUrl: "https://judge.me/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [
        "read_shops",
        "write_shops",
        "read_widgets",
        "read_reviewers",
        "write_reviewers",
        "read_reviews",
        "write_reviews",
        "read_settings",
        "write_comments",
        "write_replies",
        "write_private_replies",
      ],
    }),
  },
  // Listing a single review is a cheap read that both API tokens and OAuth tokens authorize.
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.judge.me/api/v1/reviews");
    url.searchParams.set("per_page", "1");
    const headers: Record<string, string> = {};
    if (account.method === "oauth") {
      headers.Authorization = `Bearer ${account.fields.access_token}`;
    } else {
      headers["X-Api-Token"] = account.fields.token;
      url.searchParams.set("shop_domain", account.fields.shopDomain);
    }
    const response = await fetch(url.toString(), { signal, headers });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { judgeme: judgeme.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.judgeme ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Judge.me",
        description:
          "Judge.me product reviews: reviews, reviewers, replies, widgets, webhooks, shop settings.",
        icons,
      },
    ),
  }),
);
