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

const mcpUrl = "https://api.apiverve.com/v1/mcp";

const apiverve = defineProvider({
  name: "APIVerve",
  hosts: ["api.apiverve.com"],
  auth: {
    // The key goes in the x-api-key header, same as the REST API.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The MCP server publishes OAuth metadata with dynamic client registration and PKCE S256.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account } = check;
    return mcpHealth(check, {
      url: mcpUrl,
      headers:
        account.method === "oauth"
          ? { Authorization: `Bearer ${account.fields.access_token}` }
          : { "x-api-key": account.fields.token },
    });
  },
});

export default defineApp(
  { user: { accounts: { apiverve: apiverve.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.apiverve ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({
              url: mcpUrl,
              account,
              headers:
                account.method === "oauth"
                  ? { Authorization: `Bearer ${account.fields.access_token}` }
                  : { "x-api-key": account.fields.token },
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "APIVerve",
        description:
          "Call APIVerve's catalog of 370+ ready-made APIs (email and phone validation, geolocation, weather, currency, text and image utilities, and more) as tools.",
        icons,
      },
    ),
  }),
);
