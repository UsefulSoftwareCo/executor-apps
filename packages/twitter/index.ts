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

const Me = object({ data: object({ id: string(), username: string() }) });

const twitter = defineProvider({
  name: "Twitter",
  hosts: ["api.x.com"],
  auth: {
    bearerToken: secrets({
      label: "App-only bearer token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // X offers no client registration: the connect page asks for an OAuth 2.0 app's client.
    oauth: oauth2({
      authorizationUrl: "https://x.com/i/oauth2/authorize",
      tokenUrl: "https://api.x.com/2/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "offline.access",
        "tweet.read",
        "tweet.write",
        "tweet.moderate.write",
        "users.read",
        "follows.read",
        "follows.write",
        "like.read",
        "like.write",
        "list.read",
        "list.write",
        "block.read",
        "block.write",
        "mute.read",
        "mute.write",
        "bookmark.read",
        "bookmark.write",
        "broadcast.read",
        "broadcast.write",
        "dm.read",
        "dm.write",
        "media.write",
        "space.read",
        "timeline.read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method !== "oauth") {
      // App-only tokens have no current user: probe a public read endpoint so a bad token fails.
      const probe = await fetch("https://api.x.com/2/users/by/username/X", {
        signal,
        headers: { Authorization: `Bearer ${account.fields.token}` },
      });
      const user = await decodeJson(probe, Me);
      return { accountInfo: { externalId: "app", username: `App-only token (verified via @${user.data.username})` } };
    }
    const response = await fetch("https://api.x.com/2/users/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: me.data.id,
        username: me.data.username,
        profileUrl: `https://x.com/${me.data.username}`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { twitter: twitter.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.twitter ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "X",
        description:
          "Posts, users, timelines, lists, bookmarks, direct messages, Spaces, Broadcasts and the rest of the X (Twitter) API v2.",
        icons,
      },
    ),
  }),
);
