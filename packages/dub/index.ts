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
import { oauthOptions, options } from "./openapi.js";

const dub = defineProvider({
  name: "Dub",
  hosts: ["api.dub.co"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Dub has no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://app.dub.co/oauth/authorize",
      tokenUrl: "https://api.dub.co/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes: [
        "links.read",
        "links.write",
        "tags.read",
        "tags.write",
        "analytics.read",
        "domains.read",
        "domains.write",
        "folders.read",
        "folders.write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.dub.co/tags?pageSize=1", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { dub: dub.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dub ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...(account.method === "oauth" ? oauthOptions : options), cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Dub",
        description:
          "Short links, tags, domains, folders, click analytics, conversion tracking, customers, partners, commissions and payouts on Dub.",
        icons,
      },
    ),
  }),
);
