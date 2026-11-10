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

const Me = object({ accountId: string(), displayName: string() });

const jira = defineProvider({
  name: "Jira",
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
        "read:jira-user",
        "read:jira-work",
        "write:jira-work",
        "manage:jira-project",
        "manage:jira-configuration",
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
      if (!first) throw new Error("The token has no accessible Jira sites");
      return { accountInfo: { externalId: first.id, displayName: first.name } };
    }
    const basic = btoa(`${account.fields.email}:${account.fields.token}`);
    const response = await fetch(`${siteUrl(account.fields.site)}/rest/api/3/myself`, {
      signal,
      headers: { Authorization: `Basic ${basic}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.accountId, displayName: me.displayName, email: account.fields.email } };
  },
});

const description =
  "Jira Cloud issues, projects, JQL search, users, workflows, fields, filters, dashboards and the rest of the Jira Cloud platform REST API.";

export default defineApp(
  { user: { accounts: { jira: jira.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.jira ?? [],
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
        title: "Jira",
        description,
        icons,
        instructions:
          "API token accounts are bound to one site. OAuth accounts reach every tool through the Atlassian gateway, so each tool takes a cloudId path parameter: the site id from GET https://api.atlassian.com/oauth/token/accessible-resources (the account's external id is the first site).",
      },
    ),
  }),
);
