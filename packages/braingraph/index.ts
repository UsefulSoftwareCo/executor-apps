import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  router,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.itsbraingraph.ai/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const braingraph = defineProvider({
  name: "BrainGraph",
  hosts: ["mcp.itsbraingraph.ai", "itsbraingraph.ai"],
  auth: {
    // The server advertises dynamic client registration, S256 PKCE and the scopes brain:read, documents:write, brain:agents.
    oauth: oauth2({ discover: "https://mcp.itsbraingraph.ai" }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { braingraph: braingraph.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.braingraph ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "BrainGraph",
        description:
          "Search a BrainGraph knowledge graph and ingest documents, text, web pages, audio and YouTube videos into it.",
        icons,
      },
    ),
  }),
);
