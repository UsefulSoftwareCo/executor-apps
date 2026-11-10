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

const User = object({ id: string(), username: string() });

const zeplin = defineProvider({
  name: "Zeplin",
  hosts: ["api.zeplin.dev"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Zeplin has no dynamic registration: the connect page asks for the OAuth app's client.
    // Zeplin documents no scopes.
    oauth: oauth2({
      authorizationUrl: "https://api.zeplin.dev/v1/oauth/authorize",
      tokenUrl: "https://api.zeplin.dev/v1/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.zeplin.dev/v1/users/me", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: me.id, username: me.username } };
  },
});

export default defineApp(
  { user: { accounts: { zeplin: zeplin.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zeplin ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Zeplin",
        description:
          "Zeplin projects, screens, components, styleguides, design tokens, notes, members and webhooks.",
        icons,
      },
    ),
  }),
);
