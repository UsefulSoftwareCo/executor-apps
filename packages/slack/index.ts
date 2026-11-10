import {
  accountRouter,
  boolean,
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

// Slack answers HTTP 200 with {ok:false,error} for bad tokens, so decode `ok` first and only
// then rely on the fields that are present on success.
const Auth = object({
  ok: boolean(),
  error: string().optional(),
  user_id: string().optional(),
  user: string().optional(),
  url: string().optional(),
});

const slack = defineProvider({
  name: "Slack",
  hosts: ["slack.com"],
  auth: {
    token: secrets({
      label: "Bot or user token (xoxb-/xoxp-)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Slack offers no client registration: the connect page asks for a Slack app's client.
    oauth: oauth2({
      authorizationUrl: "https://slack.com/oauth/v2/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.access",
      tokenEndpointAuthMethod: "client_secret_post",
      scopeSeparator: ",",
      scopes: [
        "channels:read",
        "channels:history",
        "channels:join",
        "channels:manage",
        "groups:read",
        "groups:history",
        "im:read",
        "im:history",
        "im:write",
        "mpim:read",
        "mpim:history",
        "chat:write",
        "reactions:read",
        "reactions:write",
        "pins:read",
        "pins:write",
        "files:read",
        "files:write",
        "users:read",
        "users:read.email",
        "users.profile:read",
        "usergroups:read",
        "team:read",
        "emoji:read",
        "bookmarks:read",
        "bookmarks:write",
        "reminders:read",
        "reminders:write",
        "canvases:read",
        "canvases:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://slack.com/api/auth.test", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, Auth);
    if (!me.ok || me.user_id === undefined) {
      throw new Error(`Slack auth.test failed: ${me.error ?? "unknown_error"}`);
    }
    return { accountInfo: { externalId: me.user_id, username: me.user, profileUrl: me.url } };
  },
});

export default defineApp(
  { user: { accounts: { slack: slack.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.slack ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Slack",
        description:
          "Channels, messages, threads, users, files, reactions, search and the rest of the Slack Web API.",
        icons,
      },
    ),
  }),
);
