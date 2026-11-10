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

const url = "https://mcp.scrapfly.io/mcp";

const scrapfly = defineProvider({
  name: "Scrapfly",
  hosts: ["mcp.scrapfly.io"],
  auth: {
    // Project API key, sent as a bearer token (the docs' header form, not the ?key= query form).
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  health: (check) =>
    mcpHealth(check, {
      url,
      headers: {
        Authorization: `Bearer ${
          check.account.method === "oauth" ? check.account.fields.access_token : check.account.fields.token
        }`,
      },
    }),
});

export default defineApp(
  { user: { accounts: { scrapfly: scrapfly.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.scrapfly ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({
              url,
              account,
              headers: {
                Authorization: `Bearer ${
                  account.method === "oauth" ? account.fields.access_token : account.fields.token
                }`,
              },
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Scrapfly",
        description:
          "Scrape web pages with anti-bot bypass, take screenshots, extract data and drive cloud browsers with Scrapfly.",
        icons,
      },
    ),
  }),
);
