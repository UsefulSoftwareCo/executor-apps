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

const onenote = defineProvider({
  name: "OneNote",
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
        "Notes.ReadWrite.All",
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
  { user: { accounts: { onenote: onenote.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.onenote ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "OneNote",
        description:
          "OneNote notebooks, section groups, sections and pages through Microsoft Graph, for the signed-in user (/me), Microsoft 365 groups and SharePoint sites. Page content is HTML: create pages by posting HTML, read it with the content tools, and change it with the onenotePatchContent tools. List notebooks first, then walk to sections and pages; ids are opaque strings. Only work or school accounts can reach group and site notebooks.",
        icons,
      },
    ),
  }),
);
