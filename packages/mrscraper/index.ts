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

const url = "https://mcp.mrscraper.com/mcp";

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// API tokens and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const mrscraper = defineProvider({
  name: "MrScraper",
  hosts: ["mcp.mrscraper.com", "api.app.mrscraper.com"],
  auth: {
    token: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes protected-resource metadata and dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { mrscraper: mrscraper.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mrscraper ?? [],
        async (account) =>
          withApprovals(
            // The tool list needs credentials, so the server's read-only hints are unverified.
            // scrape saves scraper configs and rerun consumes quota: force both to mutations.
            await mcpRouter({ url, account, headers: headers(account), signal }, { scrape: "mutation", rerun: "mutation" }),
            (tool) => (tool.kind !== "mutation" && toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "MrScraper",
        description: "Fetch pages, extract structured data with AI scrapers, run Google searches and read stored results in MrScraper.",
        icons,
      },
    ),
  }),
);
