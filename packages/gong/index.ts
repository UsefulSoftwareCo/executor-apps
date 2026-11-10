import {
  accountRouter,
  array,
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

const gong = defineProvider({
  name: "Gong",
  hosts: ["api.gong.io", "app.gong.io"],
  auth: {
    apiKey: secrets({
      label: "API access key and secret",
      fields: object({ accessKey: string({ minLength: 1 }), accessKeySecret: string({ minLength: 1 }) }),
    }),
    // Gong registers OAuth apps per company: the connect page asks for the app's client.
    oauth: oauth2({
      authorizationUrl: "https://app.gong.io/oauth2/authorize",
      tokenUrl: "https://app.gong.io/oauth2/generate-customer-token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "api:calls:read:basic",
        "api:calls:read:extensive",
        "api:calls:read:transcript",
        "api:calls:read:media-url",
        "api:calls:create",
        "api:users:read",
        "api:stats:user-actions",
        "api:stats:user-actions:detailed",
        "api:stats:interaction",
        "api:stats:scorecards",
        "api:settings:scorecards:read",
        "api:settings:trackers:read",
        "api:workspaces:read",
        "api:library:read",
        "api:coaching:read",
        "api:call-outcomes:read",
        "api:call-user-access:read",
        "api:call-user-access:write",
        "api:flows:read",
        "api:flows:write",
        "api:tasks:read",
        "api:tasks:write",
        "api:logs:read",
        "api:crm:get-objects",
        "api:crm:schema",
        "api:crm:upload",
        "api:crm:integrations:read",
        "api:crm:integration:register",
        "api:meetings:user:create",
        "api:meetings:user:update",
        "api:meetings:user:delete",
        "api:crm:integration:delete",
        "api:data-privacy:read",
        "api:data-privacy:delete",
        "api:meetings:integration:status",
        "api:engagement-data:write",
        "api:digital-interactions:write",
        "api:integration-settings:write",
      ],
    }),
  },
  // Gong has no current-user endpoint; listing users needs only api:users:read.
  async health({ account, fetch, signal }) {
    const authorization =
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : `Basic ${btoa(`${account.fields.accessKey}:${account.fields.accessKeySecret}`)}`;
    const response = await fetch("https://api.gong.io/v2/users", { signal, headers: { Authorization: authorization } });
    await decodeJson(response, object({ users: array(object({})) }));
    return {
      accountInfo: {
        displayName: "Gong",
        ...(account.method === "apiKey" ? { externalId: account.fields.accessKey } : {}),
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { gong: gong.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gong ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Gong",
        description:
          "Calls and transcripts, users, activity stats, scorecards, library folders, CRM uploads, Engage flows and tasks from the Gong API.",
        icons,
      },
    ),
  }),
);
