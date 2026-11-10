import {
  accountRouter,
  array,
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

const fillout = defineProvider({
  name: "Fillout Forms",
  hosts: ["api.fillout.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Fillout OAuth apps: Settings > Developer > OAuth integrations. No scopes, refresh tokens or expiry are documented.
    oauth: oauth2({
      authorizationUrl: "https://app.zite.com/authorize/oauth",
      tokenUrl: "https://server.fillout.com/public/oauth/accessToken",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.fillout.com/v1/api/forms", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { fillout: fillout.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fillout ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Fillout Forms",
        description: "Fillout Forms: list forms, read and create submissions, and manage webhooks.",
        icons,
      },
    ),
  }),
);
