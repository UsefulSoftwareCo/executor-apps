import {
  accountRouter,
  defineApp,
  defineProvider,
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

const url = "https://api.bland.ai/v1/mcp";

// Bland's MCP server takes the organization API key as a bearer token.
const headers = (account: { fields: { token: string } }) => ({
  Authorization: `Bearer ${account.fields.token}`,
});

const blandai = defineProvider({
  name: "Bland AI",
  hosts: ["api.bland.ai"],
  auth: {
    // OAuth is not offered: Bland restricts OAuth to listed clients (ChatGPT, Claude, Claude Code) and documents dynamic client
    // registration as not yet available, even though its metadata advertises a registration endpoint and CIMD support.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { blandai: blandai.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.blandai ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool, name) =>
            // submit_feedback is tagged Read but sends a report to Bland's docs team using the org key, so it always asks.
            name !== "submit_feedback" && toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Bland AI",
        description: "Place and inspect AI phone calls, build pathways, manage agents, query analytics and run evals in Bland AI.",
        icons,
      },
    ),
  }),
);
