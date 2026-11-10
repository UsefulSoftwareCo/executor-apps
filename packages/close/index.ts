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

const close = defineProvider({
  name: "Close",
  hosts: ["api.close.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Close offers no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://app.close.com/oauth2/authorize/",
      tokenUrl: "https://api.close.com/oauth2/token/",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["all.full_access", "offline_access"],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { Authorization: `Basic ${btoa(`${account.fields.token}:`)}` };
    const response = await fetch("https://api.close.com/api/v1/me/", { signal, headers });
    const me = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { close: close.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.close ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Close",
        description:
          "Close CRM: leads, contacts, opportunities, calls, emails, SMS, notes, tasks, sequences and custom fields.",
        icons,
      },
    ),
  }),
);
