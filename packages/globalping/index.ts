import {
  accountRouter,
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
import { icons } from "./icon.js";

const mcpUrl = "https://mcp.globalping.dev/mcp";

const globalping = defineProvider({
  name: "Globalping",
  hosts: ["mcp.globalping.dev"],
  auth: {
    // Official hosted MCP server: OAuth with dynamic client registration and PKCE S256, scope "measurements".
    oauth: oauth2({ discover: mcpUrl }),
    // Headless fallback documented by the vendor: a dashboard API token sent as a bearer header.
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health(check) {
    const { account } = check;
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${token}` } });
  },
});

export default defineApp(
  { user: { accounts: { globalping: globalping.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.globalping ?? [],
        async (account) => {
          const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
          return withApprovals(
            await mcpRouter({
              url: mcpUrl,
              account,
              headers: { Authorization: `Bearer ${token}` },
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          );
        },
        { signal },
      ),
      {
        title: "Globalping",
        description:
          "Run ping, traceroute, MTR, DNS and HTTP measurements from probes around the world, fetch results, compare locations, and check probe locations and rate limits.",
        icons,
      },
    ),
  }),
);
