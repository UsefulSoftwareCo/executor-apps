import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const Me = object({ id: number(), email: string({ minLength: 1 }) });

const smartsheet = defineProvider({
  name: "Smartsheet",
  hosts: ["api.smartsheet.com", "app.smartsheet.com"],
  auth: {
    token: secrets({
      label: "API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Smartsheet has no dynamic registration: the connect page asks for a developer-app client.
    OAuth2: oauth2({
      authorizationUrl: "https://app.smartsheet.com/b/authorize",
      tokenUrl: "https://api.smartsheet.com/2.0/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "READ_SHEETS",
        "WRITE_SHEETS",
        "CREATE_SHEETS",
        "DELETE_SHEETS",
        "SHARE_SHEETS",
        "ADMIN_SHEETS",
        "READ_SIGHTS",
        "CREATE_SIGHTS",
        "DELETE_SIGHTS",
        "SHARE_SIGHTS",
        "ADMIN_SIGHTS",
        "ADMIN_WORKSPACES",
        "READ_CONTACTS",
        "READ_USERS",
        "ADMIN_USERS",
        "READ_EVENTS",
        "ADMIN_WEBHOOKS",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "OAuth2" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.smartsheet.com/2.0/users/me", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: String(me.id), username: me.email } };
  },
});

export default defineApp(
  { user: { accounts: { smartsheet: smartsheet.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.smartsheet ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Smartsheet",
        description:
          "Sheets, rows, columns, workspaces, reports, dashboards, users, sharing and webhooks in Smartsheet.",
        icons,
      },
    ),
  }),
);
