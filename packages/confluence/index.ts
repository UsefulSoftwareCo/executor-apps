import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { oauthOptions, siteUrl, tokenOptions } from "./openapi.js";

const Spaces = object({ results: array(object({ id: string() })) });

const confluence = defineProvider({
  name: "Confluence",
  hosts: ["*.atlassian.net", "api.atlassian.com"],
  auth: {
    token: secrets({
      label: "API token",
      fields: object({
        site: plain(string({ minLength: 1 })),
        email: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
    // The OAuth 2.0 (3LO) app is created by the user in the Atlassian developer console.
    OAuth2: oauth2({
      authorizationUrl: "https://auth.atlassian.com/authorize",
      tokenUrl: "https://auth.atlassian.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [
        "offline_access",
        "read:page:confluence",
        "read:space:confluence",
        "read:attachment:confluence",
        "read:comment:confluence",
        "read:content.metadata:confluence",
        "read:custom-content:confluence",
        "read:database:confluence",
        "read:embed:confluence",
        "read:folder:confluence",
        "read:hierarchical-content:confluence",
        "read:label:confluence",
        "read:task:confluence",
        "read:user:confluence",
        "read:whiteboard:confluence",
        "read:configuration:confluence",
        "read:space.permission:confluence",
        "read:app-data:confluence",
        "write:app-data:confluence",
        "write:page:confluence",
        "write:space:confluence",
        "write:attachment:confluence",
        "write:comment:confluence",
        "write:custom-content:confluence",
        "write:database:confluence",
        "write:embed:confluence",
        "write:folder:confluence",
        "write:task:confluence",
        "write:whiteboard:confluence",
        "delete:page:confluence",
        "delete:attachment:confluence",
        "delete:comment:confluence",
        "delete:custom-content:confluence",
        "delete:database:confluence",
        "delete:embed:confluence",
        "delete:folder:confluence",
        "delete:whiteboard:confluence",
      ],
      authorizationParams: { audience: "api.atlassian.com", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "OAuth2") {
      const response = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
        signal,
        headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
      });
      const sites = await decodeJson(response, array(object({ id: string(), name: string() })));
      const first = sites[0];
      if (!first) throw new Error("The token has no accessible Confluence sites");
      return { accountInfo: { externalId: first.id, displayName: first.name } };
    }
    const basic = btoa(`${account.fields.email}:${account.fields.token}`);
    const response = await fetch(`${siteUrl(account.fields.site)}/wiki/api/v2/spaces?limit=1`, {
      signal,
      headers: { Authorization: `Basic ${basic}`, Accept: "application/json" },
    });
    await decodeJson(response, Spaces);
    return { accountInfo: { externalId: account.fields.email, displayName: account.fields.email, email: account.fields.email } };
  },
});

const description =
  "Confluence Cloud pages, blog posts, spaces, comments, attachments, labels, folders, whiteboards, tasks and the rest of the Confluence Cloud REST API v2.";

export default defineApp(
  { user: { accounts: { confluence: confluence.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.confluence ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...(account.method === "OAuth2" ? oauthOptions : tokenOptions(account.fields.site)),
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Confluence",
        description,
        icons,
        instructions:
          "API token accounts are bound to one site. OAuth accounts reach every tool through the Atlassian gateway, so each tool takes a cloudId path parameter: the site id from GET https://api.atlassian.com/oauth/token/accessible-resources (the account's external id is the first site).",
      },
    ),
  }),
);
