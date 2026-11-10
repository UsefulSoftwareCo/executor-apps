import {
  accountRouter,
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
import { icons } from "./icon.js";

const mcpUrl = "https://mcp.bolna.ai/api/mcp";

const bolna = defineProvider({
  name: "Bolna",
  hosts: ["mcp.bolna.ai", "hbcyinehbjcanmnqywtg.supabase.co"],
  auth: {
    // Bolna API key (bn-... or sub-account sa-...), sent as a Bearer token to the MCP server.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server advertises OAuth (Supabase auth, dynamic client registration, PKCE).
    // Explicit: the MCP resource advertises only "email"; offline_access (advertised by the Supabase
    // authorization server) is needed for a refresh token so the short-lived access token can renew.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account } = check;
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${token}` } });
  },
});

export default defineApp(
  { user: { accounts: { bolna: bolna.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bolna ?? [],
        async (account) => {
          const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
          return withApprovals(
            await mcpRouter({ url: mcpUrl, account, headers: { Authorization: `Bearer ${token}` }, signal }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          );
        },
        { signal },
      ),
      {
        title: "Bolna",
        description:
          "Build and run Bolna voice AI agents: agents, outbound calls and executions, batches, dispositions, knowledgebases, phone numbers, SIP trunks, workflows, sub-accounts and documentation search.",
        icons,
      },
    ),
  }),
);
