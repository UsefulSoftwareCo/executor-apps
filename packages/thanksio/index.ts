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
import { options } from "./openapi.js";

const thanksio = defineProvider({
  name: "Thanks.io",
  hosts: ["api.thanks.io", "dashboard.thanks.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Users create an OAuth application in the thanks.io dashboard (Settings, API Access, Create Application) and enter its client ID and secret on the connect page.
    oauth: oauth2({
      authorizationUrl: "https://dashboard.thanks.io/oauth/authorize",
      tokenUrl: "https://dashboard.thanks.io/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  // The API has no current-user endpoint; listing mailing lists is an authenticated read (handwriting-styles is public).
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.thanks.io/api/v2/mailing-lists/", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { thanksio: thanksio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.thanksio ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Thanks.io",
        description:
          "Send postcards, letters, notecards and gift cards with thanks.io: recipients, mailing lists, orders, templates and webhooks.",
        icons,
      },
    ),
  }),
);
