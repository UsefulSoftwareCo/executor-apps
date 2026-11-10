import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  number,
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

// The vendor schema marks `user.email` and `account.id` as required.
const Me = object({ user: object({ email: string() }), account: object({ id: number() }) });

const kit = defineProvider({
  name: "Kit",
  hosts: ["api.kit.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Token endpoint client auth (client_secret_post) and body format (json) are inferred: Kit's docs do not state them.
    // Kit apps are created in the creator's Kit account; the connect page asks for the app's client.
    oauth: oauth2({
      authorizationUrl: "https://api.kit.com/v4/oauth/authorize",
      tokenUrl: "https://api.kit.com/v4/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "X-Kit-Api-Key": account.fields.token };
    const response = await fetch("https://api.kit.com/v4/account", { signal, headers });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: String(me.account.id), username: me.user.email } };
  },
});

export default defineApp(
  { user: { accounts: { kit: kit.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kit ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Kit",
        description:
          "Email marketing with Kit: subscribers, tags, forms, sequences, broadcasts, custom fields, purchases and webhooks.",
        icons,
      },
    ),
  }),
);
