import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const User = object({ uuid: string(), display_name: string() });

const bitbucket = defineProvider({
  name: "Bitbucket",
  hosts: ["api.bitbucket.org", "bitbucket.org"],
  auth: {
    apiToken: secrets({
      label: "Atlassian account email and API token",
      fields: object({
        email: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
    accessToken: secrets({
      label: "Repository, project or workspace access token",
      fields: object({
        // A name to tell this token apart, for example the repository it belongs to.
        // Bitbucket returns no account id for these tokens, so this label is the account identity.
        label: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
    // The user creates an OAuth consumer under Workspace settings > OAuth consumers.
    oauth: oauth2({
      authorizationUrl: "https://bitbucket.org/site/oauth2/authorize",
      tokenUrl: "https://bitbucket.org/site/oauth2/access_token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "account",
        "email",
        "repository",
        "repository:write",
        "pullrequest",
        "pullrequest:write",
        "issue",
        "issue:write",
        "pipeline",
        "pipeline:write",
        "pipeline:variable",
        "project",
        "snippet",
        "snippet:write",
        "webhook",
        "wiki",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const authorization =
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : account.method === "accessToken"
          ? `Bearer ${account.fields.token}`
          : `Basic ${btoa(`${account.fields.email}:${account.fields.token}`)}`;
    // Workspace and repository access tokens cannot read /user, so they only prove themselves
    // against the workspaces endpoint (untested live); /user is used for every other method
    // (an API token needs the read:user:bitbucket scope for it).
    const response = await fetch(
      account.method === "accessToken" ? "https://api.bitbucket.org/2.0/workspaces?pagelen=1" : "https://api.bitbucket.org/2.0/user",
      { signal, headers: { Authorization: authorization, Accept: "application/json" } },
    );
    if (account.method === "accessToken") {
      if (!response.ok) throw new Error(`Bitbucket rejected the access token (${response.status})`);
      return { accountInfo: { externalId: account.fields.label, displayName: account.fields.label } };
    }
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: me.uuid, displayName: me.display_name } };
  },
});

export default defineApp(
  { user: { accounts: { bitbucket: bitbucket.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bitbucket ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Bitbucket",
        description:
          "Bitbucket Cloud repositories, pull requests, issues, pipelines, commits, branches, snippets, workspaces and webhooks.",
        icons,
      },
    ),
  }),
);
