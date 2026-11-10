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
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const slite = defineProvider({
  name: "Slite",
  hosts: ["api.slite.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.slite.com/v1/me", {
      signal,
      headers: { "x-slite-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

const mcpUrl = "https://api.slite.com/mcp";

// Slite's official MCP server uses OAuth with dynamic client registration (RFC 7591) at
// https://slite.com/api/mcp/oauth/register, so no user-created OAuth app is needed. Scopes are the
// scopes_supported list from https://api.slite.com/.well-known/oauth-protected-resource.
const sliteMcp = defineProvider({
  name: "Slite MCP",
  hosts: ["api.slite.com", "slite.com"],
  auth: {
    oauth: oauth2({ discover: mcpUrl, scopes: ["mcp:read", "mcp:write", "offline_access"] }),
  },
  health: (check) =>
    mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { slite: slite.many(), sliteMcp: sliteMcp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: router(
          await accountRouter(
            user?.accounts.slite ?? [],
            (account) =>
              withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                tool.kind === "mutation" ? always() : undefined,
              ),
            { signal },
          ),
          { title: "Slite REST API", description: "Notes, search, ask and custom index through Slite's REST API (API key)." },
        ),
        mcp: router(
          await accountRouter(
            user?.accounts.sliteMcp ?? [],
            async (account) =>
              withApprovals(
                await mcpRouter({
                  url: mcpUrl,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              ),
            { signal },
          ),
          {
            title: "Slite MCP",
            description:
              "Slite's official remote MCP server: notes, block-level editing, comments, channels, collections, move/restore, file upload and the Slite agent.",
          },
        ),
      },
      {
        title: "Slite",
        description:
          "Search, read, create and update notes in your Slite knowledge base and ask questions of it, through the REST API (api, API key) or Slite's official MCP server (mcp, OAuth).",
        icons,
      },
    ),
  }),
);
