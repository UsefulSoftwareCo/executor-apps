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

const constantcontact = defineProvider({
  name: "Constant Contact",
  hosts: ["api.cc.email", "authz.constantcontact.com"],
  auth: {
    // Constant Contact has no API-key-only access any more: users register an application in the
    // V3 developer portal and the connect page asks for its client id and secret.
    oauth: oauth2({
      authorizationUrl: "https://authz.constantcontact.com/oauth2/default/v1/authorize",
      tokenUrl: "https://authz.constantcontact.com/oauth2/default/v1/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["account_read", "account_update", "contact_data", "campaign_data", "offline_access"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.cc.email/v3/account/summary", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { constantcontact: constantcontact.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.constantcontact ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Constant Contact",
        description:
          "Contacts, lists, tags, custom fields, email campaigns, reports, segments and bulk activities in Constant Contact.",
        icons,
      },
    ),
  }),
);
