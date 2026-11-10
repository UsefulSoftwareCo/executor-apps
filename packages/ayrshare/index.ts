import { accountRouter, decodeJson, defineApp, defineProvider, object, router, secrets, string, toolAnnotations, withApprovals } from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://api.ayrshare.com/mcp";

const ayrshare = defineProvider({
  name: "Ayrshare",
  hosts: ["api.ayrshare.com"],
  auth: {
    // The MCP server accepts the account API key as a bearer token; it publishes no OAuth metadata.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The MCP server answers initialize and tools/list anonymously, so mcpHealth would flag every account as anonymous access.
  // GET /api/user needs the key (Ayrshare answers a bad key with an error) and always returns refId.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.ayrshare.com/api/user", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const profile = await decodeJson(response, object({ refId: string() }));
    return { accountInfo: { externalId: profile.refId } };
  },
});

export default defineApp(
  { user: { accounts: { ayrshare: ayrshare.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ayrshare ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({
              url,
              account,
              headers: { Authorization: `Bearer ${account.fields.token}` },
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Ayrshare",
        description: "Publish and schedule posts across social networks and read history, analytics, comments, messages and profiles in Ayrshare.",
        icons,
      },
    ),
  }),
);
