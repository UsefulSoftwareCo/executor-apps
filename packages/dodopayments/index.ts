import {
  accountRouter,
  decodeJson,
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
import { liveOpenapiRouter } from "apps/openapi";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { liveOrigin, options, testOrigin } from "./openapi.js";

const mcpUrl = "https://mcp.dodopayments.com/mcp";

function origin(environment: string): string {
  const name = environment.trim().toLowerCase();
  if (name === "live") return liveOrigin;
  if (name === "test") return testOrigin;
  throw new Error('Environment must be "live" or "test".');
}

const dodopayments = defineProvider({
  name: "Dodo Payments",
  hosts: ["live.dodopayments.com", "test.dodopayments.com", "mcp.dodopayments.com"],
  auth: {
    // REST API key (Developer > API Keys). A key works only on the host of the mode it was created in.
    apiKey: secrets({
      label: "API key",
      fields: object({
        token: string({ minLength: 1 }),
        environment: string({ minLength: 1 }),
      }),
    }),
    // The hosted MCP server publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    if (check.account.method === "oauth") {
      return mcpHealth(check, {
        url: mcpUrl,
        headers: { Authorization: `Bearer ${check.account.fields.access_token}` },
      });
    }
    // A read-only key can list products; page_size=1 keeps the response small.
    const response = await check.fetch(`${origin(check.account.fields.environment)}/products?page_size=1`, {
      signal: check.signal,
      headers: { Authorization: `Bearer ${check.account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { dodopayments: dodopayments.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dodopayments ?? [],
        async (account) => {
          if (account.method === "oauth") {
            return withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            );
          }
          const base = origin(account.fields.environment);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: base, baseUrl: base, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Dodo Payments",
        description:
          "Payments, subscriptions, customers, products, discounts, licenses, refunds, disputes and usage billing in Dodo Payments.",
        instructions:
          'API-key accounts expose the full REST API against the live or test host chosen by the account\'s environment ("live" or "test"). OAuth accounts expose the tools of Dodo\'s hosted MCP server.',
        icons,
      },
    ),
  }),
);
