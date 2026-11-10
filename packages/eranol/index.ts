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

const url = "https://eranol-connector-production.up.railway.app/mcp";

const eranol = defineProvider({
  name: "Eranol",
  hosts: ["eranol-connector-production.up.railway.app"],
  auth: {
    // The connector reads the dashboard API key from the x-api-key header.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: { "x-api-key": check.account.fields.token } }),
});

export default defineApp(
  { user: { accounts: { eranol: eranol.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.eranol ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({ url, account, headers: { "x-api-key": account.fields.token }, signal }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Eranol",
        description:
          "Eranol FFmpeg API: merge, trim, caption and convert video, audio and images, generate images, and publish to X, TikTok, Instagram and YouTube.",
        icons,
      },
    ),
  }),
);
