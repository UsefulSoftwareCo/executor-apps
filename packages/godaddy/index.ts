import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { v1Options, v2Options } from "./openapi.js";

const mcpUrl = "https://api.godaddy.com/v1/domains/mcp";

const godaddy = defineProvider({
  name: "GoDaddy",
  hosts: ["api.godaddy.com"],
  auth: {
    // GoDaddy has no OAuth for the Domains APIs; a Personal Access Token is created in the developer dashboard.
    apiKey: secrets({
      label: "Personal Access Token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.godaddy.com/v1/domains?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { godaddy: godaddy.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.godaddy ?? [],
        async (account) => {
          const openapi = (options: Parameters<typeof liveOpenapiRouter>[0] extends infer O ? Omit<O & object, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              v2: openapi(v2Options),
              v1: openapi(v1Options),
              // The public MCP server answers without credentials.
              mcp: withApprovals(await mcpRouter({ url: mcpUrl, account, signal }), (tool) =>
                toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
              ),
            },
            { title: "GoDaddy", description: "GoDaddy Domains." },
          );
        },
        { signal },
      ),
      {
        title: "GoDaddy",
        description:
          "GoDaddy domains. v2 and v1: Domains APIs (availability, registration, renewal, contacts, nameservers, DNS records, forwarding, agreements). mcp: domain search and AI suggestions.",
        icons,
      },
    ),
  }),
);
