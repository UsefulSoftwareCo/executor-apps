import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Groups = object({ "@odata.context": string() });

const powerbi = defineProvider({
  name: "Microsoft Power BI",
  hosts: ["api.powerbi.com"],
  auth: {
    // Microsoft Entra v2 publishes OIDC metadata; the connect page asks for an app registration's client.
    oauth: oauth2({
      discover: "https://login.microsoftonline.com/common/v2.0",
      scopes: [
        "offline_access",
        "https://analysis.windows.net/powerbi/api/Workspace.ReadWrite.All",
        "https://analysis.windows.net/powerbi/api/Dataset.ReadWrite.All",
        "https://analysis.windows.net/powerbi/api/Report.ReadWrite.All",
        "https://analysis.windows.net/powerbi/api/Dashboard.ReadWrite.All",
        "https://analysis.windows.net/powerbi/api/Dataflow.ReadWrite.All",
        "https://analysis.windows.net/powerbi/api/Content.Create",
        "https://analysis.windows.net/powerbi/api/Capacity.Read.All",
        "https://analysis.windows.net/powerbi/api/App.Read.All",
        "https://analysis.windows.net/powerbi/api/Pipeline.ReadWrite.All",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.powerbi.com/v1.0/myorg/groups?$top=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    await decodeJson(response, Groups);
    return { accountInfo: {} };
  },
});

export default defineApp(
  { user: { accounts: { powerbi: powerbi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.powerbi ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Microsoft Power BI",
        description:
          "Power BI workspaces (groups), datasets, reports, dashboards, dataflows, imports, refreshes, DAX queries, gateways, capacities, apps and tenant admin APIs.",
        icons,
      },
    ),
  }),
);
