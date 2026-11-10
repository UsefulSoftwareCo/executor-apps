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

const url = "https://stitch.googleapis.com/mcp";

type Account = { fields: { apiKey: string } };

const headers = (account: Account) => ({ "X-Goog-Api-Key": account.fields.apiKey });

const stitch = defineProvider({
  name: "Stitch",
  hosts: ["stitch.googleapis.com"],
  auth: {
    apiKey: secrets({
      label: "Stitch API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { stitch: stitch.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.stitch ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Stitch",
        description: "Projects, screens and design systems in Google Stitch: generate, edit and list UI designs.",
        icons,
      },
    ),
  }),
);
