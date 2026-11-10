import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const pipelinecrm = defineProvider({
  name: "Pipeline CRM",
  hosts: ["api.pipelinecrm.com"],
  auth: {
    apiToken: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    legacyApiKey: secrets({
      label: "Legacy API key and app key",
      fields: object({ apiKey: string({ minLength: 1 }), appKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "apiToken"
        ? { Authorization: `Bearer ${account.fields.token}` }
        : { Authorization: `Bearer ${account.fields.apiKey}`, "app-key": String(account.fields.appKey) };
    const response = await fetch("https://api.pipelinecrm.com/api/v3/users?per_page=1", { signal, headers });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { pipelinecrm: pipelinecrm.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pipelinecrm ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Pipeline CRM",
        description: "Deals, people, companies, activities, tasks, projects and custom fields in Pipeline CRM.",
        icons,
      },
    ),
  }),
);
