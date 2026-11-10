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

const mcpUrl = "https://mcp.modem.dev/mcp";

const modem = defineProvider({
  name: "Modem",
  hosts: ["api.modem.dev"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.modem.dev/v1/whoami", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const body = await decodeJson(
      response,
      object({ organization: object({ id: string(), name: string(), slug: string() }) }),
    );
    return { accountInfo: { externalId: body.organization.id, displayName: body.organization.name } };
  },
});

// Modem's hosted MCP server uses OAuth with dynamic client registration. The authorization
// server is app.modem.dev/api/auth, which also handles token exchange and refresh.
const modemMcp = defineProvider({
  name: "Modem MCP",
  hosts: ["mcp.modem.dev", "app.modem.dev"],
  auth: {
    oauth: oauth2({ discover: mcpUrl }),
  },
  health: (check) =>
    mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { modem: modem.many(), modemMcp: modemMcp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: router(
          await accountRouter(
            user?.accounts.modem ?? [],
            (account) =>
              withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                tool.kind === "mutation" ? always() : undefined,
              ),
            { signal },
          ),
          {
            title: "Modem API",
            description: "Topics, people, companies, channels, stories and automations from the Modem REST API.",
          },
        ),
        mcp: router(
          await accountRouter(
            user?.accounts.modemMcp ?? [],
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
            title: "Modem MCP",
            description:
              "Modem's remote MCP server: natural-language search over customer feedback (search_modem) and the modem_agent_* tools that run Modem's agent against connected tools.",
          },
        ),
      },
      {
        title: "Modem",
        description:
          "Turn customer conversations into topics, people and company insights with Modem. Use api for the REST API (org API key) and mcp for search_modem and the Modem agent (OAuth).",
        icons,
      },
    ),
  }),
);
