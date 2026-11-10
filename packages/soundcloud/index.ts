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

const Me = object({ urn: string(), username: string(), permalink_url: string() });

const soundcloud = defineProvider({
  name: "SoundCloud",
  hosts: ["api.soundcloud.com", "secure.soundcloud.com"],
  auth: {
    // SoundCloud has no dynamic client registration: the connect page asks for an app's client.
    oauth: oauth2({
      authorizationUrl: "https://secure.soundcloud.com/authorize",
      tokenUrl: "https://secure.soundcloud.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.soundcloud.com/me", {
      signal,
      headers: { Authorization: `OAuth ${account.fields.access_token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: { externalId: me.urn, username: me.username, profileUrl: me.permalink_url },
    };
  },
});

export default defineApp(
  { user: { accounts: { soundcloud: soundcloud.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.soundcloud ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SoundCloud",
        description:
          "Search and read tracks, playlists and users, manage your uploads, likes, reposts, follows and comments through the SoundCloud public API.",
        icons,
      },
    ),
  }),
);
