import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { liveOpenapiRouter } from "apps/openapi";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const mcpUrl = "https://mcp.aweber.com/mcp";

const Accounts = object({ entries: array(object({ id: number() })) });

const aweber = defineProvider({
  name: "AWeber",
  hosts: ["mcp.aweber.com", "api.aweber.com", "auth.aweber.com"],
  auth: {
    // The MCP server publishes OAuth metadata with dynamic client registration; scopes are its scopes_supported.
    oauth: oauth2({ discover: mcpUrl }),
    // REST API: no client registration; the connect page asks for the client of an app made at labs.aweber.com.
    restOauth: oauth2({
      authorizationUrl: "https://auth.aweber.com/oauth2/authorize",
      tokenUrl: "https://auth.aweber.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "account.read",
        "list.read",
        "list.write",
        "subscriber.read",
        "subscriber.write",
        "email.read",
        "email.write",
        "landing-page.read",
      ],
    }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch("https://api.aweber.com/1.0/accounts", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const accounts = await decodeJson(response, Accounts);
    const first = accounts.entries[0];
    return first === undefined ? {} : { accountInfo: { externalId: String(first.id) } };
  },
});

export default defineApp(
  { user: { accounts: { aweber: aweber.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.aweber ?? [],
        async (account) => {
          if (account.method === "oauth") {
            return withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            );
          }
          return withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          );
        },
        { signal },
      ),
      {
        title: "AWeber",
        description:
          "Email lists, subscribers, tags, custom fields, segments, broadcasts, campaigns and landing pages through AWeber's REST API or its remote MCP server.",
        icons,
      },
    ),
  }),
);
