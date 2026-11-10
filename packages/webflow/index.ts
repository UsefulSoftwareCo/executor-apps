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

// Webflow documents every introspect field as optional, but every example (OAuth and site token) carries authorization.id.
const Introspection = object({ authorization: object({ id: string() }) });

const webflow = defineProvider({
  name: "Webflow",
  hosts: ["api.webflow.com"],
  auth: {
    token: secrets({
      label: "Site or workspace API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Webflow offers no client registration: the connect page asks for a Data client app's client.
    oauth: oauth2({
      authorizationUrl: "https://webflow.com/oauth/authorize",
      tokenUrl: "https://api.webflow.com/oauth/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopeSeparator: " ",
      scopes: [
        "authorized_user:read",
        "sites:read",
        "sites:write",
        "pages:read",
        "pages:write",
        "cms:read",
        "cms:write",
        "assets:read",
        "assets:write",
        "forms:read",
        "forms:write",
        "custom_code:read",
        "custom_code:write",
        "ecommerce:read",
        "ecommerce:write",
        "components:read",
        "components:write",
        "comments:read",
        "comments:write",
        "users:read",
        "users:write",
        "site_config:read",
        "site_config:write",
        "site_activity:read",
        "workspace:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.webflow.com/v2/token/introspect", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Introspection);
    return { accountInfo: { externalId: me.authorization.id } };
  },
});

export default defineApp(
  { user: { accounts: { webflow: webflow.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.webflow ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Webflow",
        description:
          "Sites, CMS collections and items, pages, assets, forms, custom code, e-commerce, webhooks and the rest of the Webflow Data API.",
        icons,
      },
    ),
  }),
);
