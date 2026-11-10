import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

// The spec's User schema has no required list; id is the primary key and always present.
const User = object({ id: number() });

const sendfox = defineProvider({
  name: "SendFox",
  hosts: ["api.sendfox.com", "sendfox.com"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // SendFox has no shared app: the connect page asks for the user's own OAuth client.
    oauth: oauth2({
      authorizationUrl: "https://sendfox.com/oauth/authorize",
      tokenUrl: "https://sendfox.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["transactional:send", "transactional:read"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.sendfox.com/me", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: String(me.id) } };
  },
});

export default defineApp(
  { user: { accounts: { sendfox: sendfox.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sendfox ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SendFox",
        description:
          "Manage SendFox email marketing: contacts, lists, tags, campaigns, forms, automations, domains and transactional email.",
        icons,
      },
    ),
  }),
);
