import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Me = object({ id: string() });

const teams = defineProvider({
  name: "Microsoft Teams",
  hosts: ["graph.microsoft.com"],
  auth: {
    // Microsoft Entra v2.0 delegated flow. The connect page asks for the app registration's client.
    oauth: oauth2({
      authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "offline_access",
        "User.Read",
        "Presence.Read",
        "Presence.ReadWrite",
        "Team.ReadBasic.All",
        "Channel.ReadBasic.All",
        "ChannelMessage.Send",
        "Chat.Create",
        "Chat.ReadWrite",
        "ChatMessage.Read",
        "ChatMessage.Send",
        "OnlineMeetings.ReadWrite",
      ],
      authorizationParams: { response_mode: "query" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=id", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { teams: teams.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.teams ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Microsoft Teams",
        description:
          "Teams, channels, chats, messages, online meetings, presence and Teams apps through the Microsoft Graph API.",
        icons,
      },
    ),
  }),
);
