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

const Me = object({ account: object({ uuid: string(), email: string() }) });

const digitalocean = defineProvider({
  name: "DigitalOcean",
  hosts: ["api.digitalocean.com", "cloud.digitalocean.com"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    oauth: oauth2({
      authorizationUrl: "https://cloud.digitalocean.com/v1/oauth/authorize",
      tokenUrl: "https://cloud.digitalocean.com/v1/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["api:read", "api:write"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.digitalocean.com/v2/account", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.account.uuid, username: me.account.email } };
  },
});

export default defineApp(
  { user: { accounts: { digitalocean: digitalocean.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.digitalocean ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "DigitalOcean",
        description:
          "Droplets, Kubernetes, databases, Spaces, domains, networking, App Platform and the rest of the DigitalOcean API.",
        icons,
      },
    ),
  }),
);
