import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Me = object({ id: string() });

const sharepoint = defineProvider({
  name: "SharePoint",
  hosts: ["graph.microsoft.com"],
  auth: {
    // Microsoft Entra v2 delegated flow. The multi-tenant "common" authority's discovery document
    // advertises a templated issuer ({tenantid}), so the endpoints are declared instead of discovered.
    // The connect page asks for the app registration's client, which must be multi-tenant.
    oauth: oauth2({
      authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "offline_access",
        "User.Read",
        "Sites.ReadWrite.All",
        "Files.ReadWrite.All",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=id", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { sharepoint: sharepoint.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sharepoint ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SharePoint",
        description:
          "SharePoint Online through Microsoft Graph: sites, lists, list items and columns, content types, document libraries and drives, files and folders (upload, download, copy, share links, versions), site pages, permissions and cross-site search. Find a site with search-query or the sites tools (use the site id from the response, or `root` for the tenant root site), then its lists with the site's lists tool and its document libraries with the site's drives tool. Drive and item ids come from those responses.",
        icons,
      },
    ),
  }),
);
