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

const discord = defineProvider({
  name: "Discord",
  hosts: ["discord.com"],
  auth: {
    botToken: secrets({
      label: "Bot token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Discord has no client registration: the connect page asks for an application's client.
    oauth: oauth2({
      authorizationUrl: "https://discord.com/oauth2/authorize",
      tokenUrl: "https://discord.com/api/oauth2/token",
      revocationUrl: "https://discord.com/api/oauth2/token/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["identify", "guilds", "guilds.members.read", "connections"],
    }),
  },
  async health({ account, fetch, signal }) {
    const authorization =
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : `Bot ${account.fields.token}`;
    // /users/@me works for both bot tokens and OAuth2 tokens with the identify scope.
    const response = await fetch("https://discord.com/api/v10/users/@me", {
      signal,
      headers: { Authorization: authorization },
    });
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: me.id, username: me.username } };
  },
});

export default defineApp(
  { user: { accounts: { discord: discord.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.discord ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Discord",
        description:
          "Guilds, channels, messages, members, roles, threads, webhooks, application commands and the rest of the Discord REST API.",
        icons,
      },
    ),
  }),
);
