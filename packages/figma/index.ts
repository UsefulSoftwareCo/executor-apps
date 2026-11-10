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

const Me = object({ id: string(), handle: string(), img_url: string() });

const figma = defineProvider({
  name: "Figma",
  hosts: ["api.figma.com"],
  auth: {
    token: secrets({
      label: "Personal or plan access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Figma offers no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://www.figma.com/oauth",
      tokenUrl: "https://api.figma.com/v1/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopeSeparator: ",",
      scopes: [
        "current_user:read",
        "file_content:read",
        "file_metadata:read",
        "file_comments:read",
        "file_comments:write",
        "file_dev_resources:read",
        "file_dev_resources:write",
        "file_versions:read",
        "library_assets:read",
        "library_content:read",
        "team_library_content:read",
        "projects:read",
        "folders:read",
        "folder_metadata:read",
        "webhooks:read",
        "webhooks:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "X-Figma-Token": `${account.fields.token}` };
    const response = await fetch("https://api.figma.com/v1/me", { signal, headers });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.id, username: me.handle, avatarUrl: me.img_url } };
  },
});

export default defineApp(
  { user: { accounts: { figma: figma.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.figma ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Figma",
        description:
          "Design files, nodes, image export, comments, components, styles, projects, dev resources, webhooks and variables.",
        icons,
      },
    ),
  }),
);
