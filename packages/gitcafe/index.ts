import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// GitCafe's official remote MCP server (https://git.cafe/docs/account/mcp-connections).
const url = "https://git.cafe/mcp";

// The server answers an unauthenticated initialize, so discovery finds no challenge and would
// fall back to the protected resource's scopes_supported: every permission, admin included,
// which also limits how many repositories the consent screen lets a person select. These are
// the union of the scopes the server's own 401 challenges name for its tools: the five read
// scopes, plus the write scope of each write tool (issues, comments, pull requests, reviews,
// merges and server-side commits).
const scopes = [
  "repo:contents:read",
  "issue:contents:read",
  "pr:contents:read",
  "pr:review:read",
  "comment:contents:read",
  "repo:contents:write",
  "issue:contents:write",
  "comment:contents:write",
  "pr:contents:write",
  "pr:review:write",
  "pr:merge:write",
];

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const gitcafe = defineProvider({
  name: "GitCafe",
  hosts: ["git.cafe"],
  auth: {
    // Discovered from the MCP server's protected-resource metadata (issuer https://git.cafe): dynamic
    // client registration, public clients with S256 PKCE (token_endpoint_auth_methods_supported is
    // only "none"), and the resource indicator https://git.cafe/mcp. Tokens for the REST API are a
    // separate audience and do not work here, so there is no personal access token method.
    oauth: oauth2({ discover: url, scopes, tokenEndpointAuthMethod: "none" }),
  },
  // Not mcpHealth: that check passes only when the server refuses requests without credentials,
  // and this server serves public repositories to anyone, so it would never verify an account.
  // The server does refuse a token it does not accept (401 invalid_token on initialize), so an
  // initialize with the account's token is the check.
  async health(check) {
    const response = await check.fetch(url, {
      method: "POST",
      signal: check.signal,
      headers: { ...headers(check.account), "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "executor-health", version: "1" } },
      }),
    });
    await decodeJson(response, object({ result: object({ protocolVersion: string() }) }));
  },
});

export default defineApp(
  { user: { accounts: { gitcafe: gitcafe.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gitcafe ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), cache, signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "GitCafe",
        description:
          "Repositories, code, branches and tags, code search, issues, pull requests, diffs, reviews, comments, merges, server-side commits and CI results on GitCafe, through GitCafe's MCP server.",
        instructions:
          "Each account reaches only the repositories chosen when it was connected: get_me says whether that is every repository the person can access or a selection, and list_repositories lists them. Repositories imported from GitHub may sync both ways, so comments, reviews and merges on them can also appear on GitHub. Read-only tools run without approval; everything else asks, including submit_feedback, which sends a report to the GitCafe team.",
        icons,
      },
    ),
  }),
);
