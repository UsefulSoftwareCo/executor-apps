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

const usUrl = "https://mcp.mixpanel.com/mcp";
const euUrl = "https://mcp-eu.mixpanel.com/mcp";
const inUrl = "https://mcp-in.mixpanel.com/mcp";

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "serviceAccount"; fields: { username: string; secret: string } };

// Service accounts (Beta) send "Bearer Basic <base64(username:secret)>" per Mixpanel's MCP docs.
const headers = (account: Account) => ({
  Authorization:
    account.method === "oauth"
      ? `Bearer ${account.fields.access_token}`
      : `Bearer Basic ${btoa(`${account.fields.username}:${account.fields.secret}`)}`,
});

// Mixpanel's mandatory scopes plus the optional ones the tools use. Beta scopes
// (experiments, feature flags, audit log) are left out.
const scopes = [
  "projects", "analysis", "events", "insights", "segmentation", "retention", "data:read",
  "funnels", "flows", "data_definitions", "dashboard_reports", "bookmarks", "user_details",
  "business_context",
];

const provider = (name: string, host: string, url: string) =>
  defineProvider({
    name,
    hosts: [host],
    auth: {
      oauth: oauth2({ discover: url, scopes }),
      serviceAccount: secrets({
        label: "Service account (Beta)",
        fields: object({ username: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
      }),
    },
    health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
  });

const mixpanel = provider("Mixpanel", "mcp.mixpanel.com", usUrl);
const mixpanelEu = provider("Mixpanel (EU)", "mcp-eu.mixpanel.com", euUrl);
const mixpanelIn = provider("Mixpanel (India)", "mcp-in.mixpanel.com", inUrl);

export default defineApp(
  { user: { accounts: { mixpanel: mixpanel.many(), mixpanelEu: mixpanelEu.many(), mixpanelIn: mixpanelIn.many() } }, icons },
  async ({ user, cache, signal }) => {
    const mount = (url: string) => async (account: Account & { readonly id: string }) =>
      withApprovals(await mcpRouter({ url, account, headers: headers(account), cache, signal }), (tool) =>
        toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
      );
    return {
      tools: router(
        router(
          {
            us: await accountRouter(user?.accounts.mixpanel ?? [], mount(usUrl), { signal }),
            eu: await accountRouter(user?.accounts.mixpanelEu ?? [], mount(euUrl), { signal }),
            in: await accountRouter(user?.accounts.mixpanelIn ?? [], mount(inUrl), { signal }),
          },
          { title: "Mixpanel", description: "Mixpanel product analytics.", icons },
        ),
        {
          title: "Mixpanel",
          description:
            "Mixpanel product analytics: run insights, funnels, retention and flows queries, browse events, properties, cohorts, dashboards and reports. Use the us group for US data residency, eu for EU and in for India.",
          icons,
        },
      ),
    };
  },
);
