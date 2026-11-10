import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { adminOptions, dataOptions } from "./openapi.js";

const UserInfo = object({ sub: string() });

const googleAnalytics = defineProvider({
  name: "Google Analytics",
  hosts: ["analyticsdata.googleapis.com", "analyticsadmin.googleapis.com", "openidconnect.googleapis.com"],
  auth: {
    // Google has no dynamic client registration: the connect page asks for a Google Cloud OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/analytics.edit",
      ],
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, UserInfo);
    return { accountInfo: { externalId: me.sub } };
  },
});

export default defineApp(
  { user: { accounts: { googleAnalytics: googleAnalytics.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.googleAnalytics ?? [],
        (account) =>
          router({
            data: withApprovals(
              router(liveOpenapiRouter({ ...dataOptions, cache, fetch, signal, account }), {
                title: "Reporting (Data API)",
                description: "Run reports, pivot and realtime reports, check compatibility, read metadata, and export audiences.",
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            ),
            admin: withApprovals(
              router(liveOpenapiRouter({ ...adminOptions, cache, fetch, signal, account }), {
                title: "Administration (Admin API)",
                description: "Accounts, properties, data streams, key events, custom dimensions and metrics, Firebase and Google Ads links, conversion events, data retention, and access reports.",
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            ),
          }),
        { signal },
      ),
      {
        title: "Google Analytics",
        description: "Google Analytics 4 reports, realtime data, audience exports, and property administration.",
        icons,
      },
    ),
  }),
);
