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

const mcpUrl = "https://mcp.perigon.io/v1/mcp";

const perigon = defineProvider({
  name: "Perigon",
  hosts: ["api.perigon.io", "mcp.perigon.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Official hosted MCP server: OAuth authorization code with PKCE S256 and dynamic client
    // registration, discovered from the server's metadata. The token is documented only for
    // mcp.perigon.io, so OAuth accounts get the MCP tools and not the REST tools.
    oauth: oauth2({ discover: "https://mcp.perigon.io" }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, {
        url: mcpUrl,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
    }
    // /v1/limits is quota-exempt and meant for health probes.
    const response = await fetch("https://api.perigon.io/v1/limits", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ data: object({}) }));
  },
});

const mcpApprovals = <T extends Parameters<typeof withApprovals>[0]>(tools: T) =>
  withApprovals(tools, (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()));

export default defineApp(
  { user: { accounts: { perigon: perigon.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.perigon ?? [],
        async (account) => {
          if (account.method === "oauth") {
            return mcpApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
            );
          }
          return router({
            api: withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
            mcp: mcpApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.token}` },
                signal,
              }),
            ),
          });
        },
        { signal },
      ),
      {
        title: "Perigon",
        description:
          "Perigon news and web intelligence: articles, stories, companies, people, journalists, sources, topics, Wikipedia, summaries and monitors, plus the official MCP server's signal insights tools.",
        icons,
      },
    ),
  }),
);
