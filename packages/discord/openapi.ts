import type { OpenapiToolNamesOptions } from "apps/openapi";

// Discord's official OpenAPI 3.1 description (discord/discord-api-spec). Bot tokens go in the
// Authorization header as `Bot <token>`; OAuth2 access tokens use the standard bearer form.
// Operations whose OAuth2 requirement needs a scope this package does not request (or declares no
// scope at all). The apps openapi options have no scope filter, so patches strip them from the OAuth
// method: bot-token operations keep only BotToken security, OAuth-only ones are removed. Requested
// OAuth scopes: identify, guilds, guilds.members.read, connections.
// [path, method, removeOperation]
const outOfScope: readonly (readonly [string, string, boolean])[] = [
  ["/applications/{application_id}/attachment", "post", false],
  ["/applications/{application_id}/commands", "get", false],
  ["/applications/{application_id}/commands", "put", false],
  ["/applications/{application_id}/commands", "post", false],
  ["/applications/{application_id}/commands/{command_id}", "get", false],
  ["/applications/{application_id}/commands/{command_id}", "delete", false],
  ["/applications/{application_id}/commands/{command_id}", "patch", false],
  ["/applications/{application_id}/entitlements", "get", false],
  ["/applications/{application_id}/entitlements/{entitlement_id}", "get", false],
  ["/applications/{application_id}/entitlements/{entitlement_id}", "delete", false],
  ["/applications/{application_id}/entitlements/{entitlement_id}/consume", "post", false],
  ["/applications/{application_id}/guilds/{guild_id}/commands", "get", false],
  ["/applications/{application_id}/guilds/{guild_id}/commands", "put", false],
  ["/applications/{application_id}/guilds/{guild_id}/commands", "post", false],
  ["/applications/{application_id}/guilds/{guild_id}/commands/permissions", "get", false],
  ["/applications/{application_id}/guilds/{guild_id}/commands/{command_id}", "get", false],
  ["/applications/{application_id}/guilds/{guild_id}/commands/{command_id}", "delete", false],
  ["/applications/{application_id}/guilds/{guild_id}/commands/{command_id}", "patch", false],
  ["/applications/{application_id}/guilds/{guild_id}/commands/{command_id}/permissions", "get", false],
  ["/applications/{application_id}/guilds/{guild_id}/commands/{command_id}/permissions", "put", false],
  ["/channels/{channel_id}/messages", "get", false],
  ["/guilds/{guild_id}/channels", "get", false],
  ["/guilds/{guild_id}/messages/search", "get", false],
  ["/lobbies", "put", false],
  ["/lobbies/{lobby_id}/channel-linking", "patch", false],
  ["/lobbies/{lobby_id}/members/@me", "delete", false],
  ["/lobbies/{lobby_id}/members/@me/invites", "post", false],
  ["/lobbies/{lobby_id}/messages", "get", false],
  ["/lobbies/{lobby_id}/messages", "post", false],
  ["/oauth2/@me", "get", false],
  ["/oauth2/userinfo", "get", false],
  ["/skus/{sku_id}/subscriptions", "get", false],
  ["/skus/{sku_id}/subscriptions/{subscription_id}", "get", false],
  ["/users/@me/applications/{application_id}/entitlements", "get", true],
  ["/users/@me/applications/{application_id}/role-connection", "get", true],
  ["/users/@me/applications/{application_id}/role-connection", "put", true],
  ["/users/@me/applications/{application_id}/role-connection", "delete", true],
];

const pointer = (segment: string) => segment.replaceAll("~", "~0").replaceAll("/", "~1");

export const options = {
  source: {
    url: "https://raw.githubusercontent.com/discord/discord-api-spec/main/specs/openapi.json",
  },
  allowedOrigin: "https://discord.com",
  securitySchemes: {
    BotToken: { type: "apiKey", name: "Authorization", in: "header" },
    OAuth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    botToken: [{ scheme: "BotToken", field: "token", part: "value", prefix: "Bot " }],
    oauth: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches: outOfScope.map(([path, method, remove]) =>
    remove
      ? { op: "remove" as const, path: `/paths/${pointer(path)}/${method}` }
      : {
          op: "replace" as const,
          path: `/paths/${pointer(path)}/${method}/security`,
          value: [{ BotToken: [] }],
        },
  ),
} satisfies OpenapiToolNamesOptions;
