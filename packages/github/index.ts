import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const User = object({ id: number(), login: string(), avatar_url: string(), html_url: string() });

// GitHub's official remote MCP server, default toolsets. It accepts the same tokens as the REST API.
const mcpUrl = "https://api.githubcopilot.com/mcp/";

const github = defineProvider({
  name: "GitHub",
  hosts: ["api.github.com", "api.githubcopilot.com"],
  auth: {
    // First, so the connect page starts with it. GitHub registers no clients, but Executor Cloud has
    // its own GitHub App for exactly these endpoints with no scopes (a GitHub App's permissions are
    // set on the app), so signing in there needs no OAuth app of the user's own. Elsewhere the
    // connect page asks for a client: register a GitHub App, since an OAuth app's token without
    // scopes can only read public data.
    oauth: oauth2({
      authorizationUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.github.com/user", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    const me = await decodeJson(response, User);
    return {
      accountInfo: {
        externalId: String(me.id),
        username: me.login,
        avatarUrl: me.avatar_url,
        profileUrl: me.html_url,
      },
    };
  },
});

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "token"; fields: { token: string } };

const token = (account: Account) => (account.method === "oauth" ? account.fields.access_token : account.fields.token);

export default defineApp(
  { user: { accounts: { github: github.many() } }, icons },
  async ({ user, cache, fetch, signal }) => {
    const accounts = user?.accounts.github ?? [];
    return {
      tools: router(
        {
          mcp: router(
            await accountRouter(
              accounts,
              async (account) =>
                withApprovals(
                  await mcpRouter({
                    url: mcpUrl,
                    account,
                    headers: { Authorization: `Bearer ${token(account)}` },
                    cache,
                    signal,
                  }),
                  (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
                ),
              { signal },
            ),
            {
              title: "GitHub MCP",
              description:
                "GitHub's MCP server: repositories, code search, issues, pull requests and users, shaped for agents.",
            },
          ),
          api: router(
            await accountRouter(
              accounts,
              (account) =>
                withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                  tool.kind === "mutation" ? always() : undefined,
                ),
              { signal },
            ),
            {
              title: "GitHub API",
              description:
                "Repositories, issues, pull requests, Actions, releases, organizations and the rest of the GitHub REST API.",
            },
          ),
        },
        {
          title: "GitHub",
          description:
            "Repositories, code search, issues, pull requests and users through GitHub's MCP server (mcp), plus Actions, releases, organizations and the rest of the GitHub REST API (api).",
          instructions: "Prefer the mcp tools; use the api tools for what they do not cover.",
          icons,
        },
      ),
    };
  },
);
