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
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Verify = object({ result: object({ id: string(), status: string() }) });

// Cloudflare's official remote MCP server (search and execute over the whole API, plus docs). It
// registers clients itself (dynamic client registration and Client ID Metadata Documents), and the
// user picks the token's permissions on Cloudflare's consent screen.
const mcpUrl = "https://mcp.cloudflare.com/mcp";

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "apiToken"; fields: { token: string } }
  | { method: "accountToken"; fields: { accountId: string; token: string } };

// The MCP server takes the sign-in token and both kinds of API token as bearer tokens.
const mcpHeaders = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const cloudflare = defineProvider({
  name: "Cloudflare",
  hosts: ["mcp.cloudflare.com", "api.cloudflare.com"],
  auth: {
    // First, so the connect page starts with it. Its tokens only work on the MCP server.
    oauth: oauth2({ discover: mcpUrl }),
    // User-owned token: dash.cloudflare.com/profile/api-tokens
    apiToken: secrets({
      label: "User API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Account-owned token (service principal): Manage Account > API Tokens. Verified per account.
    accountToken: secrets({
      label: "Account API token",
      fields: object({ accountId: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") return mcpHealth(check, { url: mcpUrl, headers: mcpHeaders(account) });
    const url =
      account.method === "accountToken"
        ? `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account.fields.accountId)}/tokens/verify`
        : "https://api.cloudflare.com/client/v4/user/tokens/verify";
    const response = await fetch(url, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const body = await decodeJson(response, Verify);
    return { accountInfo: { externalId: body.result.id } };
  },
});

export default defineApp(
  { user: { accounts: { cloudflare: cloudflare.many() } }, icons },
  async ({ user, cache, fetch, signal }) => {
    const accounts = user?.accounts.cloudflare ?? [];
    return {
      tools: router(
        {
          mcp: router(
            await accountRouter(
              accounts,
              async (account) =>
                withApprovals(
                  await mcpRouter({ url: mcpUrl, account, headers: mcpHeaders(account), cache, signal }),
                  (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
                ),
              { signal },
            ),
            {
              title: "Cloudflare MCP",
              description:
                "Cloudflare's MCP server: search the Cloudflare API and run code against it, and search Cloudflare's docs.",
            },
          ),
          // MCP sign-in tokens only work on the MCP server, so the REST API serves API-token accounts.
          api: router(
            await accountRouter(
              accounts.flatMap((account) => (account.method === "oauth" ? [] : [account])),
              (account) =>
                withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                  tool.kind === "mutation" ? always() : undefined,
                ),
              { signal },
            ),
            {
              title: "Cloudflare API",
              description:
                "Zones, DNS, Workers, R2, Zero Trust, firewall, caching, load balancing and the rest of the Cloudflare REST API, for accounts connected with an API token.",
            },
          ),
        },
        {
          title: "Cloudflare",
          description:
            "Zones, DNS, Workers, R2, Zero Trust, firewall, caching and the rest of Cloudflare, through Cloudflare's MCP server (mcp), plus one tool per REST operation for API-token accounts (api).",
          icons,
        },
      ),
    };
  },
);
