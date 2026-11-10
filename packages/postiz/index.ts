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

const postiz = defineProvider({
  name: "Postiz",
  hosts: ["api.postiz.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Postiz has no client registration: the connect page asks for the client of an OAuth app
    // created in Settings > Developers > Apps. Postiz OAuth defines no scopes.
    oauth: oauth2({
      authorizationUrl: "https://platform.postiz.com/oauth/authorize",
      tokenUrl: "https://api.postiz.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.postiz.com/public/v1/me", {
      signal,
      headers: { Authorization: token },
    });
    const me = await decodeJson(response, object({ organization: object({ id: string(), name: string() }) }));
    return { accountInfo: { externalId: me.organization.id, displayName: me.organization.name } };
  },
});

export default defineApp(
  { user: { accounts: { postiz: postiz.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.postiz ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Postiz",
        description:
          "Schedule and publish social media posts with Postiz: channels, posts, media uploads, analytics, notifications and video clipping.",
        icons,
      },
    ),
  }),
);
