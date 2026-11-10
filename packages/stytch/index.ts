import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { liveOpenapiRouter } from "apps/openapi";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const url = "https://mcp.stytch.dev/mcp";

const stytch = defineProvider({
  name: "Stytch",
  hosts: ["api.stytch.com", "mcp.stytch.dev", "rustic-kilogram-6347.customers.stytch.com"],
  auth: {
    // Project API: the project ID and secret of one live project (Dashboard, API keys).
    apiKey: secrets({
      label: "Project ID and secret",
      fields: object({ project_id: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
    }),
    // Workspace MCP: OAuth with dynamic client registration. Scopes are the ones the server's
    // protected-resource metadata advertises, minus live API key management.
    oauth: oauth2({
      discover: url,
      scopes: [
        "openid",
        "email",
        "profile",
        "admin:projects",
        "manage:project_settings",
        "manage:project_data",
        "manage:api_keys:test",
      ],
    }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, {
        url,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
    }
    // GET /v1/debug/whoami is a light, read-only project endpoint: 200 with the project ID for
    // valid credentials, 401 for invalid ones.
    const response = await fetch("https://api.stytch.com/v1/debug/whoami", {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.project_id}:${account.fields.secret}`)}`,
      },
    });
    if (response.status === 401) throw new Error("Stytch rejected the project ID and secret (401)");
    await decodeJson(response, object({ project_id: string() }));
  },
});

export default defineApp(
  { user: { accounts: { stytch: stytch.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.stytch ?? [],
        async (account) => {
          if (account.method === "oauth") {
            return withApprovals(
              await mcpRouter({
                url,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            );
          }
          return withApprovals(
            liveOpenapiRouter({ ...options, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Stytch",
        description:
          "Stytch authentication: users, B2B organizations and members, sessions, passwords, OTP, magic links, OAuth, passkeys, Connected Apps, plus workspace management over MCP.",
        icons,
      },
    ),
  }),
);
