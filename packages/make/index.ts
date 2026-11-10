import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  number,
  object,
  plain,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const oauthUrl = "https://mcp.make.com";

// Make hosts each organization in a zone such as eu2.make.com or us1.make.celonis.com.
const zoneMcpUrl = (zone: string) => {
  const match = /^(?:https?:\/\/)?((?:[a-z0-9-]+)\.make\.(?:com|celonis\.com))(?:\/.*)?$/.exec(
    zone.trim().toLowerCase(),
  );
  if (match === null) throw new Error("Enter your Make zone, for example eu2.make.com.");
  return `https://${match[1]}/mcp`;
};

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "token"; fields: { zone: string; token: string } };

const zoneOrigin = (zone: string) => new URL(zoneMcpUrl(zone)).origin;

const AuthUser = object({ authUser: object({ id: number(), name: string() }) });

const connection = (account: Account) =>
  account.method === "oauth"
    ? { url: oauthUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } }
    : { url: zoneMcpUrl(account.fields.zone), headers: { Authorization: `Bearer ${account.fields.token}` } };

const make = defineProvider({
  name: "Make",
  hosts: ["mcp.make.com", "*.make.com", "*.make.celonis.com"],
  auth: {
    // Official hosted MCP server: OAuth with dynamic client registration and PKCE S256.
    oauth: oauth2({ discover: oauthUrl }),
    // A token created in the Make profile (Profile > API access), used for the MCP endpoint of the
    // organization's zone (needs the mcp:use scope) and for the REST API (needs the API scopes).
    token: secrets({
      label: "API/MCP token and zone",
      fields: object({ zone: plain(string({ minLength: 1 })), token: string({ minLength: 1 }) }),
    }),
  },
  async health(check) {
    const { account } = check;
    if (account.method === "oauth") return mcpHealth(check, connection(account));
    // REST first (needs user:read); a token that only has mcp:use falls back to the MCP endpoint.
    try {
      const response = await check.fetch(`${zoneOrigin(account.fields.zone)}/api/v2/users/me`, {
        signal: check.signal,
        headers: { Authorization: `Token ${account.fields.token}` },
      });
      const me = await decodeJson(response, AuthUser);
      return { accountInfo: { externalId: String(me.authUser.id), displayName: me.authUser.name } };
    } catch {
      return mcpHealth(check, connection(account));
    }
  },
});

export default defineApp(
  { user: { accounts: { make: make.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.make ?? [],
        async (account) => {
          const mcp = withApprovals(await mcpRouter({ ...connection(account), account, signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          );
          // The REST API accepts API tokens (and approved OAuth clients, which this app does not offer).
          if (account.method !== "token") return router({ mcp }, { title: "Make MCP" });
          const origin = zoneOrigin(account.fields.zone);
          const api = withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api/v2`,
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
          return router({ mcp, api }, { title: "Make" });
        },
        { signal },
      ),
      {
        title: "Make",
        description:
          "Run Make scenarios and manage scenarios, connections, webhooks, data stores, teams and organizations.",
        icons,
      },
    ),
  }),
);
