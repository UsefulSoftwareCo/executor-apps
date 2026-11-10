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

const url = "https://quintadb.com/mcp";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// OAuth access tokens are bearer tokens; REST API keys go in X-Api-Key (vendor docs).
const headers = (account: Account): Record<string, string> =>
  account.method === "oauth"
    ? { Authorization: `Bearer ${account.fields.access_token}` }
    : { "X-Api-Key": account.fields.token };

const quintadb = defineProvider({
  name: "QuintaDB",
  hosts: ["quintadb.com"],
  auth: {
    oauth: oauth2({ discover: "https://quintadb.com", scopes: ["mcp"] }),
    apiKey: secrets({
      label: "REST API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { quintadb: quintadb.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.quintadb ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "QuintaDB",
        description: "Manage QuintaDB online databases: projects, forms, fields, records, reports, portals, automation and more.",
        icons,
      },
    ),
  }),
);
