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

const productionUrl = "https://mcp.checkhq.com/check/mcp";
const sandboxUrl = "https://mcp.sandbox.checkhq.com/check/mcp";

const apiKeyFields = object({ apiKey: string({ minLength: 1 }) });

// A Check API key is valid in one environment only, so each gets its own method.
const check = defineProvider({
  name: "Check",
  hosts: ["mcp.checkhq.com", "mcp.sandbox.checkhq.com"],
  auth: {
    apiKey: secrets({ label: "Production API key", fields: apiKeyFields }),
    sandboxApiKey: secrets({ label: "Sandbox API key", fields: apiKeyFields }),
    // Console login; the hosted MCP server publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: productionUrl }),
  },
  async health(check) {
    const { account } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: productionUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    return mcpHealth(check, {
      url: account.method === "sandboxApiKey" ? sandboxUrl : productionUrl,
      headers: { Authorization: `Bearer ${account.fields.apiKey}` },
    });
  },
});

export default defineApp(
  { user: { accounts: { check: check.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.check ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({
              url: account.method === "sandboxApiKey" ? sandboxUrl : productionUrl,
              account,
              headers: {
                Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.apiKey}`,
              },
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Check",
        description:
          "Check payroll: companies, employees, contractors, payrolls, taxes, benefits and forms through Check's hosted MCP server.",
        icons,
      },
    ),
  }),
);
