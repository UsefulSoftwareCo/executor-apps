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
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { analyticsOptions, externalOptions, options, staticExportOptions } from "./openapi.js";

const mcpUrl = "https://mcp.mintlify.com";

const mintlify = defineProvider({
  name: "Mintlify",
  hosts: ["api.mintlify.com", "mcp.mintlify.com"],
  auth: {
    apiKey: secrets({
      label: "Admin API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Admin MCP server: OAuth with dynamic client registration. Scopes exclude members, billing,
    // integrations and deployment writes, which the server would otherwise request by default.
    oauth: oauth2({
      discover: mcpUrl,
      scopes: [
        "docs:read",
        "docs:write",
        "nav:write",
        "config:write",
        "session:write",
        "deployment:read",
        "analytics:read",
        "offline_access",
      ],
    }),
  },
  // Every Mintlify REST endpoint is scoped to a project id and there is no current-account endpoint,
  // so list agent jobs for a placeholder project. 401 and 403 mean the key is rejected or lacks access;
  // the placeholder project itself is expected to answer 404 (or 2xx); anything else is a failure.
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, {
        url: mcpUrl,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
    }
    const response = await fetch("https://api.mintlify.com/v1/agent/health-check/jobs", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (response.status === 401) throw new Error("Mintlify rejected the API key (401)");
    if (response.status === 403) throw new Error("Mintlify API key lacks access (403)");
    if (!response.ok && response.status !== 404) {
      throw new Error(`Mintlify health check failed (${response.status})`);
    }
  },
});

export default defineApp(
  { user: { accounts: { mintlify: mintlify.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mintlify ?? [],
        async (account) => {
          if (account.method === "oauth") {
            return withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            );
          }
          const mount = (spec: typeof options | typeof externalOptions | typeof analyticsOptions | typeof staticExportOptions) =>
            withApprovals(liveOpenapiRouter({ ...spec, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router({
            admin: mount(options),
            project: mount(externalOptions),
            analytics: mount(analyticsOptions),
            staticExport: mount(staticExportOptions),
          });
        },
        { signal },
      ),
      {
        title: "Mintlify",
        description:
          "Manage Mintlify documentation sites: trigger deployments and previews, run workflows, drive the docs agent, create static exports and read analytics. Connect with OAuth to use the admin MCP server to edit pages, navigation and config.",
        icons,
      },
    ),
  }),
);
