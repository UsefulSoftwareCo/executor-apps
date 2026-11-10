import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  router,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.glideapps.dev/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const glide = defineProvider({
  name: "Glide",
  hosts: ["mcp.glideapps.dev"],
  auth: {
    // The server publishes OAuth metadata with dynamic client registration.
    // Pin the RFC 8707 resource to the value in the path-specific protected-resource
    // document (/.well-known/oauth-protected-resource/mcp, named by the 401 challenge),
    // which is the full MCP URL. The root document returns only the origin; do not use that.
    oauth: oauth2({ discover: url, resource: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { glide: glide.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.glide ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Glide",
        description: "Glide projects, apps, data and workflows (GlideOS).",
        icons,
      },
    ),
  }),
);
