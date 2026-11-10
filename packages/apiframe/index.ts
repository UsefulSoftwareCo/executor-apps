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

const url = "https://mcp.apiframe.ai";

type Account = { method: "apiKey"; fields: { apiKey: string } };

const headers = (account: Account) => ({ "X-API-Key": account.fields.apiKey });

const apiframe = defineProvider({
  name: "Apiframe",
  hosts: ["mcp.apiframe.ai"],
  auth: {
    // Apiframe's documented MCP access: the same API key as the REST API, sent as X-API-Key.
    apiKey: secrets({
      label: "Apiframe API key (console.apiframe.ai > API Keys)",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { apiframe: apiframe.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.apiframe ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Apiframe",
        description:
          "Generate images, video and music with 70+ models, edit and upscale media, remove backgrounds, and check generation jobs with Apiframe.",
        icons,
      },
    ),
  }),
);
