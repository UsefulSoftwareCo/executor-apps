import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
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

const mcpUrl = "https://mcp.tomba.io/mcp";

type Account =
  | { method: "apiKey"; fields: { key: string; secret: string } }
  | { method: "oauth"; fields: { access_token: string } };

// An API key and secret go as Tomba's own headers; an OAuth token is a bearer token.
const headers = (account: Account): Record<string, string> =>
  account.method === "oauth"
    ? { Authorization: `Bearer ${account.fields.access_token}` }
    : { "X-Tomba-Key": account.fields.key, "X-Tomba-Secret": account.fields.secret };

const tomba = defineProvider({
  name: "Tomba",
  hosts: ["mcp.tomba.io", "api.tomba.io"],
  auth: {
    apiKey: secrets({
      label: "API key and secret",
      fields: object({ key: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
    }),
    // Tomba publishes OAuth metadata with dynamic client registration and PKCE.
    oauth: oauth2({ discover: mcpUrl }),
  },
  health: (check) => mcpHealth(check, { url: mcpUrl, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { tomba: tomba.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tomba ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url: mcpUrl, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Tomba",
        description:
          "Find, verify and enrich B2B emails, phone numbers and companies with Tomba: domain search, email finder and verifier, enrichment, company search, leads and account usage.",
        icons,
        instructions:
          "Finder, verifier and enrichment calls spend Tomba credits. usage_info and get_logs need an API key and secret; they fail under OAuth.",
      },
    ),
  }),
);
