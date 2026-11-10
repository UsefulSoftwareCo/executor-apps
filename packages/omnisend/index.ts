import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  router,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.omnisend.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account): Record<string, string> => ({
  Authorization: `Bearer ${account.fields.access_token}`,
});

const omnisend = defineProvider({
  name: "Omnisend",
  hosts: ["mcp.omnisend.com", "app.omnisend.com"],
  auth: {
    // The MCP server's protected-resource metadata names https://mcp.omnisend.com as the
    // authorization server, but the metadata served there reports issuer https://app.omnisend.com.
    // RFC 8414 discovery (which the Executor runtime enforces) rejects that mismatch, so the
    // endpoints are declared. Executor does not register a client for declared endpoints; the
    // operator registers one at https://app.omnisend.com/oauth2/register (open DCR).
    oauth: oauth2({
      authorizationUrl: "https://app.omnisend.com/oauth2/authorize",
      tokenUrl: "https://app.omnisend.com/oauth2/token",
      revocationUrl: "https://app.omnisend.com/oauth2/revoke",
      issuer: "https://app.omnisend.com",
      scopes: [
        "contacts.read", "contacts.write", "products.read", "products.write",
        "events.read", "events.write", "brands.read", "brands.write",
        "automations.read", "automations.write", "campaigns.read", "campaigns.write",
        "analytics.read", "reports.read", "segments.read", "segments.write",
        "email-templates.read", "email-templates.write", "images.read", "images.write",
        "forms.read", "forms.write", "brand-assets.read", "brand-assets.write",
      ],
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { omnisend: omnisend.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.omnisend ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Omnisend",
        description: "Contacts, campaigns, automations, segments, products, forms and analytics in Omnisend.",
        icons,
      },
    ),
  }),
);
