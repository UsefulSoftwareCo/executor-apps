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

const Caller = object({ accountId: string() });

const launchdarkly = defineProvider({
  name: "LaunchDarkly",
  hosts: ["app.launchdarkly.com"],
  auth: {
    apiKey: secrets({
      label: "API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // LaunchDarkly OAuth clients are registered through its API; the connect page asks for the client.
    oauth: oauth2({
      discover: "https://app.launchdarkly.com",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["reader", "writer", "offline_access"],
    }),
  },
  async health({ account, fetch, signal }) {
    const authorization =
      account.method === "oauth" ? `Bearer ${account.fields.access_token}` : account.fields.token;
    const response = await fetch("https://app.launchdarkly.com/api/v2/caller-identity", {
      signal,
      headers: { Authorization: authorization },
    });
    const me = await decodeJson(response, Caller);
    return { accountInfo: { externalId: me.accountId } };
  },
});

export default defineApp(
  { user: { accounts: { launchdarkly: launchdarkly.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.launchdarkly ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "LaunchDarkly",
        description:
          "Feature flags, projects, environments, segments, experiments, members and the rest of the LaunchDarkly REST API.",
        icons,
      },
    ),
  }),
);
