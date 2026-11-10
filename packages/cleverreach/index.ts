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

const cleverreach = defineProvider({
  name: "CleverReach",
  hosts: ["rest.cleverreach.com"],
  auth: {
    token: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Users create the OAuth app under Account > Extras > REST API; the connect page asks for its client.
    oauth: oauth2({
      authorizationUrl: "https://rest.cleverreach.com/oauth/authorize.php",
      tokenUrl: "https://rest.cleverreach.com/oauth/token.php",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
      authorizationParams: { grant: "basic" },
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://rest.cleverreach.com/v3/debug/whoami", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { cleverreach: cleverreach.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cleverreach ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "CleverReach",
        description:
          "Email marketing with CleverReach: recipients, groups, forms, mailings, reports, segments, attributes and the rest of the REST API v3.",
        icons,
      },
    ),
  }),
);
