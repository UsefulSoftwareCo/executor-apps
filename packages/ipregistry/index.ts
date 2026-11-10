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

const url = "https://mcp.ipregistry.co/mcp";

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ Authorization: `ApiKey ${account.fields.token}` });

const ipregistry = defineProvider({
  name: "Ipregistry",
  hosts: ["mcp.ipregistry.co"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { ipregistry: ipregistry.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ipregistry ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Ipregistry",
        description:
          "IP geolocation, network, company, carrier, threat, autonomous-system and user-agent intelligence with Ipregistry.",
        icons,
      },
    ),
  }),
);
