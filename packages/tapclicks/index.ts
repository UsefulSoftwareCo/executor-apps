import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  oauth2,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const tapclicks = defineProvider({
  name: "TapClicks",
  hosts: ["api.tapclicks.com"],
  auth: {
    // API credentials are requested from TapClicks through the form linked in its API docs; the client id and
    // secret are exchanged for a bearer token (client credentials, sent in the request body).
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.tapclicks.com/oauth/accesstoken",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.tapclicks.com/v2/clients", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: "tapclicks", displayName: "TapClicks" } };
  },
});

export default defineApp(
  { user: { accounts: { tapclicks: tapclicks.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tapclicks ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "TapClicks",
        description:
          "TapClicks marketing reporting platform: clients, client groups, clusters, services and data views, users, roles, executive summaries, leads and orders.",
        icons,
      },
    ),
  }),
);
