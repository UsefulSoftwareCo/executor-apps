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

const spotify = defineProvider({
  name: "Spotify",
  hosts: ["api.spotify.com", "accounts.spotify.com"],
  auth: {
    // Spotify has no dynamic client registration: the connect page asks for an app's client.
    oauth: oauth2({
      authorizationUrl: "https://accounts.spotify.com/authorize",
      tokenUrl: "https://accounts.spotify.com/api/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "user-read-private",
        "user-read-email",
        "user-library-read",
        "user-library-modify",
        "playlist-read-private",
        "playlist-read-collaborative",
        "playlist-modify-public",
        "playlist-modify-private",
        "user-follow-read",
        "user-follow-modify",
        "user-top-read",
        "user-read-recently-played",
        "user-read-playback-position",
        "user-read-playback-state",
        "user-read-currently-playing",
        "user-modify-playback-state",
        "ugc-image-upload",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.spotify.com/v1/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: me.id,
        username: me.id,
        profileUrl: `https://open.spotify.com/user/${me.id}`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { spotify: spotify.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.spotify ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Spotify",
        description:
          "Search the catalog, read and edit playlists and the saved library, and control playback through the Spotify Web API.",
        icons,
      },
    ),
  }),
);
