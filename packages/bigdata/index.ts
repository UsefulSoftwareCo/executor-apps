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

const url = "https://mcp.bigdata.com/";

type Account = { method: "apiKey"; fields: { apiKey: string } };

const headers = (account: Account) => ({ "x-api-key": account.fields.apiKey });

const bigdata = defineProvider({
  name: "Bigdata.com",
  hosts: ["mcp.bigdata.com"],
  auth: {
    // Bigdata.com's documented key-based MCP access: an API key sent as the x-api-key header.
    apiKey: secrets({
      label: "Bigdata.com API key (Developer Platform > API Keys)",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { bigdata: bigdata.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bigdata ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Bigdata.com",
        description:
          "Search financial news, earnings transcripts, filings and company or entity data, and run research workflows with Bigdata.com.",
        icons,
      },
    ),
  }),
);
