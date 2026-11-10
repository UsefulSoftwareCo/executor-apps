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
import { options } from "./openapi.js";

const UserInfo = object({ sub: string() });

const googleAppsScript = defineProvider({
  name: "Google Apps Script",
  hosts: ["script.googleapis.com", "openidconnect.googleapis.com"],
  auth: {
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: ["openid", "email", "profile",
        "https://www.googleapis.com/auth/script.projects",
        "https://www.googleapis.com/auth/script.deployments",
        "https://www.googleapis.com/auth/script.processes",
        "https://www.googleapis.com/auth/script.metrics",
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
  { user: { accounts: { googleAppsScript: googleAppsScript.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.googleAppsScript ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Google Apps Script",
        description:
          "Manage Apps Script projects, source, versions and deployments; read processes and metrics.",
        icons,
      },
    ),
  }),
);
