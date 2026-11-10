import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Me = object({ data: object({ gid: string(), name: string() }) });

const asana = defineProvider({
  name: "Asana",
  hosts: ["app.asana.com"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Asana has no dynamic client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://app.asana.com/-/oauth_authorize",
      tokenUrl: "https://app.asana.com/-/oauth_token",
      revocationUrl: "https://app.asana.com/-/oauth_revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["default"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://app.asana.com/api/1.0/users/me?opt_fields=name", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.data.gid, username: me.data.name } };
  },
});

export default defineApp(
  { user: { accounts: { asana: asana.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.asana ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Asana",
        description:
          "Tasks, projects, portfolios, goals, teams, users, custom fields and the rest of the Asana REST API.",
        icons,
      },
    ),
  }),
);
