import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apiUrl, optionsFor, regionUrls } from "./openapi.js";

// The spec declares no required fields on the admin schema; only id and name are decoded, name for display.
const Me = object({ id: string(), name: string() });

const intercom = defineProvider({
  name: "Intercom",
  hosts: Object.values(regionUrls).map((url) => new URL(url).host),
  auth: {
    // Region is the workspace's data hosting region: us, eu or au.
    token: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }), region: plain(string({ minLength: 1 })) }),
    }),
    // Intercom has no client registration; the connect page asks for the app's client ID and secret.
    // Scopes come from the app's permissions in the Developer Hub, not from the authorize request.
    oauth: oauth2({
      authorizationUrl: "https://app.intercom.com/oauth",
      tokenUrl: "https://api.intercom.io/auth/eagle/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const region = account.method === "token" ? account.fields.region : "us";
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch(`${apiUrl(region)}/me`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Intercom-Version": "2.16" },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.id, displayName: me.name } };
  },
});

export default defineApp(
  { user: { accounts: { intercom: intercom.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.intercom ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...optionsFor(account.method === "token" ? account.fields.region : "us"),
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Intercom",
        description:
          "Contacts, companies, conversations, tickets, messages, articles, help center, data events, notes, tags and teams in Intercom.",
        icons,
      },
    ),
  }),
);
