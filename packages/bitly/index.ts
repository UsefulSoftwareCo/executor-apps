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

const User = object({ login: string() });

const bitly = defineProvider({
  name: "Bitly",
  hosts: ["api-ssl.bitly.com"],
  auth: {
    apiKey: secrets({
      label: "Generic access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Bitly lets users register their own OAuth app; the connect page asks for its client.
    oauth: oauth2({
      discover: "https://api-ssl.bitly.com",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api-ssl.bitly.com/v4/user", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: me.login, username: me.login } };
  },
});

export default defineApp(
  { user: { accounts: { bitly: bitly.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bitly ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Bitly",
        description:
          "Shorten and manage links, branded short domains, QR codes, campaigns and click analytics with Bitly.",
        icons,
      },
    ),
  }),
);
