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

const url = "https://mcp.capturekit.dev/";

const headers = (account: {
  method: "apiKey" | "oauth";
  fields: { token?: string; access_token?: string };
}): Record<string, string> =>
  account.method === "apiKey"
    ? { "x-api-key": account.fields.token ?? "" }
    : { Authorization: `Bearer ${account.fields.access_token ?? ""}` };

const capturekit = defineProvider({
  name: "CaptureKit",
  hosts: ["mcp.capturekit.dev", "app.capturekit.dev"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata with dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { capturekit: capturekit.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.capturekit ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "CaptureKit",
        description:
          "Capture webpage screenshots, extract page content and metadata, crawl websites and analyze pages with AI.",
        icons,
      },
    ),
  }),
);
