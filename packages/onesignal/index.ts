import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  toolAnnotations,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const mcpUrl = "https://api.onesignal.com/mcp/oauth";

const onesignalMcp = defineProvider({
  name: "OneSignal MCP",
  hosts: ["api.onesignal.com"],
  auth: { oauth: oauth2({ discover: "https://api.onesignal.com" }) },
  health: (check) =>
    mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

const onesignal = defineProvider({
  name: "OneSignal",
  hosts: ["api.onesignal.com"],
  auth: {
    appKey: secrets({
      label: "App API key",
      fields: object({ token: string({ minLength: 1 }), appId: string({ minLength: 1 }) }),
    }),
    organizationKey: secrets({
      label: "Organization API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // An organization key lists apps; an app key can list its own app's notifications.
    const url =
      account.method === "appKey"
        ? `https://api.onesignal.com/notifications?app_id=${encodeURIComponent(account.fields.appId)}&limit=1`
        : "https://api.onesignal.com/apps";
    const response = await fetch(url, {
      signal,
      headers: { Authorization: `Key ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { onesignal: onesignal.many(), mcp: onesignalMcp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        rest: await accountRouter(
          user?.accounts.onesignal ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        mcp: await accountRouter(
          user?.accounts.mcp ?? [],
          async (account) =>
            withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                cache,
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            ),
          { signal },
        ),
      },
      {
        title: "OneSignal",
        description:
          "Send push notifications, email and SMS; manage apps, users, subscriptions, segments, outcomes and live activities.",
        icons,
      },
    ),
  }),
);
