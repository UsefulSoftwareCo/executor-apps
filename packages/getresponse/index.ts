import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const getresponse = defineProvider({
  name: "GetResponse",
  hosts: ["api.getresponse.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Users register their own OAuth app in GetResponse; the connect page asks for its client.
    oauth: oauth2({
      authorizationUrl: "https://app.getresponse.com/oauth2_authorize.html",
      tokenUrl: "https://api.getresponse.com/v3/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      tokenRequestFormat: "form",
      scopes: ["all"],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "X-Auth-Token": `api-key ${account.fields.token}` };
    const response = await fetch("https://api.getresponse.com/v3/accounts", { signal, headers });
    // The spec's Account schema marks no field required, so only check for a JSON object.
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { getresponse: getresponse.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.getresponse ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "GetResponse",
        description:
          "Email marketing with GetResponse: contacts, lists, newsletters, autoresponders, automation, landing pages, webinars and ecommerce.",
        icons,
      },
    ),
  }),
);
