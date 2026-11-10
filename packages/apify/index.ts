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

const apify = defineProvider({
  name: "Apify",
  // console-backend.apify.com receives the OAuth code exchange and refresh requests.
  hosts: ["api.apify.com", "console-backend.apify.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Endpoints from https://api.apify.com/.well-known/oauth-authorization-server (RFC 8414).
    oauth: oauth2({
      authorizationUrl: "https://console.apify.com/authorize/oauth",
      tokenUrl: "https://console-backend.apify.com/oauth/apps/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["full_api_access"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.apify.com/v2/users/me", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({ data: object({ username: string() }) }));
  },
});

export default defineApp(
  { user: { accounts: { apify: apify.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.apify ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Apify",
        description: "Run Apify Actors and manage tasks, runs, datasets, key-value stores, request queues, schedules and webhooks.",
        icons,
      },
    ),
  }),
);
