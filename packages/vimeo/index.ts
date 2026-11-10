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

const Me = object({ uri: string(), name: string() });

const vimeo = defineProvider({
  name: "Vimeo",
  hosts: ["api.vimeo.com"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Vimeo offers no client registration: the connect page asks for an app's client.
    oauth: oauth2({
      authorizationUrl: "https://api.vimeo.com/oauth/authorize",
      tokenUrl: "https://api.vimeo.com/oauth/access_token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopeSeparator: " ",
      scopes: [
        "public",
        "private",
        "email",
        "create",
        "edit",
        "delete",
        "interact",
        "upload",
        "stats",
        "video_files",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.vimeo.com/me", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.vimeo.*+json;version=3.4" },
    });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: me.uri,
        username: me.name,
        profileUrl: `https://vimeo.com${me.uri.replace("/users/", "/user")}`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { vimeo: vimeo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vimeo ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Vimeo",
        description:
          "Videos, folders, albums, channels, showcases, live events, comments, text tracks, analytics and the rest of the Vimeo API.",
        icons,
      },
    ),
  }),
);
