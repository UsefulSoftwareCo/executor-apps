import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.mermaid.ai/mcp";

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Mermaid's docs show API tokens sent as the raw Authorization value, with no Bearer prefix.
// OAuth access tokens are sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: account.method === "oauth" ? `Bearer ${account.fields.access_token}` : account.fields.token,
});

const mermaidchart = defineProvider({
  name: "Mermaid Chart",
  hosts: ["mcp.mermaid.ai"],
  auth: {
    // API token generated in Mermaid account settings (a free Basic account is enough).
    token: secrets({
      label: "Mermaid API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { mermaidchart: mermaidchart.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mermaidchart ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Mermaid Chart",
        description:
          "Validate and render Mermaid diagrams, get diagram titles and summaries, and list, create, read and update projects and diagrams in a Mermaid Chart account.",
        icons,
      },
    ),
  }),
);
