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

const Channels = object({ kind: string() });

const youtube = defineProvider({
  name: "YouTube",
  hosts: ["youtube.googleapis.com"],
  auth: {
    // A Google Cloud API key reads public data only; writes and private data need OAuth.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: [
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/youtube.force-ssl",
      ],
      // Google issues refresh tokens only when asked for offline access.
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    // OAuth lists the caller's own channels; an API key can only read public data, so it
    // lists video categories. "kind" is always present in a list response.
    const request =
      account.method === "oauth"
        ? fetch("https://youtube.googleapis.com/youtube/v3/channels?part=id&mine=true&maxResults=1", {
            signal,
            headers: { Authorization: `Bearer ${account.fields.access_token}` },
          })
        : fetch(
            `https://youtube.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=US&key=${encodeURIComponent(account.fields.token)}`,
            { signal },
          );
    const response = await request;
    await decodeJson(response, Channels);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { youtube: youtube.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.youtube ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "YouTube",
        description:
          "Videos, channels, playlists, comments, captions, subscriptions and live broadcasts on YouTube.",
        icons,
      },
    ),
  }),
);
