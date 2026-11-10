import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { liveOpenapiRouter } from "apps/openapi";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { options, streamsOptions, webhooksOptions } from "./openapi.js";

const url = "https://mcp.quicknode.com/mcp";

const quicknode = defineProvider({
  name: "Quicknode",
  hosts: ["api.quicknode.com", "mcp.quicknode.com"],
  auth: {
    // Admin, Streams and Webhooks REST APIs: a Quicknode API key sent in x-api-key.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Hosted MCP server: OAuth with dynamic client registration; access follows the Viewer or Admin role.
    oauth: oauth2({ discover: url }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, {
        url,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
    }
    const response = await fetch("https://api.quicknode.com/v0/account/info", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
    return {};
  },
});

export default defineApp(
  { user: { accounts: { quicknode: quicknode.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.quicknode ?? [],
        async (account) => {
          if (account.method === "oauth") {
            return withApprovals(
              await mcpRouter({
                url,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            );
          }
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          return router(
            {
              admin: approve(liveOpenapiRouter({ ...options, cache, fetch, signal, account })),
              streams: approve(liveOpenapiRouter({ ...streamsOptions, cache, fetch, signal, account })),
              webhooks: approve(liveOpenapiRouter({ ...webhooksOptions, cache, fetch, signal, account })),
            },
            { title: "Quicknode", description: "Quicknode REST APIs." },
          );
        },
        { signal },
      ),
      {
        title: "Quicknode",
        description:
          "Quicknode blockchain infrastructure. With an API key: admin (endpoints, chains, security, rate limits, usage, billing), streams and webhooks. With OAuth: the hosted MCP server for live chain data and endpoint management.",
        icons,
      },
    ),
  }),
);
