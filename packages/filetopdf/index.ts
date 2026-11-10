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

const url = "https://api.filetopdf.dev/mcp";

const headers = (account: { fields: { token: string } }) => ({ "x-api-key": account.fields.token });

const filetopdf = defineProvider({
  name: "FileToPDF.dev",
  hosts: ["api.filetopdf.dev"],
  auth: {
    // The hosted MCP server accepts the API key in x-api-key; it publishes no OAuth.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { filetopdf: filetopdf.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.filetopdf ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "FileToPDF.dev",
        description: "Convert files, HTML and Markdown to PDF and check the remaining conversion credits.",
        icons,
      },
    ),
  }),
);
