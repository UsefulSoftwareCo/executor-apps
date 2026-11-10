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

const Identity = object({ id: string(), name: string() });

const front = defineProvider({
  name: "Front",
  hosts: ["api2.frontapp.com", "app.frontapp.com"],
  auth: {
    token: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Front OAuth apps are created in Developers > Apps; scopes are fixed on the app, not requested.
    oauth: oauth2({
      authorizationUrl: "https://app.frontapp.com/oauth/authorize",
      tokenUrl: "https://app.frontapp.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api2.frontapp.com/me", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Identity);
    return { accountInfo: { externalId: me.id, username: me.name } };
  },
});

export default defineApp(
  { user: { accounts: { front: front.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.front ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Front",
        description:
          "Conversations, messages, drafts, inboxes, channels, contacts, tags, teammates, rules and the rest of the Front Core API.",
        icons,
      },
    ),
  }),
);
