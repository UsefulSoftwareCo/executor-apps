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

const Member = object({ user_id: string() });

const pandadoc = defineProvider({
  name: "PandaDoc",
  hosts: ["api.pandadoc.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    oauth: oauth2({
      authorizationUrl: "https://app.pandadoc.com/oauth2/authorize",
      tokenUrl: "https://api.pandadoc.com/oauth2/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["read", "write"],
    }),
  },
  async health({ account, fetch, signal }) {
    const authorization =
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : `API-Key ${account.fields.token}`;
    const response = await fetch("https://api.pandadoc.com/public/v1/members/current", {
      signal,
      headers: { Authorization: authorization },
    });
    const me = await decodeJson(response, Member);
    return { accountInfo: { externalId: me.user_id } };
  },
});

export default defineApp(
  { user: { accounts: { pandadoc: pandadoc.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pandadoc ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "PandaDoc",
        description:
          "Create, send, track and e-sign documents with PandaDoc: documents, templates, contacts, content library, forms and webhooks.",
        icons,
      },
    ),
  }),
);
