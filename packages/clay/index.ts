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

const mcpUrl = "https://api.clay.com/v3/mcp";

const clay = defineProvider({
  name: "Clay",
  hosts: ["api.clay.com"],
  auth: {
    // Personal API key for the public REST API (clay-api-key header).
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The hosted MCP server publishes OAuth metadata with dynamic client registration.
    oauth: oauth2({ discover: mcpUrl, resource: mcpUrl }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch("https://api.clay.com/public/v0/me", {
      signal,
      headers: { "clay-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

// The API tools need an API key and the MCP tools need an OAuth sign-in, so each sub-router
// mounts only for accounts that use its method.
export default defineApp(
  { user: { accounts: { clay: clay.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: router(
          await accountRouter(
            user?.accounts.clay ?? [],
            (account) =>
              account.method === "apiKey"
                ? withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                    tool.kind === "mutation" ? always() : undefined,
                  )
                : router({}),
            { signal },
          ),
          {
            title: "Clay API",
            description:
              "Run Clay routines and batch runs, search people and companies, query workspace tables and workflow runs, and check credit balance. Needs an API key account.",
          },
        ),
        mcp: router(
          await accountRouter(
            user?.accounts.clay ?? [],
            async (account) =>
              account.method === "oauth"
                ? withApprovals(
                    await mcpRouter({
                      url: mcpUrl,
                      account,
                      headers: { Authorization: `Bearer ${account.fields.access_token}` },
                      signal,
                    }),
                    (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
                  )
                : router({}),
            { signal },
          ),
          {
            title: "Clay MCP",
            description: "Clay's hosted MCP server: company and contact research, enrichment providers and functions. Needs an OAuth account.",
          },
        ),
      },
      {
        title: "Clay",
        description:
          "Run Clay routines, search people and companies, query tables and workflow runs through the public API (api, API key), plus research and enrichment through Clay's MCP server (mcp, OAuth).",
        icons,
      },
    ),
  }),
);
