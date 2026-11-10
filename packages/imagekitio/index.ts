import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  oauth2,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const mcpUrl = "https://imagekit.io/mcp/dam";

const imagekit = defineProvider({
  name: "ImageKit",
  hosts: ["api.imagekit.io", "imagekit.io"],
  auth: {
    apiKey: secrets({
      label: "Private API key",
      fields: object({ privateKey: string({ minLength: 1 }) }),
    }),
    // ImageKit's official DAM MCP server (search, upload from a public URL, download); the only route to uploads.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, {
        url: mcpUrl,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
    }
    const response = await fetch("https://api.imagekit.io/v1/accounts/origins", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.privateKey}:`)}` },
    });
    if (!response.ok) throw new Error(`ImageKit rejected the private API key (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { imagekit: imagekit.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.imagekit ?? [],
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
          return withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          );
        },
        { signal },
      ),
      {
        title: "ImageKit",
        description:
          "Manage ImageKit media: files, folders, versions, tags, metadata, cache purge, bulk jobs, saved extensions, named transformations and account usage.",
        icons,
      },
    ),
  }),
);
