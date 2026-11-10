import {
  accountRouter,
  decodeJson,
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
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const url = "https://mcp.browserless.io/mcp";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// OAuth access tokens are sent to the MCP server as bearer tokens.
const headers = (account: Extract<Account, { method: "oauth" }>) => ({
  Authorization: `Bearer ${account.fields.access_token}`,
});

const browserless = defineProvider({
  name: "Browserless",
  hosts: ["production-sfo.browserless.io", "mcp.browserless.io"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // OAuth exists only on the hosted MCP server, which advertises dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  // API token accounts use the REST API; /active needs a valid token and changes nothing.
  async health(check) {
    if (check.account.method === "oauth") return mcpHealth(check, { url, headers: headers(check.account) });
    const response = await check.fetch(
      `https://production-sfo.browserless.io/active?token=${encodeURIComponent(check.account.fields.token)}`,
      { signal: check.signal },
    );
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { browserless: browserless.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.browserless ?? [],
        async (account) =>
          account.method === "oauth"
            ? withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
                toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
              )
            : withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                tool.kind === "mutation" ? always() : undefined,
              ),
        { signal },
      ),
      {
        title: "Browserless",
        description:
          "Drive cloud headless browsers: browser agent, smart scraping, crawling, search, site maps, screenshots, PDFs, functions, sessions and profiles.",
        icons,
      },
    ),
  }),
);
