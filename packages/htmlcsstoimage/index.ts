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

const url = "https://mcp.hcti.io";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const hcti = defineProvider({
  name: "HTML/CSS to Image",
  hosts: ["mcp.hcti.io", "htmlcsstoimage.com"],
  auth: {
    // The authorization server (htmlcsstoimage.com) supports dynamic client registration and PKCE.
    oauth: oauth2({
      discover: url,
      scopes: [
        "images:create",
        "images:read",
        "images:delete",
        "images:store",
        "templates:read",
        "templates:create_update",
        "templates:delete",
        "proxies:read",
        "proxies:create_update",
        "proxies:delete",
        "storage_destinations:read",
        "storage_destinations:create_update",
        "storage_destinations:delete",
        "og_configs:read",
        "og_configs:create_update",
        "og_configs:delete",
        "usage:read",
      ],
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { hcti: hcti.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hcti ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "HTML/CSS to Image",
        description:
          "Render HTML, CSS and public URLs to PNG, JPG, WebP or PDF; manage templates, proxies, storage destinations and OG images.",
        icons,
      },
    ),
  }),
);
