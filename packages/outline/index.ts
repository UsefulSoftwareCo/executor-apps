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

const AuthInfo = object({ data: object({ user: object({ id: string(), name: string() }) }) });

const outline = defineProvider({
  name: "Outline",
  hosts: ["app.getoutline.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The connect page takes a client the user created manually under Outline's Applications settings.
    oauth: oauth2({
      authorizationUrl: "https://app.getoutline.com/oauth/authorize",
      tokenUrl: "https://app.getoutline.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["read", "write"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://app.getoutline.com/api/auth.info", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
    });
    const info = await decodeJson(response, AuthInfo);
    return { accountInfo: { externalId: info.data.user.id, username: info.data.user.name } };
  },
});

export default defineApp(
  { user: { accounts: { outline: outline.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.outline ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Outline",
        description: "Outline team knowledge base: documents, collections, comments, shares, users, groups and search.",
        icons,
      },
    ),
  }),
);
