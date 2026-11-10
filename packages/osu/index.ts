import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const Me = object({ id: number(), username: string(), avatar_url: string() });

const osu = defineProvider({
  name: "osu!",
  hosts: ["osu.ppy.sh"],
  auth: {
    // osu! has no key auth for users; each user registers an OAuth application in account settings.
    oauth: oauth2({
      authorizationUrl: "https://osu.ppy.sh/oauth/authorize",
      tokenUrl: "https://osu.ppy.sh/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["identify", "public", "friends.read", "forum.write"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://osu.ppy.sh/api/v2/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: String(me.id),
        username: me.username,
        avatarUrl: me.avatar_url,
        profileUrl: `https://osu.ppy.sh/users/${me.id}`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { osu: osu.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.osu ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "osu!",
        description:
          "Users, beatmaps, beatmapsets, scores, rankings, multiplayer matches, chat, forum and news from the osu! API v2.",
        icons,
      },
    ),
  }),
);
