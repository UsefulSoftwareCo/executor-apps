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

const User = object({ username: string(), account_type: string() });

const pinterest = defineProvider({
  name: "Pinterest",
  hosts: ["api.pinterest.com"],
  auth: {
    token: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Pinterest apps are created at developers.pinterest.com; the connect page asks for the client.
    oauth: oauth2({
      authorizationUrl: "https://www.pinterest.com/oauth/",
      tokenUrl: "https://api.pinterest.com/v5/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopeSeparator: ",",
      scopes: [
        "user_accounts:read",
        "user_accounts:write",
        "boards:read",
        "boards:read_secret",
        "boards:write",
        "boards:write_secret",
        "pins:read",
        "pins:read_secret",
        "pins:write",
        "pins:write_secret",
        "ads:read",
        "ads:write",
        "catalogs:read",
        "catalogs:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.pinterest.com/v5/user_account", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: me.username, username: me.username } };
  },
});

export default defineApp(
  { user: { accounts: { pinterest: pinterest.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pinterest ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Pinterest",
        description:
          "Pinterest pins, boards, user accounts, ad accounts and campaigns, catalogs, analytics and conversion events.",
        icons,
      },
    ),
  }),
);
