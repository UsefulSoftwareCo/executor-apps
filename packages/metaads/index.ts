import { accountRouter, defineApp, defineProvider, object, oauth2, router, secrets, string, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.facebook.com/ads";

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "token"; fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const metaads = defineProvider({
  name: "Meta Ads",
  hosts: ["mcp.facebook.com", "graph.facebook.com", "www.facebook.com"],
  auth: {
    // Meta's discovery metadata is unusable (issuer https://www.facebook.com/ads does not match the
    // metadata at facebook.com, no token_endpoint) and there is no dynamic client registration, so the
    // connect page asks for the user's own Meta app (App ID as client ID, App Secret). Endpoints are
    // Facebook Login for Business's.
    oauth: oauth2({
      authorizationUrl: "https://www.facebook.com/v26.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v26.0/oauth/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopeSeparator: ",",
      // The permissions Meta's get-started page lists for the Ads MCP server.
      scopes: [
        "ads_mcp_management",
        "ads_read",
        "ads_management",
        "catalog_management",
        "business_management",
        "pages_show_list",
        "instagram_basic",
      ],
    }),
    // Meta documents a user access token (Graph API Explorer or own OAuth flow) sent as a bearer header.
    token: secrets({
      label: "User access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { metaads: metaads.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.metaads ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Meta Ads",
        description: "Campaigns, ad sets, ads, creatives, catalogs and performance insights for Meta ad accounts.",
        icons,
      },
    ),
  }),
);
